"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sair } from "@/app/entrar/actions";
import { NC_MAX, NC_MIN, budgetFor, originKanji, originName, rankLabel } from "@/lib/rules";
import { dismissLegacy, legacyChars, readJSONFile, useChars, useCharsStatus, useHydrated } from "@/lib/store";
import type { Character } from "@/lib/types";
import { Salas } from "./Salas";
import { IconCopy, IconDownload, IconPlus, IconTrash, IconUpload, Logo } from "./ui";

const QUICK_NC = [4, 8, 10, 12, 16, 20, 25, 30];

export function HomeClient({ userId, username }: { userId: string; username: string }) {
  const hydrated = useHydrated();
  const status = useCharsStatus();
  const router = useRouter();
  const chars = useChars((s) => s.chars);
  const create = useChars((s) => s.create);
  const remove = useChars((s) => s.remove);
  const duplicate = useChars((s) => s.duplicate);
  const importChar = useChars((s) => s.importChar);
  const [nc, setNc] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const importMany = useChars((s) => s.importMany);
  const fileRef = useRef<HTMLInputElement>(null);
  // Fichas da versão antiga, que ficavam só no navegador.
  const [legacy, setLegacy] = useState<Character[]>([]);
  const [sending, setSending] = useState(false);
  useEffect(() => setLegacy(legacyChars()), []);

  const sendLegacy = async () => {
    setSending(true);
    try {
      await importMany(legacy);
      dismissLegacy();
      setLegacy([]);
    } catch {
      setError("Não foi possível enviar as fichas do navegador. Tente de novo.");
    } finally {
      setSending(false);
    }
  };

  const list = Object.values(chars).sort((a, b) => b.updatedAt - a.updatedAt);
  const b = budgetFor(nc, { tresPontosPoder: false, aptidoesBanidas: false, danoExtraAuto: false, multiHijutsu: false });

  const onNew = () => router.push(`/ficha/${create(nc)}`);
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const id = importChar(await readJSONFile(f));
      router.push(`/ficha/${id}`);
    } catch {
      setError("Não foi possível ler esse arquivo. Use um .json exportado por este site.");
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-extrabold sm:text-xl">Shinobi no Sho</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Fichas &amp; Mesa · 4.1b</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-11 items-center gap-2 rounded-xl border border-line-2 px-3 text-sm font-bold">
            <span className="size-2 rounded-full bg-ok" aria-hidden="true" />@{username}
          </span>
          <form action={sair}>
            <button type="submit" className="btn-ghost">
              Sair
            </button>
          </form>
        </div>
      </header>

      {legacy.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#4a3218] bg-[#2a1c10] px-4 py-3 text-[#ffd3a8]">
          <IconDownload className="size-5 shrink-0" />
          <span className="min-w-0 flex-1 text-sm">
            Encontramos <b>{legacy.length} ficha(s)</b> salvas neste navegador. Quer enviar para a sua conta?
          </span>
          <button type="button" className="btn min-h-9 bg-chakra px-3 text-xs text-paper-ink" disabled={sending} onClick={() => void sendLegacy()}>
            {sending ? "Enviando…" : "Enviar para a conta"}
          </button>
          <button type="button" className="btn min-h-9 border border-[#4a3218] px-3 text-xs" onClick={() => { dismissLegacy(); setLegacy([]); }}>
            Descartar aviso
          </button>
        </div>
      )}

      <Salas userId={userId} />

      {error && (
        <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold text-paper">Minhas fichas</h2>
          <button type="button" className="btn-ghost min-h-10" onClick={() => fileRef.current?.click()}>
            <IconUpload className="size-4" /> Importar .json
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
        </div>

        {status === "error" ? (
          <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
            Não foi possível carregar suas fichas. Confira a conexão e recarregue a página.
          </p>
        ) : !hydrated ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li className="card flex flex-col gap-4 p-5">
              <span className="label">Nova ficha</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-muted">Nível de Campanha</span>
                <span className="text-sm font-bold text-chakra">{rankLabel(nc)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 font-display text-4xl font-extrabold text-paper">{nc}</span>
                <input type="range" min={NC_MIN} max={NC_MAX} value={nc} onChange={(e) => setNc(Number(e.target.value))} aria-label="Nível de Campanha" className="flex-1" />
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_NC.map((n) => (
                  <button key={n} type="button" onClick={() => setNc(n)} className={`chip ${n === nc ? "border-chakra bg-chakra text-paper-ink" : "text-text hover:border-muted"}`}>
                    NC {n}
                  </button>
                ))}
              </div>
              <dl className="grid grid-cols-4 gap-2 text-center">
                {[
                  ["Atrib.", b.attr],
                  ["Perícias", b.skill],
                  ["Poderes", b.power],
                  ["Mín.", b.minAttr],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-ink-2 px-1 py-2">
                    <dt className="text-[11px] text-faint">{k}</dt>
                    <dd className="font-display text-xl font-extrabold">{v}</dd>
                  </div>
                ))}
              </dl>
              <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onNew} className="btn-primary h-12 text-base">
                <IconPlus className="size-5" /> Criar nova ficha
              </motion.button>
            </li>
            <AnimatePresence initial={false}>
              {list.map((c) => {
                return (
                  <motion.li key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="card group relative flex flex-col gap-3 p-4">
                    <Link href={`/ficha/${c.id}`} className="absolute inset-0 rounded-2xl" aria-label={`Abrir ${c.name || "ficha sem nome"}`} />
                    <div className="flex items-start gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-seal font-display text-2xl font-extrabold text-white">{originKanji(c)}</span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-display text-lg font-extrabold text-paper">{c.name || "Shinobi sem nome"}</span>
                        <span className="truncate text-sm text-muted">{originName(c) ?? "Sem clã/hijutsu"}</span>
                      </div>
                      <span className="ml-auto rounded-lg bg-ink-2 px-2 py-1 text-sm font-bold text-chakra">NC {c.nc}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-faint">
                      <span>{rankLabel(c.nc)}</span>
                      <span>editada {new Date(c.updatedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="relative z-10 flex gap-2">
                      <button type="button" className="btn-ghost min-h-9 flex-1 text-xs" onClick={() => duplicate(c.id)}>
                        <IconCopy className="size-4" /> Duplicar
                      </button>
                      {confirmDel === c.id ? (
                        <button type="button" className="btn min-h-9 flex-1 bg-bad text-xs text-white" onClick={() => { remove(c.id); setConfirmDel(null); }}>
                          Confirmar exclusão
                        </button>
                      ) : (
                        <button type="button" className="btn-ghost min-h-9 flex-1 text-xs" onClick={() => setConfirmDel(c.id)}>
                          <IconTrash className="size-4" /> Excluir
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>

      <footer className="mt-auto border-t border-line pt-6 text-xs leading-relaxed text-faint">
        Ferramenta de fã, sem fins comerciais, baseada no material gratuito do Projeto D8 (Naruto: Shinobi no Sho). Naruto © Masashi Kishimoto / Shueisha.
      </footer>
    </main>
  );
}
