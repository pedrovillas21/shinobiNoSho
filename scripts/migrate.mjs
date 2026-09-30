#!/usr/bin/env node
/*
 * Migrações do banco no estilo Flyway.
 *
 * - Os scripts ficam em supabase/migrations/NNNN_descricao.sql e rodam em ordem de versão (NNNN).
 * - Cada script roda UMA vez, dentro de uma transação, e fica registrado em
 *   app_migrations.schema_history com um checksum. Se der erro, nada daquele script fica aplicado.
 * - Script já aplicado não pode mudar (o checksum confere); mudança no banco = script novo.
 * - Um cadeado (advisory lock) impede dois deploys de migrarem ao mesmo tempo.
 * - Banco montado à mão antes deste sistema: na primeira execução, scripts com
 *   "-- migrate:baseline-if <condição SQL>" cuja condição é verdadeira são só registrados (BASELINE),
 *   sem rodar de novo.
 *
 * Uso:
 *   node scripts/migrate.mjs            aplica o que falta (migrate)
 *   node scripts/migrate.mjs info       lista o estado de cada script
 *   node scripts/migrate.mjs validate   só confere checksums e ordem
 *   node scripts/migrate.mjs --build    modo do `npm run build` (decide sozinho se roda; veja shouldRunOnBuild)
 *
 * Conexão: DATABASE_URL (Supabase → Connect → Session pooler). Nunca vai para o navegador.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = process.env.MIGRATIONS_DIR || join(ROOT, "supabase", "migrations");
const CA_FILE = join(ROOT, "supabase", "ca.crt");
const SCHEMA = "app_migrations";
const TABLE = `${SCHEMA}.schema_history`;
const LOCK_KEY = 482_917_361; // número fixo do cadeado deste projeto
const FILE_RE = /^(\d+)_([\w-]+)\.sql$/;

const args = process.argv.slice(2);
const buildMode = args.includes("--build");
const command = args.find((a) => !a.startsWith("--")) ?? "migrate";

const log = (msg) => console.log(`[migrations] ${msg}`);

class MigrationError extends Error {}
/** Interrompe com mensagem clara; a conexão é fechada e o cadeado liberado antes de sair. */
const fail = (msg) => {
  throw new MigrationError(msg);
};

/* ------------------------------------------------------------------ quando rodar no build */

function shouldRunOnBuild() {
  const env = process.env.VERCEL_ENV; // production | preview | development (só existe na Vercel)
  if (process.env.SKIP_MIGRATIONS === "1") return log("SKIP_MIGRATIONS=1: pulando."), false;
  if (!process.env.DATABASE_URL) {
    if (env === "production") fail("DATABASE_URL não configurada no ambiente Production da Vercel. Veja SUPABASE.md › Migrações automáticas.");
    return log("DATABASE_URL não definida: pulando (build local ou preview sem banco)."), false;
  }
  // Preview usa branches ainda não aprovadas: por padrão não mexe no banco de produção.
  if (env === "preview" && process.env.MIGRATE_ON_PREVIEW !== "1") {
    return log("Deploy de preview: pulando (defina MIGRATE_ON_PREVIEW=1 se o preview tiver banco próprio)."), false;
  }
  return true;
}

/* ------------------------------------------------------------------ scripts no disco */

function checksum(sql) {
  // Mesma soma no Windows (CRLF) e na Vercel (LF).
  return createHash("sha256").update(sql.replace(/\r\n/g, "\n").trim()).digest("hex");
}

function readScripts() {
  if (!existsSync(DIR)) fail(`pasta ${DIR} não existe.`);
  const seen = new Map();
  const scripts = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .map((file) => {
      const m = FILE_RE.exec(file);
      if (!m) fail(`nome inválido: ${file}. Use NNNN_descricao.sql (ex.: 0003_nova_tabela.sql).`);
      const version = Number(m[1]);
      if (seen.has(version)) fail(`versão ${version} repetida: ${seen.get(version)} e ${file}.`);
      seen.set(version, file);
      const sql = readFileSync(join(DIR, file), "utf8");
      const baseline = /^--\s*migrate:baseline-if\s+(.+)$/m.exec(sql)?.[1]?.trim() ?? null;
      return { version, description: m[2].replace(/_/g, " "), file, sql, checksum: checksum(sql), baseline };
    });
  return scripts.sort((a, b) => a.version - b.version);
}

