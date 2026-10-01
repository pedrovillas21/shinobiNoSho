"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ATTRS, COMBAT } from "@/lib/data/base";
import { ESPECIES, KUCHI_EFEITOS } from "@/lib/data/kuchiyose";
import { EFEITO_BY_ID } from "@/lib/data/poderes";
import {
  ETAPAS_CRIATURA,
  TAMANHOS,
  contrato,
  especieDe,
  especieLiberada,
  formaAuto,
  formaDe,
  kuchiyoseLevel,
  ncMaxFor,
  novaInvocacao,
  qtyOptions,
  statsInvocacao,
  tamanhoPermitido,
  tecnicaAtiva,
  validarInvocacao,
  type InvIssue,
} from "@/lib/kuchiyose";
import { APT_COST, uid } from "@/lib/rules";
import type { Character, ContratoKuchiyose, Invocacao } from "@/lib/types";
import { AnimatedNumber, IconCopy, IconLeft, IconLock, IconPlus, IconTrash, Stepper, StepHeader, Toggle } from "../../ui";
import { ABAS_CONTRATO, norm, stepKicker, type InvNav, type StepProps } from "../shared";

type InvProps = StepProps & { nav: InvNav; setNav: (n: InvNav) => void };

/** Mexe no contrato da ficha, criando-o na primeira vez. */
function useContrato(set: StepProps["set"]) {
  return (fn: (k: ContratoKuchiyose) => void) =>
    set((d) => {
      d.kuchiyose ??= { forma: null, especie: null, criaturas: [] };
      fn(d.kuchiyose);
    });
}

export function StepInvocacoes({ c, set, nav, setNav }: InvProps) {
  const inv = nav.edit ? contrato(c).criaturas.find((x) => x.uid === nav.edit) : undefined;
  if (inv) return <CriaturaEditor c={c} set={set} nav={nav} setNav={setNav} inv={inv} />;
  return <Contrato c={c} set={set} nav={nav} setNav={setNav} />;
}

/* ---------------- navegação das sub-etapas ---------------- */

