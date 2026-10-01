"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { APTIDOES, APT_BY_ID } from "@/lib/data/aptidoes";
import { ORIGENS, ORIGIN_BY_ID } from "@/lib/data/origens";
import { BIJUUS, PODERES, PODER_BY_ID } from "@/lib/data/poderes";
import { CUSTOM_ORIGIN } from "@/lib/rules";
import type { Origin, Source } from "@/lib/types";
import { Badge, IconCheck, IconDice, IconPlus, IconSearch, StepHeader } from "../../ui";
import { norm, stepKicker, type Setter, type StepProps } from "../shared";

const TABS = [
  { key: "all", label: "Todos" },
  { key: "cla", label: "Clãs" },
  { key: "hijutsu", label: "Hijutsus" },
] as const;
const SOURCES: ("Todos" | Source)[] = ["Todos", "Básico", "Hijutsus 1", "Hijutsus 2", "Guia Avançado"];

export function StepCla({ c, set }: StepProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [src, setSrc] = useState<(typeof SOURCES)[number]>("Todos");
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      ORIGENS.filter((o) => (tab === "all" || o.kind === tab) && (src === "Todos" || o.source === src) && (!q || norm(o.name + " " + o.desc).includes(norm(q)))),
    [tab, src, q],
  );
  const sel = c.originId ? ORIGIN_BY_ID[c.originId] : null;

  const pick = (o: Origin) =>
    set((d) => {
      if (d.originId === o.id) return;
      d.originId = o.id;
      d.originOption = 0;
      d.extraOrigins = d.extraOrigins.filter((x) => x !== o.id);
    });

  // Sorteia entre os clãs e hijutsus que os filtros mostram (sem repetir o atual) e, se houver, um dos caminhos.
  const top = useRef<HTMLDivElement>(null);
  const pool = list.filter((o) => o.id !== c.originId);
  const randomize = () => {
    if (!pool.length) return;
    const o = pool[Math.floor(Math.random() * pool.length)];
    set((d) => {
      d.originId = o.id;
      d.originOption = Math.floor(Math.random() * o.options.length);
      d.extraOrigins = d.extraOrigins.filter((x) => x !== o.id);
    });
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleExtra = (o: Origin) =>
    set((d) => {
      d.extraOrigins = d.extraOrigins.includes(o.id) ? d.extraOrigins.filter((x) => x !== o.id) : [...d.extraOrigins, o.id];
    });

  return (
    <div ref={top} className="flex scroll-mt-24 flex-col gap-6">
      <StepHeader kicker={stepKicker(c, "cla")} title="Clã ou Hijutsu">
        Escolher não custa pontos: libera a compra das aptidões e poderes restritos. Por regra, apenas um clã ou um hijutsu (Hachimon Tonkou pode ser somado); origens extras sem a regra opcional ficam como observação.
      </StepHeader>

      <AnimatePresence initial={false}>
        {c.originId === CUSTOM_ORIGIN && <CustomOriginEditor key="custom" c={c} set={set} />}
        {sel && (
          <motion.section key={sel.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 rounded-2xl bg-paper p-5 text-paper-ink">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-seal font-display text-3xl font-extrabold text-white">{sel.kanji}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-extrabold">{sel.name}</h3>
                  <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-bold text-paper-muted">{sel.source}</span>
                </div>
                <p className="text-sm leading-relaxed text-paper-muted">{sel.desc}</p>
              </div>
              <button type="button" onClick={() => set((d) => void ((d.originId = null), (d.originOption = 0)))} className="btn min-h-9 border border-[#cdbb9c] text-xs text-paper-ink">
                Remover
              </button>
            </div>

            {sel.options.length > 1 && (
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opção de hijutsu">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Escolha a opção</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sel.options.map((o, i) => (
                    <button
                      key={o.label}
                      type="button"
                      role="radio"
                      aria-checked={c.originOption === i}
                      onClick={() => set((d) => void (d.originOption = i))}
                      className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition ${c.originOption === i ? "border-seal bg-white" : "border-transparent bg-paper-2"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const o = sel.options[c.originOption] ?? sel.options[0];
              return (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Aptidões liberadas</span>
                    <div className="flex flex-wrap gap-1.5">
                      {o.aptidoes.length ? o.aptidoes.map((id) => <span key={id} className="rounded-full border border-[#cdbb9c] px-2.5 py-1 text-xs">{APT_BY_ID[id]?.name ?? id}</span>) : <span className="text-sm text-paper-muted">—</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Poderes liberados</span>
                    <div className="flex flex-wrap gap-1.5">
                      {o.poderes.length ? o.poderes.map((id) => <span key={id} className="rounded-full bg-seal px-2.5 py-1 text-xs font-bold text-white">{PODER_BY_ID[id]?.name ?? id}</span>) : <span className="text-sm text-paper-muted">—</span>}
                    </div>
                  </div>
                  {o.note && <p className="text-xs leading-relaxed text-paper-muted sm:col-span-2">{o.note}</p>}
                </div>
              );
            })()}

            {sel.id === "jinchuuriki" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Bijuu selada</span>
                <select className="rounded-xl border border-[#cdbb9c] bg-white px-3 py-2.5" value={c.bijuu ?? ""} onChange={(e) => set((d) => void (d.bijuu = e.target.value))}>
                  <option value="">Escolha…</option>
                  {BIJUUS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-line-2 bg-panel px-4 focus-within:border-chakra">
          <IconSearch className="size-5 text-muted" />
          <span className="sr-only">Buscar clã ou hijutsu</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar clã ou hijutsu" className="flex-1 bg-transparent outline-none placeholder:text-faint" />
        </label>
        <button
          type="button"
          onClick={randomize}
          disabled={!pool.length}
          title={tab === "cla" ? "Sortear um clã" : tab === "hijutsu" ? "Sortear um hijutsu" : "Sortear um clã ou hijutsu"}
          className="btn-ghost h-12 shrink-0 disabled:opacity-40"
        >
          <IconDice className="size-5" /> Aleatório
        </button>
        <div className="flex gap-1 rounded-xl border border-line-2 p-1">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`relative h-10 flex-1 rounded-lg px-4 text-sm font-bold transition ${tab === t.key ? "text-paper-ink" : "text-muted"}`}>
              {tab === t.key && <motion.span layoutId="cla-tab" className="absolute inset-0 rounded-lg bg-chakra" />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        {SOURCES.map((s) => (
          <button key={s} type="button" onClick={() => setSrc(s)} className={`chip shrink-0 ${src === s ? "border-paper bg-paper text-paper-ink" : "text-muted hover:border-muted"}`}>
            {s}
          </button>
        ))}
      </div>

      <motion.ul layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <motion.li layout key="__custom">
          <button
            type="button"
            aria-pressed={c.originId === CUSTOM_ORIGIN}
            onClick={() => set((d) => void ((d.originId = CUSTOM_ORIGIN), (d.originOption = 0)))}
            className={`flex h-full min-h-40 w-full flex-col items-start gap-3 rounded-2xl border-2 border-dashed p-4 text-left transition ${c.originId === CUSTOM_ORIGIN ? "border-chakra bg-chakra/10" : "border-line-2 hover:border-muted"}`}
          >
            <span className="grid size-12 place-items-center rounded-xl bg-chakra text-paper-ink">
              <IconPlus />
            </span>
            <span className="font-display text-lg font-extrabold text-paper">Criar clã ou hijutsu próprio</span>
            <span className="text-sm leading-snug text-muted">Invente sua linhagem: dê nome, símbolo, descrição e escolha o que ela libera.</span>
          </button>
        </motion.li>
        {list.map((o) => {
          const on = c.originId === o.id;
          const extra = c.extraOrigins.includes(o.id);
          const canExtra = !!c.originId && !on;
          const extraRule = !o.stackable && !c.optionals.multiHijutsu;
          const n = o.options.reduce((t, x) => t + x.aptidoes.length + x.poderes.length, 0);
          return (
            <motion.li layout key={o.id} className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 transition ${on ? "border-seal bg-paper text-paper-ink" : extra ? "border-chakra bg-panel" : "border-line bg-panel hover:border-line-2"}`}>
              <button type="button" onClick={() => pick(o)} className="absolute inset-0 rounded-2xl" aria-label={`Escolher ${o.name}`} aria-pressed={on} />
              <div className="flex items-start justify-between gap-2">
                <span className={`grid size-12 place-items-center rounded-xl font-display text-2xl font-extrabold ${on ? "bg-seal text-white" : "bg-line text-paper"}`}>{o.kanji}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${on ? "text-paper-muted" : "text-faint"}`}>{o.source}</span>
                  {on && (
                    <Badge tone="seal">
                      <IconCheck className="size-3" /> Escolhido
                    </Badge>
                  )}
                  {extra && <Badge tone="chakra">Extra</Badge>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display text-lg font-extrabold">{o.name}</span>
                <span className={`text-sm leading-snug ${on ? "text-paper-muted" : "text-muted"}`}>{o.desc}</span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className={`text-xs font-bold ${on ? "text-seal-dark" : "text-chakra"}`}>
                  {o.kind === "cla" ? "Clã" : "Hijutsu"} · {n} opções{o.options.length > 1 ? ` · ${o.options.length} caminhos` : ""}
                </span>
                {canExtra && (
                  <button type="button" onClick={() => toggleExtra(o)} className="relative z-10 chip min-h-8 text-xs text-text">
                    {extra ? "Remover extra" : extraRule ? "+ Extra (fora da regra)" : "+ Extra"}
                  </button>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
      {list.length === 0 && <p className="text-center text-muted">Nada encontrado.</p>}
    </div>
  );
}

const RESTRICTED_APTS = APTIDOES.filter((a) => a.cat === "restrita" || a.cat === "especial");
const RESTRICTED_POWERS = PODERES.filter((p) => p.restricted);

function CustomOriginEditor({ c, set }: { c: StepProps["c"]; set: Setter }) {
  const [q, setQ] = useState("");
  const o = c.customOrigin;
  const match = (name: string) => !q || norm(name).includes(norm(q));
  const toggle = (list: "aptidoes" | "poderes", id: string) =>
    set((d) => {
      const cur = d.customOrigin[list];
      d.customOrigin[list] = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    });
  const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-xs transition ${on ? "border-seal bg-seal text-white" : "border-[#cdbb9c] hover:bg-white"}`;

  return (
    <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 rounded-2xl bg-paper p-5 text-paper-ink">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl font-extrabold">Seu clã ou hijutsu</h3>
        <button type="button" onClick={() => set((d) => void (d.originId = null))} className="btn min-h-9 border border-[#cdbb9c] text-xs text-paper-ink">
          Remover
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[5rem_1fr_auto]">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Símbolo</span>
          <input maxLength={2} className="h-12 rounded-xl border border-[#cdbb9c] bg-white text-center font-display text-2xl font-extrabold" value={o.kanji} placeholder="忍" onChange={(e) => set((d) => void (d.customOrigin.kanji = e.target.value))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Nome</span>
          <input className="h-12 rounded-xl border border-[#cdbb9c] bg-white px-3" value={o.name} placeholder="Nome do clã ou hijutsu" onChange={(e) => set((d) => void (d.customOrigin.name = e.target.value))} />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Tipo</span>
          <div className="flex h-12 gap-1 rounded-xl border border-[#cdbb9c] bg-white p-1">
            {(["cla", "hijutsu"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={o.kind === k} onClick={() => set((d) => void (d.customOrigin.kind = k))} className={`flex-1 rounded-lg px-3 text-sm font-bold ${o.kind === k ? "bg-seal text-white" : ""}`}>
                {k === "cla" ? "Clã" : "Hijutsu"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">Descrição</span>
        <textarea rows={3} className="rounded-xl border border-[#cdbb9c] bg-white px-3 py-2" value={o.desc} placeholder="História, habilidades e fraquezas da linhagem." onChange={(e) => set((d) => void (d.customOrigin.desc = e.target.value))} />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-paper-muted">O que ela libera (opcional)</span>
        <p className="text-xs text-paper-muted">Marque aptidões e poderes restritos dos livros que sua origem pode comprar. Técnicas inéditas você cria nas etapas Aptidões e Poderes.</p>
        <input className="h-11 rounded-xl border border-[#cdbb9c] bg-white px-3" placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrar aptidões e poderes restritos" />
        <span className="mt-1 text-xs font-bold text-paper-muted">Poderes restritos ({o.poderes.length})</span>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {RESTRICTED_POWERS.filter((p) => match(p.name) || o.poderes.includes(p.id)).map((p) => (
            <button key={p.id} type="button" aria-pressed={o.poderes.includes(p.id)} onClick={() => toggle("poderes", p.id)} className={chip(o.poderes.includes(p.id))}>
              {p.name}
            </button>
          ))}
        </div>
        <span className="mt-1 text-xs font-bold text-paper-muted">Aptidões restritas ({o.aptidoes.length})</span>
        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
          {RESTRICTED_APTS.filter((a) => match(a.name) || o.aptidoes.includes(a.id)).map((a) => (
            <button key={a.id} type="button" aria-pressed={o.aptidoes.includes(a.id)} onClick={() => toggle("aptidoes", a.id)} className={chip(o.aptidoes.includes(a.id))}>
              {a.name}
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