/* ------------------------------------------------------------------ conexão */

function connect() {
  const raw = process.env.DATABASE_URL;
  if (!raw) fail("defina DATABASE_URL (no .env.local para rodar localmente).");
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DATABASE_URL inválida. Copie a connection string do Supabase (Connect › Session pooler).");
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    fail(
      `DATABASE_URL precisa ser a connection string do Postgres (começa com postgresql://), não ${url.protocol}//… ` +
        "O endereço https://…supabase.co vai em NEXT_PUBLIC_SUPABASE_URL. Pegue a certa em Supabase › Connect › Connection String › URI › Session pooler.",
    );
  }
  if (url.port === "6543") {
    fail("DATABASE_URL aponta para o Transaction pooler (porta 6543). Use o Session pooler (porta 5432): o cadeado das migrações precisa de sessão.");
  }
  // O SSL é configurado aqui, não pela URL. sslmode=disable só para Postgres local (supabase start, testes).
  const noSsl = url.searchParams.get("sslmode") === "disable";
  for (const k of ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) url.searchParams.delete(k);
  if (noSsl) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) fail("sslmode=disable só é aceito para banco local.");
    return new pg.Client({ connectionString: url.toString(), application_name: "shinobi-migrations" });
  }

  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") || (existsSync(CA_FILE) ? readFileSync(CA_FILE, "utf8") : null);
  if (!ca) log("aviso: conexão criptografada, mas sem conferir o certificado do servidor. Adicione supabase/ca.crt (veja SUPABASE.md).");

  return new pg.Client({
    connectionString: url.toString(),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    application_name: "shinobi-migrations",
    connectionTimeoutMillis: 20_000,
  });
}

/* ------------------------------------------------------------------ histórico */

async function ensureHistory(db) {
  const { rows } = await db.query("select to_regclass($1) is not null as ok", [TABLE]);
  if (rows[0].ok) return false;
  await db.query(`
    create schema if not exists ${SCHEMA};
    revoke all on schema ${SCHEMA} from public;
    create table ${TABLE} (
      version integer primary key,
      description text not null,
      script text not null,
      checksum text not null,
      type text not null check (type in ('SQL', 'BASELINE')),
      installed_by text not null default current_user,
      installed_on timestamptz not null default now(),
      execution_ms integer not null default 0
    );
    revoke all on ${TABLE} from public;
  `);
  // O schema não é exposto pela API do Supabase (só "public" é), mas garante que anon/authenticated não leem.
  await db.query(`
    do $$ begin
      if exists (select 1 from pg_roles where rolname = 'anon') then
        execute 'revoke all on schema ${SCHEMA} from anon, authenticated';
      end if;
    end $$;
  `);
  return true;
}

async function applied(db) {
  const { rows } = await db.query(`select version, description, script, checksum, type, installed_on, execution_ms from ${TABLE} order by version`);
  return new Map(rows.map((r) => [r.version, r]));
}

/** Confere se o que já rodou bate com os arquivos (Flyway validate). */
function validate(scripts, done) {
  const errors = [];
  const byVersion = new Map(scripts.map((s) => [s.version, s]));
  for (const [version, row] of done) {
    const s = byVersion.get(version);
    if (!s) log(`aviso: a versão ${version} (${row.script}) está no banco mas o arquivo não existe mais.`);
    else if (s.checksum !== row.checksum) {
      errors.push(`${s.file} mudou depois de aplicado. Não edite scripts aplicados: crie um novo (ex.: ${String(maxVersion(scripts) + 1).padStart(4, "0")}_ajuste.sql).`);
    }
  }
  const top = Math.max(0, ...done.keys());
  for (const s of scripts) {
    if (!done.has(s.version) && s.version < top) {
      errors.push(`${s.file} é anterior à última versão aplicada (${top}) e nunca rodou. Renomeie com uma versão maior que ${top}.`);
    }
  }
  if (errors.length) fail(errors.join("\n  "));
}