function SubNav({ items, cur, onGo, label }: { items: { label: string; hint?: string; err?: boolean }[]; cur: number; onGo: (n: number) => void; label: string }) {
  return (
    <nav aria-label={label} className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => {
        const n = i + 1;
        const on = n === cur;
        const done = n < cur;
        return (
          <button
            key={it.label}
            type="button"
            onClick={() => onGo(n)}
            aria-current={on ? "step" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center transition sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3 sm:text-left ${
              on ? "border-chakra bg-panel-2" : "border-line-2 bg-ink-2 hover:border-muted"
            }`}
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                it.err ? "bg-bad/20 text-bad" : on ? "bg-chakra text-paper-ink" : done ? "bg-ok/20 text-ok" : "bg-line-2 text-muted"
              }`}
            >
              {it.err ? "!" : done ? "✓" : n}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className={`text-xs font-bold sm:text-sm ${on ? "text-paper" : "text-muted"}`}>{it.label}</span>
              {it.hint && <span className="hidden truncate text-xs text-faint sm:block">{it.hint}</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------- contrato ---------------- */

function Contrato({ c, set, nav, setNav }: InvProps) {
  const setK = useContrato(set);
  const k = contrato(c);
  const lvl = kuchiyoseLevel(c);
  const e = especieDe(c);
  const forma = formaDe(c);
  const auto = formaAuto(c);
  const aba = nav.aba;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-seal font-display text-3xl font-extrabold text-paper sm:grid">
          召
        </span>
        <StepHeader kicker={`${stepKicker(c, "invocacoes")} · Kuchiyose ${lvl}`} title="Pergaminho de Contrato">
          Assine um contrato e monte as fichas das criaturas que você costuma invocar. Cada criatura é feita com as regras de criação de personagem, ajustadas pela espécie.
        </StepHeader>
      </div>

      {lvl === 0 && (
        <p className="rounded-xl border border-chakra/40 bg-chakra/10 px-4 py-3 text-sm">
          Sua origem traz o Kuchiyose, mas o poder ainda não foi comprado. Compre-o na etapa Poderes: o nível define o NC das criaturas.
        </p>
      )}

      <SubNav
        label="Partes do contrato"
        cur={aba}
        onGo={(n) => setNav({ ...nav, aba: n })}
        items={[
          { label: ABAS_CONTRATO[0], hint: forma === "hijutsu" ? "Hijutsu" : "Poder comum" },
          { label: ABAS_CONTRATO[1], hint: e?.name ?? "a escolher", err: !!e && !especieLiberada(c, e) },
          { label: ABAS_CONTRATO[2], hint: `${k.criaturas.length} ficha(s)` },
        ]}
      />

      <motion.div key={aba} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-6">
        {aba === 1 && (
          <section className="flex flex-col gap-4">
            <div role="radiogroup" aria-label="Forma do poder" className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["hijutsu", "Hijutsu (restrito)", "sem outro Clã ou Hijutsu", "Comandar Parceiro melhorado, 1 uso extra por cena (como comum, nunca junto) e acesso a Senjutsu (Sapos e Cobras) ou Byakugou no In (Lesmas)."],
                  ["comum", "Poder comum", "já tem Clã ou Hijutsu", "As criaturas são capangas e recebem −3 de precisão nas Habilidades de Combate e nas dificuldades de efeitos e técnicas."],
                ] as const
              ).map(([id, title, sub, desc]) => {
                const on = forma === id;
                const off = id === "hijutsu" && !!e?.onlyComum;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={off}
                    onClick={() => setK((x) => void (x.forma = id))}
                    className={`flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? "border-chakra bg-panel-2 ring-1 ring-chakra" : "border-line-2 bg-ink-2 hover:border-muted"}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-xl font-extrabold text-paper">{title}</span>
                      <span className={`size-[18px] shrink-0 rounded-full ${on ? "border-[5px] border-chakra" : "border-2 border-line-2"}`} />
                    </span>
                    <span className="text-xs text-faint">{sub}</span>
                    <span className="text-sm leading-relaxed text-muted">{desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-faint">
              {e?.onlyComum ? `${e.name} só existem como poder comum. ` : `Pela sua origem: ${auto === "hijutsu" ? "Hijutsu" : "poder comum"}. `}
              {k.forma && !e?.onlyComum && k.forma !== auto && (
                <button type="button" className="font-bold text-chakra hover:underline" onClick={() => setK((x) => void (x.forma = null))}>
                  Voltar ao automático
                </button>
              )}
            </p>
            <p className="text-sm text-faint">O Mestre pode permitir trocar de Hijutsu para comum mais tarde, desde que você não tenha Senjutsu nem tenha usado o Byakugou no In.</p>
          </section>
        )}

        {aba === 2 && (
          <section className="flex flex-col gap-4">
            <p className="text-sm text-muted">Só é possível um único pacto de sangue. Espécies exclusivas pedem o clã ou hijutsu indicado.</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-2.5">
              {ESPECIES.map((sp) => {
                const on = sp.id === k.especie;
                const locked = !especieLiberada(c, sp);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    disabled={locked && !on}
                    aria-pressed={on}
                    aria-label={`${sp.name}${locked ? `, exclusivo de ${sp.exclusive?.label}` : ""}`}
                    onClick={() => setK((x) => void (x.especie = sp.id))}
                    className={`flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition sm:min-h-28 sm:items-start sm:gap-1 sm:p-3 ${
                      on ? (locked ? "border-2 border-bad bg-panel-2" : "border-2 border-chakra bg-panel-2") : locked ? "cursor-not-allowed border border-dashed border-line-2 opacity-60" : "border border-line-2 bg-ink-2 hover:border-muted"
                    }`}
                  >
                    <span aria-hidden="true" className={`font-display text-2xl font-extrabold leading-none sm:text-[28px] ${on ? "text-chakra" : locked ? "text-paper-muted" : "text-muted"}`}>
                      {sp.kanji}
                    </span>
                    <span className={`text-xs font-bold sm:text-sm ${locked ? "text-faint" : "text-paper"}`}>{sp.name}</span>
                    <span className="hidden text-xs leading-snug text-faint sm:block">
                      {locked ? `Exclusivo · ${sp.exclusive?.label}` : sp.powers.length ? sp.powers.map((p) => p.name).join(", ") : sp.onlyComum ? "só comum" : "sem poder"}
                    </span>
                    {locked && <IconLock className="size-3 text-faint sm:hidden" />}
                  </button>
                );
              })}
            </div>
            {e ? <RegrasEspecie e={e} /> : <p className="card px-4 py-6 text-center text-sm text-muted">Escolha uma espécie para ver as regras dela.</p>}
            {e && !especieLiberada(c, e) && <p className="text-sm font-bold text-bad">{e.name} são exclusivos de {e.exclusive?.label}.</p>}
          </section>
        )}

        {aba === 3 && (
          <section className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {qtyOptions(e).map((q) => (
                <div key={q} className="card flex flex-col p-3 sm:p-4">
                  <span className="text-xs text-muted">{q === 1 ? "1 criatura" : `${q} criaturas`}</span>
                  <span className="font-display text-2xl font-extrabold text-paper sm:text-3xl">NC {ncMaxFor(lvl, q, e)}</span>
                </div>
              ))}
              <div className="flex flex-col rounded-2xl bg-chk-bg p-3 sm:p-4">
                <span className="text-xs text-chk-muted">Custo de chakra</span>
                <span className="font-display text-2xl font-extrabold text-chk sm:text-3xl">{2 * lvl}</span>
              </div>
              <div className="card flex flex-col p-3 sm:p-4">
                <span className="text-xs text-muted">Usos por cena</span>
                <span className="font-display text-2xl font-extrabold text-paper sm:text-3xl">{forma === "hijutsu" ? "1 + 1" : "1"}</span>
              </div>
            </div>
            <p className="text-sm text-faint">
              Ação padrão, duração contínua. Uma criatura cancelada ou abatida não é substituída na mesma cena.
              {e?.unitary ? ` ${e.name}: só uma por cena.` : ""}
              {e?.numerous ? ` Invocação numerosa: até ${e.numerous} no NC máximo, como capangas com 1 de Vitalidade.` : ""}
            </p>

            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl font-extrabold text-paper">Suas criaturas</h3>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const n = novaInvocacao(c);
                  setK((x) => void x.criaturas.push(n));
                  setNav({ aba: 3, edit: n.uid, etapa: 1 });
                }}
              >
                <IconPlus className="size-4" /> Nova criatura
              </button>
            </div>
            {!e && <p className="text-sm text-chakra">Escolha a espécie do contrato antes: ela define atributos principais, perícias, poder e aptidões.</p>}
            {k.criaturas.length === 0 ? (
              <p className="card px-4 py-6 text-center text-sm text-muted">Nenhuma criatura ainda. Monte as fichas das que você costuma invocar.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {k.criaturas.map((inv) => (
                  <CriaturaCard key={inv.uid} c={c} inv={inv} onOpen={() => setNav({ aba: 3, edit: inv.uid, etapa: 1 })} onCopy={() => setK((x) => void x.criaturas.push({ ...structuredClone(inv), uid: uid(), name: inv.name ? `${inv.name} (cópia)` : "" }))} />
                ))}
              </ul>
            )}
          </section>
        )}
      </motion.div>
    </div>
  );
}

function RegrasEspecie({ e }: { e: NonNullable<ReturnType<typeof especieDe>> }) {
  const rows: [string, string][] = [
    ["Atributos principais", e.main.map((k) => ATTRS.find((a) => a.key === k)!.name).join(", ")],
    ["Perícias (usam o atributo)", e.skills.map((s) => s.name).join(", ")],
    ["Poder (no máximo um)", e.powers.length ? e.powers.map((p) => p.name).join(", ") : "Nenhum"],
    ["Técnicas gratuitas", e.techniques.map((t) => (t.note ? `${t.name} (${t.note})` : t.name)).join("; ")],
    ["Tipos de ataque", e.attacks],
    ["Tamanho", e.maxSize ? `Até ${TAMANHOS.find((t) => t.k === e.maxSize)!.n}` : "Sem limite próprio"],
  ];
  return (
    <section aria-label={`Regras da espécie ${e.name}`} className="card flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="font-display text-4xl font-extrabold text-chakra">
          {e.kanji}
        </span>
        <div className="flex flex-col">
          <span className="label">Regras da espécie · {e.source}</span>
          <span className="font-display text-2xl font-extrabold text-paper">{e.name}</span>
        </div>
      </div>
      <dl className="grid gap-x-6 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="border-b border-line py-2">
            <dt className="text-xs text-faint">{k}</dt>
            <dd className="text-text">{v}</dd>
          </div>
        ))}
      </dl>
      {e.powerNote && <p className="text-sm text-muted">{e.powerNote}</p>}
      <ul className="flex flex-col gap-1.5">
        {e.notes.map((n) => (
          <li key={n} className="rounded-lg bg-panel-2 px-3 py-2 text-sm">
            {n}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CriaturaCard({ c, inv, onOpen, onCopy }: { c: Character; inv: Invocacao; onOpen: () => void; onCopy: () => void }) {
  const s = statsInvocacao(c, inv);
  const issues = validarInvocacao(c, inv).filter((i) => !i.dica);
  const errs = issues.filter((i) => i.sev === "erro").length;
  const tone = errs ? "bg-bad" : issues.length ? "bg-chakra" : "bg-ok";
  const powerName = inv.power ? s.especie?.powers.find((p) => p.id === inv.power)?.name : null;
  return (
    <li className="card flex items-center gap-3 p-3 sm:p-4">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-panel-2 font-display text-2xl font-extrabold text-chakra">
          {s.especie?.kanji ?? "召"}
        </span>
        <span className="flex min-w-0 flex-col leading-snug">
          <span className="truncate font-display text-xl font-extrabold text-paper">{inv.name.trim() || "Criatura sem nome"}</span>
          <span className="truncate text-sm text-muted">
            NC {inv.nc} · {s.size.n} · {powerName ? `${powerName} ${inv.powerLevel}` : "sem poder"}
          </span>
          <span className={`truncate text-sm ${issues.length ? (errs ? "text-bad" : "text-chakra") : "text-faint"}`}>
            {issues[0]?.text ?? `Vit ${s.vit} · Chakra ${s.chakra} · Dano ${s.dano}`}
          </span>
        </span>
        <span role="img" aria-label={errs ? `${errs} fora da regra` : issues.length ? `${issues.length} em aberto` : "Dentro da regra"} className={`size-2.5 shrink-0 rounded-full ${tone}`} />
      </button>
      <button type="button" onClick={onCopy} className="btn-ghost size-11 shrink-0 px-0" aria-label={`Duplicar ${inv.name || "criatura"}`}>
        <IconCopy className="size-4" />
      </button>
    </li>
  );
}

/* ---------------- ficha da criatura ---------------- */

function CriaturaEditor({ c, set, nav, setNav, inv }: InvProps & { inv: Invocacao }) {
  const setK = useContrato(set);
  const edit = (fn: (x: Invocacao) => void) => setK((k) => fn(k.criaturas.find((x) => x.uid === inv.uid)!));
  const s = statsInvocacao(c, inv);
  const e = s.especie;
  const lvl = kuchiyoseLevel(c);
  const issues = validarInvocacao(c, inv);
  const errAt = (n: number) => issues.some((i) => i.etapa === n && i.sev === "erro");
  const etapa = nav.etapa;
  const ncMax = ncMaxFor(lvl, inv.qty, e);
  const [q, setQ] = useState("");

  const hints = [`NC ${inv.nc} · ${s.size.n}`, `${s.budget - s.spentAttr} de ${s.budget} livres`, inv.power ? `${e?.powers.find((p) => p.id === inv.power)?.name ?? "Poder"} ${inv.powerLevel}` : "nenhum", `${inv.apts.length} escolhida(s)`, "revisão"];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button type="button" className="btn-ghost size-11 shrink-0 px-0" onClick={() => setNav({ aba: 3, edit: null, etapa: 1 })} aria-label="Voltar às criaturas">
          <IconLeft />
        </button>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-xs font-bold uppercase tracking-[0.14em] text-chakra">
            {stepKicker(c, "invocacoes")} · {e?.name ?? "Espécie a escolher"} · {s.forma === "hijutsu" ? "Hijutsu" : "Comum"}
          </span>
          <h2 className="truncate font-display text-3xl font-extrabold text-paper sm:text-4xl">{inv.name.trim() || "Nova criatura"}</h2>
        </div>
        <button
          type="button"
          className="btn-ghost size-11 shrink-0 px-0 hover:border-bad hover:text-bad"
          aria-label="Excluir criatura"
          onClick={() => {
            if (!window.confirm(`Excluir ${inv.name.trim() || "esta criatura"}?`)) return;
            setNav({ aba: 3, edit: null, etapa: 1 });
            setK((k) => void (k.criaturas = k.criaturas.filter((x) => x.uid !== inv.uid)));
          }}
        >
          <IconTrash className="size-4" />
        </button>
      </div>

      {/* Pontos e energias sempre à vista no celular (no computador ficam na coluna da direita) */}
      <div className="grid grid-cols-4 gap-1.5 lg:hidden">
        <MiniPonto label="Atrib." left={s.budget - s.spentAttr} used={s.spentAttr} total={s.budget} />
        <MiniPonto label="Poder" left={s.pp - s.ppSpent} used={s.ppSpent} total={s.pp} />
        <div className="flex items-baseline justify-between gap-1 rounded-xl bg-vit-bg px-2.5 py-2">
          <span className="text-[11px] text-vit-muted">Vit</span>
          <span className="font-bold text-vit">{s.vit}</span>
        </div>
        <div className="flex items-baseline justify-between gap-1 rounded-xl bg-chk-bg px-2.5 py-2">
          <span className="text-[11px] text-chk-muted">Chakra</span>
          <span className="font-bold text-chk">{s.chakra}</span>
        </div>
      </div>

      <SubNav label="Etapas da criatura" cur={etapa} onGo={(n) => setNav({ ...nav, etapa: n })} items={ETAPAS_CRIATURA.map((label, i) => ({ label, hint: hints[i], err: errAt(i + 1) }))} />

      <motion.div key={etapa} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-5">
        {etapa === 1 && (
          <>
            <section className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted">Nome (opcional)</span>
                <input className="field font-display text-lg font-bold" value={inv.name} onChange={(ev) => edit((x) => void (x.name = ev.target.value))} placeholder="Ex.: Gamakichi" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted">Personalidade (opcional)</span>
                <input className="field" value={inv.personality} onChange={(ev) => edit((x) => void (x.personality = ev.target.value))} placeholder="Como ela trata o invocador?" />
              </label>
              {e?.noSpeech || e?.intZero ? <p className="text-sm text-faint sm:col-span-2">{e.name} não falam a língua humana.</p> : null}
            </section>

            <section className="card flex flex-col gap-4 p-4 sm:p-5">
              <h3 className="label">Nível e tamanho</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted">Pensada para invocar</span>
                  <div role="radiogroup" aria-label="Quantidade na invocação" className="grid grid-cols-2 gap-2">
                    {qtyOptions(e).map((n) => {
                      const on = inv.qty === n;
                      return (
                        <button key={n} type="button" role="radio" aria-checked={on} onClick={() => edit((x) => void (x.qty = n))} className={`flex min-h-14 flex-col items-start justify-center rounded-xl px-3 text-left ${on ? "border-2 border-chakra bg-panel-2" : "border border-line-2 bg-ink-2 hover:border-muted"}`}>
                          <span className="font-bold text-paper">{n === 1 ? "1 criatura" : `${n} criaturas`}</span>
                          <span className="text-xs text-faint">até NC {ncMaxFor(lvl, n, e)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted">NC da criatura · máximo {ncMax}</span>
                  <div className={`flex items-center justify-center rounded-xl border bg-ink-2 py-1.5 ${inv.nc > ncMax ? "border-bad" : "border-line-2"}`}>
                    <Stepper label="NC da criatura" value={inv.nc} min={1} max={30} onChange={(n) => edit((x) => void (x.nc = n))} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">Tamanho · ajusta Força e Vigor (pode passar do limite)</span>
                <div role="radiogroup" aria-label="Tamanho" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {TAMANHOS.map((t) => {
                    const on = inv.size === t.k;
                    const ok = tamanhoPermitido(t.k, inv.nc, e);
                    const why = e?.maxSize && !ok && TAMANHOS.findIndex((x) => x.k === t.k) > TAMANHOS.findIndex((x) => x.k === e.maxSize) ? `não p/ ${e.name}` : t.minNc ? `NC ${t.minNc}+` : t.maxNc < Infinity ? `até NC ${t.maxNc}` : "livre";
                    return (
                      <button
                        key={t.k}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={!ok && !on}
                        onClick={() => edit((x) => void (x.size = t.k))}
                        className={`flex min-h-14 flex-col items-start justify-center rounded-xl px-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
                          on ? `border-2 ${ok ? "border-chakra" : "border-bad"} bg-panel-2` : "border border-line-2 bg-ink-2 hover:border-muted"
                        }`}
                      >
                        <span className="font-bold text-paper">{t.n}</span>
                        <span className="text-xs text-faint">
                          {t.mod > 0 ? `+${t.mod}` : t.mod === 0 ? "±0" : t.mod} · {why}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {etapa === 2 && (
          <section className="card flex flex-col gap-2 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="label">Atributos</h3>
              <span className={`rounded-lg px-2.5 py-1 text-sm font-bold ${s.spentAttr > s.budget ? "bg-bad/15 text-bad" : s.spentAttr === s.budget ? "bg-ok/15 text-ok" : "bg-chakra/15 text-chakra"}`}>
                {s.budget - s.spentAttr >= 0 ? `${s.budget - s.spentAttr} restantes` : `${s.spentAttr - s.budget} a mais`} · mín. {s.minAttr} · máx. {inv.nc}
              </span>
            </div>
            <ul className="flex flex-col">
              {ATTRS.map((a) => {
                const v = inv.attrs[a.key];
                const main = e?.main.includes(a.key);
                const zero = e?.intZero && a.key === "INT";
                const bad = !zero && ((inv.nc >= 4 && v > inv.nc) || v < s.minAttr);
                const sized = (a.key === "FOR" || a.key === "VIG") && s.size.mod !== 0;
                return (
                  <li key={a.key} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="flex items-center gap-2">
                        <span className={`size-2 shrink-0 rounded-full ${main ? "bg-chakra" : "bg-line-2"}`} />
                        <span className={`font-bold ${bad ? "text-bad" : "text-text"}`}>{a.name}</span>
                        {main && <span className="text-[11px] font-bold tracking-wider text-chakra">PRINCIPAL</span>}
                      </span>
                      <span className="pl-4 text-xs text-faint">{zero ? "sempre zero nesta espécie" : sized ? `= ${v + s.size.mod} com o tamanho (${s.size.mod > 0 ? "+" : ""}${s.size.mod})` : ""}</span>
                    </span>
                    {zero ? (
                      <span className="w-10 text-center font-display text-3xl font-extrabold text-faint">0</span>
                    ) : (
                      <Stepper label={a.name} value={v} min={0} onChange={(n) => edit((x) => void (x.attrs[a.key] = n))} />
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-faint">12 pontos no NC 4 e +6 por NC, como personagens. É recomendado, não obrigatório, concentrar nos atributos principais da espécie.</p>
          </section>
        )}

        {etapa === 3 && (
          <section className="card flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="label">Poder</h3>
              <span className="text-sm text-faint">no máximo um, da lista da espécie · limite de nível {s.cap}</span>
            </div>
            {e && e.powers.length === 0 ? (
              <p className="text-sm text-muted">{e.name} não têm poder. {e.powerNote}</p>
            ) : (
              <>
                <div role="radiogroup" aria-label="Poder da criatura" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {[{ id: null as string | null, name: "Nenhum" }, ...(e?.powers ?? [])].map((p) => {
                    const on = inv.power === p.id;
                    return (
                      <button
                        key={p.id ?? "nenhum"}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => edit((x) => ((x.power = p.id), (x.powerLevel = p.id ? Math.max(1, x.powerLevel) : 0)))}
                        className={`min-h-12 rounded-xl px-4 font-bold ${on ? "border-2 border-chakra bg-panel-2 text-paper" : "border border-line-2 bg-ink-2 text-text hover:border-muted"}`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                {inv.power && (
                  <div className={`flex items-center justify-between gap-3 rounded-xl border bg-ink-2 px-3 py-1.5 ${inv.powerLevel > s.cap ? "border-bad" : "border-line-2"}`}>
                    <span className="text-sm text-muted">Nível do poder</span>
                    <Stepper label="nível do poder" value={inv.powerLevel} min={1} max={30} onChange={(n) => edit((x) => void (x.powerLevel = n))} />
                  </div>
                )}
                {inv.power && e?.elemental && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted">Efeitos permitidos para poderes elementais de invocação</span>
                    <ul className="flex flex-wrap gap-1.5">
                      {KUCHI_EFEITOS.map((id) => (
                        <li key={id} className="chip text-text">
                          {EFEITO_BY_ID[id]?.name ?? id}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {e?.powerNote && <p className="text-sm text-muted">{e.powerNote}</p>}
              </>
            )}
            <p className="rounded-xl bg-panel-2 px-3 py-2.5 text-sm text-muted">
              Pontos de Poder: 1 a cada 2 NC ({s.pp} no NC {inv.nc}). Cada nível do poder gasta 1; cada aptidão além das 3 grátis gasta {APT_COST}, como para personagens.
            </p>
          </section>
        )}

        {etapa === 4 && (
          <section className="card flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="label">Aptidões da espécie</h3>
              <span className="text-sm text-faint">
                {s.freeApts} grátis · as demais custam {APT_COST} Pontos de Poder
              </span>
            </div>
            {(e?.apts.length ?? 0) > 20 && <input className="field" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Filtrar aptidões" aria-label="Filtrar aptidões" />}
            <div className="flex flex-wrap gap-2">
              {[...(e?.apts ?? []), ...inv.apts.filter((n) => !e?.apts.includes(n))]
                .filter((n) => !q || norm(n).includes(norm(q)) || inv.apts.includes(n))
                .map((n) => {
                  const idx = inv.apts.indexOf(n);
                  const on = idx >= 0;
                  const free = on && idx < s.freeApts;
                  const out = !e?.apts.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      disabled={inv.nc < 4 && !on}
                      onClick={() => edit((x) => void (x.apts = on ? x.apts.filter((a) => a !== n) : [...x.apts, n]))}
                      className={`chip min-h-11 disabled:opacity-35 ${on ? (out ? "border-bad bg-panel-2 text-text" : "border-chakra bg-panel-2 text-text") : "text-text hover:border-muted"}`}
                    >
                      {n}
                      {on && <span className={`rounded-full px-1.5 text-[11px] font-bold ${free ? "bg-ok/20 text-ok" : "bg-chakra/20 text-chakra"}`}>{free ? "grátis" : `${APT_COST} PP`}</span>}
                    </button>
                  );
                })}
            </div>
            <p className="text-sm text-faint">As 3 primeiras marcadas são as gratuitas. Só vale a lista da espécie.</p>
          </section>
        )}

        {etapa === 5 && (
          <>
            <section className="card flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="label">Perícias da espécie</h3>
                <span className="text-sm text-faint">usam o nível do atributo · fora da lista = 0</span>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {s.skills.map((sk) => (
                  <div key={sk.name} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-ink-2 px-3 py-2">
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="text-sm font-bold">{sk.name}</span>
                      <span className="text-xs text-faint">{ATTRS.find((a) => a.key === sk.attr)!.name}</span>
                    </span>
                    <span className="font-display text-2xl font-extrabold text-paper">{sk.v}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="grid gap-4 md:grid-cols-2">
              <div className="card flex flex-col gap-2 p-4 sm:p-5">
                <h3 className="label">Técnicas da espécie (grátis)</h3>
                <ul className="flex flex-col gap-1.5">
                  {(e?.techniques ?? []).map((t) => {
                    const falta = tecnicaAtiva(inv, t);
                    return (
                      <li key={t.name} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink-2 px-3 py-2">
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="font-bold">{t.name}</span>
                          {t.note && <span className="text-xs text-faint">{t.note}</span>}
                        </span>
                        <span className={`shrink-0 text-right text-xs ${falta ? "text-faint" : "text-ok"}`}>{falta ?? "ativa"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="card flex flex-col gap-2 p-4 sm:p-5">
                <h3 className="label">Ataque</h3>
                <span className="text-sm text-muted">{e?.attacks ?? "—"}</span>
                <div className="flex items-center gap-4 rounded-xl border border-line bg-ink-2 px-4 py-3">
                  <div className="flex shrink-0 flex-col items-center">
                    <AnimatedNumber value={s.dano} className="font-display text-4xl font-extrabold leading-none text-paper" />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-faint">dano base</span>
                  </div>
                  <p className="min-w-0 text-xs leading-snug text-muted">
                    {inv.nc < 4 ? (
                      "Abaixo de NC 4 os ataques não causam dano."
                    ) : (
                      <>
                        Corpo-a-corpo: Força {s.forT} − 3{s.forT - 3 < 3 ? " (mínimo 3)" : ""}
                        {inv.marcial ? " + 1 da arma marcial" : ""}. Não divide a Força nem soma o dano de arma.
                      </>
                    )}
                  </p>
                </div>
                {s.dano > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 text-center" aria-label="Dano final por grau">
                    {[1, 2, 3, 4].map((g) => (
                      <div key={g} className={`rounded-lg py-1.5 ${g === 4 ? "bg-[#3d1f18] ring-1 ring-[#6b3526]" : "bg-panel"}`}>
                        <span className={`block text-[10px] font-bold uppercase tracking-wider ${g === 4 ? "text-[#ff9a80]" : "text-faint"}`}>Grau {g}</span>
                        <span className={`font-display text-lg font-extrabold tabular-nums ${g === 4 ? "text-vit" : "text-paper"}`}>{s.dano * g}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Toggle checked={inv.marcial} onChange={(v) => edit((x) => void (x.marcial = v))} label="Usa arma marcial" hint="+1 de dano base." />
              </div>
            </section>
            <section className="card flex flex-col gap-2 p-4 sm:p-5 lg:hidden">
              <h3 className="label">Combate</h3>
              <CombateLista c={c} inv={inv} />
            </section>
            <section className="card flex flex-col gap-1 p-4 sm:p-5 lg:hidden">
              <Observacoes issues={issues} onGo={(n) => setNav({ ...nav, etapa: n })} />
            </section>
          </>
        )}
      </motion.div>
    </div>
  );
}

function MiniPonto({ label, left, used, total }: { label: string; left: number; used: number; total: number }) {
  const tone = used > total ? "var(--color-bad)" : used === total ? "var(--color-ok)" : "var(--color-chakra)";
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-panel px-2.5 py-2">
      <span className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="text-sm font-bold" style={{ color: tone }}>
          {left}
        </span>
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-line">
        <motion.span className="block h-1 rounded-full" style={{ background: tone }} animate={{ width: `${Math.min(100, (used / Math.max(1, total)) * 100)}%` }} />
      </span>
    </div>
  );
}

function CombateLista({ c, inv }: { c: Character; inv: Invocacao }) {
  const s = statsInvocacao(c, inv);
  const rows: [string, string | number][] = [
    ...COMBAT.map((k) => [k.name, s.combat[k.key]] as [string, number]),
    ["Dano corpo a corpo", s.dano],
    ["Deslocamento", `${s.desloc}m`],
    ["Alcance corpo a corpo", `${s.alcance}m`],
  ];
  return (
    <dl className="flex flex-col text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-line py-1.5 last:border-0">
          <dt className="text-muted">{k}</dt>
          <dd className="font-bold text-paper">{v}</dd>
        </div>
      ))}
      {s.pen > 0 && <p className="pt-1 text-xs text-faint">Já com −{s.pen} de precisão do poder comum.</p>}
    </dl>
  );
}

function Observacoes({ issues, onGo }: { issues: InvIssue[]; onGo: (etapa: number) => void }) {
  const errs = issues.filter((i) => i.sev === "erro");
  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="label">Observações</span>
        <span className="text-xs text-faint">
          {errs.length} fora da regra · {issues.length - errs.length} em aberto
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-ok">
          <span className="size-2.5 rounded-full bg-ok" /> Criatura dentro das regras.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {[...errs, ...issues.filter((i) => i.sev !== "erro")].map((i, n) => (
            <li key={n}>
              <button type="button" onClick={() => onGo(i.etapa)} className="flex min-h-11 w-full items-start gap-2.5 rounded-lg p-1.5 text-left text-sm leading-snug hover:bg-panel-2">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i.sev === "erro" ? "bg-bad" : "bg-chakra"}`} />
                <span>
                  {i.text} <span className="text-faint">· {ETAPAS_CRIATURA[i.etapa - 1]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Coluna da direita (e painel de resumo no celular) enquanto uma criatura está aberta. */
export function CriaturaResumo({ c, inv, onGo }: { c: Character; inv: Invocacao; onGo: (etapa: number) => void }) {
  const s = statsInvocacao(c, inv);
  const issues = validarInvocacao(c, inv);
  const bars = [
    { label: "Atributos", used: s.spentAttr, total: s.budget },
    { label: "Pontos de Poder", used: s.ppSpent, total: s.pp },
    { label: "Aptidões grátis", used: Math.min(inv.apts.length, s.freeApts), total: s.freeApts },
  ];
  return (
    <>
      <div className="card flex flex-col gap-3 p-5">
        <span className="label">Pontos da criatura</span>
        {bars.map((x) => {
          const tone = x.used > x.total ? "var(--color-bad)" : x.used === x.total ? "var(--color-ok)" : "var(--color-chakra)";
          return (
            <div key={x.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">{x.label}</span>
                <span className="font-bold" style={{ color: tone }}>
                  <AnimatedNumber value={x.total - x.used} />
                  <span className="text-faint">/{x.total}</span>
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-line">
                <motion.div className="h-1 rounded-full" style={{ background: tone }} animate={{ width: `${Math.min(100, (x.used / Math.max(1, x.total)) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="card flex flex-col gap-3 p-5">
        <span className="label">Energias</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-xl bg-vit-bg p-3">
            <span className="text-xs text-vit-muted">Vitalidade</span>
            <AnimatedNumber value={s.vit} className="font-display text-4xl font-extrabold text-vit" />
            <span className="text-[11px] text-vit-muted/80">metade da regra comum</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-chk-bg p-3">
            <span className="text-xs text-chk-muted">Chakra</span>
            <AnimatedNumber value={s.chakra} className="font-display text-4xl font-extrabold text-chk" />
            <span className="text-[11px] text-chk-muted/80">10 + 3×ESP</span>
          </div>
        </div>
        <CombateLista c={c} inv={inv} />
      </div>
      <div className="card flex flex-col gap-2 p-5">
        <Observacoes issues={issues} onGo={onGo} />
      </div>
    </>
  );
}