const maxVersion = (scripts) => Math.max(0, ...scripts.map((s) => s.version));

/* ------------------------------------------------------------------ comandos */

async function baselineExisting(db, scripts) {
  // Banco criado antes deste sistema (scripts colados no SQL Editor): registra o que já está lá.
  for (const s of scripts) {
    if (!s.baseline) break;
    const { rows } = await db.query(`select (${s.baseline}) as yes`);
    if (!rows[0].yes) break;
    await db.query(`insert into ${TABLE} (version, description, script, checksum, type) values ($1, $2, $3, $4, 'BASELINE')`, [
      s.version,
      s.description,
      s.file,
      s.checksum,
    ]);
    log(`BASELINE ${s.file} (já estava no banco, não rodou de novo)`);
  }
}

async function migrate(db, scripts) {
  await db.query("set statement_timeout = '5min'");
  log("aguardando o cadeado das migrações…");
  await db.query("select pg_advisory_lock($1)", [LOCK_KEY]);
  try {
    const created = await ensureHistory(db);
    if (created) await baselineExisting(db, scripts);
    const done = await applied(db);
    validate(scripts, done);

    const pending = scripts.filter((s) => !done.has(s.version));
    if (pending.length === 0) return log(`banco em dia (versão ${Math.max(0, ...done.keys())}).`);

    for (const s of pending) {
      const t0 = Date.now();
      try {
        await db.query("begin");
        await db.query(s.sql);
        await db.query(`insert into ${TABLE} (version, description, script, checksum, type, execution_ms) values ($1, $2, $3, $4, 'SQL', $5)`, [
          s.version,
          s.description,
          s.file,
          s.checksum,
          Date.now() - t0,
        ]);
        await db.query("commit");
        log(`OK ${s.file} (${Date.now() - t0} ms)`);
      } catch (e) {
        await db.query("rollback").catch(() => {});
        fail(`${s.file} falhou e foi desfeito por inteiro: ${e.message}${e.position ? ` (posição ${e.position})` : ""}`);
      }
    }
    log(`banco na versão ${pending.at(-1).version}.`);
  } finally {
    await db.query("select pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
  }
}

async function info(db, scripts) {
  const exists = (await db.query("select to_regclass($1) is not null as ok", [TABLE])).rows[0].ok;
  const done = exists ? await applied(db) : new Map();
  const rows = scripts.map((s) => {
    const r = done.get(s.version);
    const state = !r ? "Pendente" : r.checksum !== s.checksum ? "ALTERADO" : r.type === "BASELINE" ? "Baseline" : "Aplicado";
    return { versão: s.version, script: s.file, estado: state, em: r ? new Date(r.installed_on).toLocaleString("pt-BR") : "" };
  });
  for (const [v, r] of done) if (!scripts.some((s) => s.version === v)) rows.push({ versão: v, script: r.script, estado: "SEM ARQUIVO", em: "" });
  console.table(rows.sort((a, b) => a.versão - b.versão));
}

/* ------------------------------------------------------------------ main */

async function main() {
  if (buildMode && !shouldRunOnBuild()) return;
  if (!["migrate", "info", "validate"].includes(command)) fail(`comando desconhecido: ${command}. Use migrate, info ou validate.`);

  const scripts = readScripts();
  const db = connect();
  // Queda de conexão no meio vira erro com mensagem (e não derruba o processo em silêncio).
  db.on("error", (e) => log(`conexão caiu: ${e.message}`));
  try {
    await db.connect();
  } catch (e) {
    fail(`não conectou no banco: ${e.message}`);
  }
  try {
    if (command === "info") await info(db, scripts);
    else if (command === "validate") {
      const exists = (await db.query("select to_regclass($1) is not null as ok", [TABLE])).rows[0].ok;
      validate(scripts, exists ? await applied(db) : new Map());
      log("tudo confere.");
    } else await migrate(db, scripts);
  } finally {
    await db.end().catch(() => {});
  }
}

try {
  await main();
} catch (e) {
  console.error(`\n[migrations] ERRO: ${e instanceof MigrationError ? e.message : (e?.stack ?? e)}\n`);
  process.exitCode = 1;
}
