"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { paramsPoder } from "@/lib/ataques";
import { EFEITOS_KEKKEI_TOUTA, EFEITO_BY_ID, EXCLUSIVOS, KANJI_PODER, NINPOU_BASE, PODERES, PODER_BY_ID, VERSATEIS } from "@/lib/data/poderes";
import { HIBON_BONUS, HIBON_ELEMENTOS, allowedRestricted, budgetFor, evolucaoDe, evolucaoNasOutras, evolucaoSe, evolutionLevel, exclusivosDe, firstEvolution, gratisFonte, hasApt, hibonBonus, hibonEffects, hibonEntry, isRepurchase, kekkeiGratis, nivelGratis, nextEvolution, ownersText, powerLevel, reqsMet, spent, tecId, tecIndex, uid, versatileName, versatilePicks, versatileSlots } from "@/lib/rules";
import type { Character, Efeito, HibonBonus, Poder, PowerEntry } from "@/lib/types";
import { Badge, IconCheck, IconLeft, IconPlus, IconRight, IconSearch, IconTrash, IconX, RulesNote, Sheet, Stepper, StepHeader, Toggle, corPoder, tintPoder } from "../../ui";
import { EffectPicker, type PickGroup, type PickOption, type PickTab } from "../EffectPicker";
import { norm, stepKicker, type StepProps } from "../shared";

/**
 * Poderes: a lista das compras de um lado e o editor da compra escolhida do outro (no celular, uma tela de cada vez).
 * Builds grandes (várias Versatilidades no nível 10) ficam numa linha por compra em vez de um card enorme por compra.
 */
export function StepPoderes({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const left = b.power - s.power;
  const allowed = useMemo(() => allowedRestricted(c), [c]);
  // null = lista (no celular); no computador o editor mostra a 1ª compra quando nada foi escolhido.
  const [sel, setSel] = useState<number | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [lq, setLq] = useState("");
  const cur = c.poderes.length ? Math.min(sel ?? 0, c.poderes.length - 1) : -1;

  const blocked = (p: Poder) => (p.restricted ? !allowed.powers.has(p.id) : c.originId === "samurai");
  const warn = (p: PowerEntry) => {
    const def = PODER_BY_ID[p.id];
    return p.level > b.cap || (!!def && (!reqsMet(c, def.req) || blocked(def)));
  };

  const add = (p: Poder) => {
    const n = c.poderes.length;
    set((d) => void d.poderes.push({ id: p.id, level: 1, effects: [null], techniques: [""], ...(p.id === "versatilidade" ? { versatile: ["", ""], owner: [null] } : {}) }));
    setSel(n);
    setCatOpen(false);
  };
  const addCustom = (name: string) => {
    const n = c.poderes.length;
    set((d) => void d.poderes.push({ id: `custom:${uid()}`, customName: name, level: 1, effects: [null], techniques: [""] }));
    setSel(n);
    setCatOpen(false);
  };
  const remove = (idx: number) => {
    set((d) => void d.poderes.splice(idx, 1));
    setSel(null);
  };

  const listed = c.poderes.map((p, idx) => ({ p, idx })).filter(({ p }) => !lq.trim() || norm(powerText(p)).includes(norm(lq.trim())));

  return (
    <div className="flex flex-col gap-5">
      <StepHeader kicker={stepKicker(c, "poderes")} title="Poderes" />
      <RulesNote>
        Cada nível custa 1 ponto de poder e, pela regra, o nível máximo é {b.cap} (metade do NC). Poderes de efeitos ganham um efeito novo a cada nível, de nível igual ou menor, ou evoluem um efeito que já têm (ex.: Raio escolhido de novo com o poder no nível 5 vira Raio Nv 5). A ordem das escolhas não importa: qualquer efeito até o nível do poder pode ir em qualquer escolha. Dá para comprar o mesmo poder outra vez para ter mais efeitos: o nível 1 da nova compra é grátis e vale o nível mais alto. No NC estendido, poderes passam do nível 10. Nada é travado: o que sair da regra vira observação.
      </RulesNote>

      {kekkeiGratis(c).length > 0 && (
        <p className="rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm leading-relaxed text-text">
          Elementos grátis:{" "}
          {kekkeiGratis(c)
            .map((g) => `${PODER_BY_ID[g.el].name.split(" (")[0]} 1 grátis pelo ${gratisFonte(g.from)} (Canhão até o nível ${g.lvl})`)
            .join(" · ")}
          . Para mais efeitos nesses elementos, compre o poder: o nível 1 já vem pago e eles não contam na afinidade elemental.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[19rem_minmax(0,1fr)]">
        <section aria-label="Seus poderes" className={`${sel !== null ? "hidden lg:flex" : "flex"} flex-col gap-3 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1`}>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className={`rounded-xl px-3 py-1.5 font-bold ${left < 0 ? "bg-bad/15 text-bad" : left === 0 ? "bg-ok/15 text-ok" : "bg-chakra/15 text-chakra"}`}>
              {left >= 0 ? `${left} ponto(s) restantes` : `${-left} ponto(s) a mais`}
            </span>
            <span className="rounded-xl bg-panel px-3 py-1.5 text-muted">
              {s.powerLevels} em poderes · {s.paidApts} em aptidões
            </span>
          </div>
          <button type="button" className="btn-primary" onClick={() => setCatOpen(true)}>
            <IconPlus className="size-4" /> Adicionar poder
          </button>
          {c.poderes.length > 5 && (
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line-2 bg-ink-2 px-3 focus-within:border-chakra">
              <IconSearch className="size-4 shrink-0 text-muted" />
              <span className="sr-only">Filtrar seus poderes</span>
              <input value={lq} onChange={(e) => setLq(e.target.value)} placeholder="Filtrar por poder, efeito ou técnica" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
            </label>
          )}
          {c.poderes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line-2 p-5 text-center text-sm text-muted">Nenhum poder ainda. Toque em “Adicionar poder”.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {listed.map(({ p, idx }) => (
                <PowerRow key={`${p.id}-${idx}`} c={c} idx={idx} on={idx === cur} warn={warn(p)} onPick={() => setSel(idx)} />
              ))}
              {listed.length === 0 && <li className="rounded-2xl border border-dashed border-line-2 p-4 text-center text-sm text-muted">Nenhum poder com “{lq}”.</li>}
            </ul>
          )}
        </section>

        <section aria-label="Editar poder" className={`${sel === null ? "hidden lg:block" : "block"} min-w-0`}>
          <button type="button" className="btn-ghost mb-3 lg:hidden" onClick={() => setSel(null)}>
            <IconLeft className="size-4" /> Poderes
          </button>
          {cur >= 0 ? (
            <PowerEditor key={cur} c={c} set={set} idx={cur} blocked={blocked} onRemove={() => remove(cur)} />
          ) : (
            <p className="card hidden px-6 py-10 text-center text-sm text-muted lg:block">Os poderes que você adicionar aparecem aqui para editar, um de cada vez.</p>
          )}
        </section>
      </div>

      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title="Adicionar poder">
        <PowerCatalog c={c} blocked={blocked} onAdd={add} onAddCustom={addCustom} />
      </Sheet>
    </div>
  );
}

/** Texto de busca de uma compra: nome, poderes versáteis, efeitos e técnicas. */
function powerText(p: PowerEntry) {
  const def = PODER_BY_ID[p.id];
  return [
    def?.name ?? "",
    p.customName ?? "",
    ...(p.versatile ?? []).map((id) => (id ? versatileName(id) : "")),
    ...p.effects.map((e) => (e ? (EFEITO_BY_ID[e]?.name ?? "") : "")),
    ...p.techniques,
  ].join(" ");
}

const shortName = (id: string) => (PODER_BY_ID[id]?.name ?? id).split(" (")[0];
const kanjiOf = (id: string) => KANJI_PODER[id] ?? shortName(id).charAt(0);

/** Ordem dos níveis da Versatilidade: o poder versátil de cada nível (-1 = nível 1, de todos). */
function owners(p: PowerEntry) {
  return Array.from({ length: p.level }, (_, i) => (i === 0 ? -1 : (p.owner?.[i] ?? null)));
}
/** Níveis que quebram a regra de no máximo 2 seguidos no mesmo poder versátil. */
function brokenLevels(o: (number | null)[]) {
  const out = new Set<number>();
  o.forEach((k, i) => i >= 3 && k !== null && k >= 0 && k === o[i - 1] && k === o[i - 2] && out.add(i));
  return out;
}

type EffTone = "excl" | "evo" | "geral";

/**
 * Cada escolha de um poder de efeitos, na ordem: a 1ª vez que um efeito aparece é o efeito novo e cada repetição
 * depois dela é uma evolução. `lvl` é o nível do efeito naquela escolha (null = passou das evoluções que existem);
 * `from`/`next` apontam a escolha anterior/seguinte do mesmo efeito (-1 = nenhuma). A evolução conta as outras tabelas
 * do mesmo poder (regra confirmada pelo autor); `outra`: a escolha evolui o efeito de outra tabela.
 */
function effectRows(c: Character, idx: number, p: PowerEntry, pular: boolean) {
  const eff = p.effects.slice(0, p.level);
  return Array.from({ length: p.level }, (_, i) => {
    const id = eff[i] ?? null;
    if (!id) return { id: null, k: 0, lvl: null, tone: null, from: -1, next: -1, outra: false };
    const k = evolucaoDe(c, idx, i);
    const from = eff.slice(0, i).lastIndexOf(id);
    const tone: EffTone = k ? "evo" : EXCLUSIVOS.includes(id) ? "excl" : "geral";
    return { id, k, lvl: k ? evolutionLevel(id, k) : (EFEITO_BY_ID[id]?.level ?? null), tone, from, next: eff.indexOf(id, i + 1), outra: from < 0 && k > firstEvolution(id, i + 1, pular) };
  });
}

/** Efeitos distintos da compra, cada um no nível mais alto que alcançou. */
function effectTotals(rows: ReturnType<typeof effectRows>) {
  const out = new Map<string, { id: string; lvl: number | null; tone: EffTone }>();
  for (const r of rows) {
    if (!r.id || !r.tone) continue;
    const cur = out.get(r.id);
    if (!cur || (r.k > 0 && r.lvl !== null)) out.set(r.id, { id: r.id, lvl: r.lvl, tone: cur && r.k ? "evo" : r.tone });
  }
  return [...out.values()];
}

const CELL: Record<EffTone, string> = {
  excl: "bg-seal/35 text-[#ffb4a1]",
  evo: "bg-ok/20 text-ok",
  geral: "bg-line-2 text-text",
};
const PILL_FICHA: Record<EffTone, string> = {
  excl: "bg-seal text-white",
  evo: "bg-ok/20 text-ok",
  geral: "bg-panel-2 text-text",
};

/* ---------------- lista ---------------- */

function PowerRow({ c, idx, on, warn, onPick }: { c: Character; idx: number; on: boolean; warn: boolean; onPick: () => void }) {
  const p = c.poderes[idx];
  const def = PODER_BY_ID[p.id];
  const name = p.customName && (!def || p.id === "ninpou" || p.id === "hibon") ? p.customName : def ? shortName(p.id) : "Poder";
  const nth = c.poderes.slice(0, idx + 1).filter((x) => x.id === p.id).length;
  const many = c.poderes.filter((x) => x.id === p.id).length > 1;
  const isV = p.id === "versatilidade";
  const vv = (p.versatile ?? []).filter(Boolean);
  const done = isV ? (vv.length ? 1 : 0) + Array.from({ length: Math.max(0, p.level - 1) }, (_, j) => j + 1).filter((i) => p.owner?.[i] != null && p.effects[i]).length : p.effects.slice(0, p.level).filter(Boolean).length;
  const hasProgress = isV || def?.mode === "efeitos";
  const rows = !isV && def?.mode === "efeitos" ? effectRows(c, idx, p, c.optionals.pularEvolucoes) : null;
  const chosen = rows ? rows.filter((r) => r.id).length : 0;
  const o = owners(p);
  const broken = brokenLevels(o);
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-current={on ? "true" : undefined}
        className={`flex w-full flex-col gap-2 rounded-2xl border p-3 text-left transition ${on ? "border-chakra bg-panel-2" : "border-line bg-panel hover:border-line-2"}`}
      >
        <span className="flex w-full items-center gap-2">
          {!isV && KANJI_PODER[p.id] && (
            <span className="font-display font-extrabold" style={{ color: corPoder(p.id) }} aria-hidden="true">
              {KANJI_PODER[p.id]}
            </span>
          )}
          <span className="min-w-0 truncate font-bold text-paper">{name}</span>
          {many && <span className="shrink-0 rounded-full bg-ink-2 px-2 py-0.5 text-[11px] font-bold text-muted">{nth}ª</span>}
          {warn && (
            <span className="size-2 shrink-0 rounded-full bg-bad">
              <span className="sr-only">fora da regra</span>
            </span>
          )}
          <span className="ml-auto shrink-0 text-sm font-bold text-chakra">Nv {p.level}</span>
          <IconRight className="size-4 shrink-0 text-faint lg:hidden" />
        </span>
        {(vv.length > 0 || hasProgress) && (
          <span className="flex w-full flex-wrap items-center gap-1.5">
            {vv.map((id) => (
              <span key={id} className="inline-flex h-6 items-center gap-1 rounded-lg px-2 text-xs font-bold text-text" style={{ background: tintPoder(id) }}>
                <span style={{ color: corPoder(id) }}>{kanjiOf(id)}</span>
                {shortName(id)}
              </span>
            ))}
            {rows && chosen > 0 && (
              <span className="text-xs text-muted">
                {effectTotals(rows).length} efeito(s) · {rows.filter((r) => r.k > 0).length} evolução(ões)
              </span>
            )}
            {hasProgress && (
              <span className={`ml-auto inline-flex items-center gap-1 text-xs ${done >= p.level ? "text-ok" : "text-muted"}`}>
                {done >= p.level && <IconCheck className="size-3.5" />}
                {done}/{p.level}
              </span>
            )}
          </span>
        )}
        {rows && chosen > 0 && (
          <span className="flex w-full gap-0.5" aria-hidden="true">
            {rows.map((r, i) => (
              <span key={i} className={`grid h-5 flex-1 place-items-center rounded-md text-[11px] font-bold ${r.tone ? CELL[r.tone] : "bg-ink-2 text-faint"}`}>
                {r.tone ? (r.lvl ?? "?") : "·"}
              </span>
            ))}
          </span>
        )}
        {isV && vv.length > 0 && p.level > 1 && (
          <span className="flex w-full gap-0.5" aria-hidden="true">
            {o.map((k, i) => (
              <SeqCell key={i} p={p} k={k} broken={broken.has(i)} small />
            ))}
          </span>
        )}
      </button>
    </li>
  );
}

/** Um nível na barra de ordem da Versatilidade. */
function SeqCell({ p, k, broken, small }: { p: PowerEntry; k: number | null; broken: boolean; small?: boolean }) {
  const id = k !== null && k >= 0 ? p.versatile?.[k] : undefined;
  const label = k === -1 ? "∗" : id ? kanjiOf(id) : "·";
  return (
    <span
      className={`grid flex-1 place-items-center rounded-md font-bold ${small ? "h-5 text-[11px]" : "h-7 text-xs"} ${broken ? "ring-2 ring-bad" : ""}`}
      style={{ background: id ? tintPoder(id, 20) : "var(--color-ink-2)", color: id ? corPoder(id) : "var(--color-faint)" }}
    >
      {label}
    </span>
  );
}

/* ---------------- editor ---------------- */

function PowerEditor({ c, set, idx, blocked, onRemove }: StepProps & { idx: number; blocked: (p: Poder) => boolean; onRemove: () => void }) {
  const b = budgetFor(c.nc, c.optionals);
  const pular = c.optionals.pularEvolucoes;
  const [showDesc, setShowDesc] = useState(false);
  const p = c.poderes[idx];
  const def = PODER_BY_ID[p.id];
  const name = def?.name ?? p.customName ?? "Poder";
  const met = def ? reqsMet(c, def.req) : true;
  const again = isRepurchase(c, idx);
  const gratis = nivelGratis(c, idx);
  const nth = c.poderes.slice(0, idx + 1).filter((x) => x.id === p.id).length;
  const top = powerLevel(c, p.id);
  // Atributo ou perícia chave do poder (Controle Perfeito: Inteligência; Kibaku Nendo: Arte) e bônus do elemento.
  const params = paramsPoder(c, p.id, top);
  const edit = (fn: (p: PowerEntry) => void) => set((d) => fn(d.poderes[idx]));

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex flex-col gap-3 bg-paper p-3.5 text-paper-ink sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl font-extrabold">{name}</span>
            {def?.restricted && <span className="rounded-full bg-seal px-2 py-0.5 text-[11px] font-bold text-white">restrito</span>}
            {def?.element && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-bold text-paper-muted">elemento</span>}
            {def && blocked(def) && (
              <span className="rounded-full bg-seal-dark px-2 py-0.5 text-[11px] font-bold text-white">
                {def.restricted ? `restrito: ${ownersText("poderes", def.id)}` : "Samurai não compra poderes comuns"}
              </span>
            )}
            {again && <span className="rounded-full bg-ok px-2 py-0.5 text-[11px] font-bold text-paper-ink">{nth}ª compra · nível 1 grátis</span>}
            {gratis && <span className="rounded-full bg-ok px-2 py-0.5 text-[11px] font-bold text-paper-ink">nível 1 grátis pelo {gratisFonte(gratis)}</span>}
            {p.id === "doton" && hasApt(c, "terra-insaciavel") && <span className="rounded-full bg-ok px-2 py-0.5 text-[11px] font-bold text-paper-ink">Barreira Nv 6 grátis (Terra Insaciável)</span>}
            {p.level > b.cap && <span className="rounded-full bg-seal-dark px-2 py-0.5 text-[11px] font-bold text-white">acima do limite {b.cap}</span>}
          </div>
          {def?.reqText && <span className={`text-xs ${met ? "text-paper-muted" : "font-bold text-seal-dark"}`}>Pré-requisito: {def.reqText}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-paper-muted">nível</span>
            <Stepper
              tone="paper"
              size="sm"
              label={`nível de ${name}`}
              value={p.level}
              min={1}
              onChange={(n) =>
                edit((x) => {
                  x.level = n;
                  while (x.effects.length < n) x.effects.push(null);
                  while (x.techniques.length < n) x.techniques.push("");
                })
              }
            />
          </div>
          <button type="button" onClick={onRemove} className="grid size-11 place-items-center rounded-xl border border-[#cdbb9c] text-paper-ink" aria-label={`Remover ${name}`}>
            <IconTrash className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-3.5 sm:p-4">
        {(p.id === "ninpou" || p.id === "hibon" || !def) && (
          <label className="flex flex-col gap-1.5">
            <span className="label">{def ? "Nome / estilo do poder" : "Nome do poder"}</span>
            <input className="field" value={p.customName ?? ""} placeholder="Ex.: Ninpou: Hari Jizou" onChange={(e) => edit((x) => void (x.customName = e.target.value))} />
          </label>
        )}

        {def?.mode === "efeitos" && top > p.level && (
          <p className="text-xs text-muted">
            Os parâmetros usam o nível mais alto entre as compras de {name}: {top}. Os efeitos desta compra vão até o nível {p.level} dela.
          </p>
        )}
        {def?.mode === "efeitos" && (
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Dano base", params.danoTxt, params.dano],
              ["Dif. padrão", params.difTxt, params.dif],
              ["Custo máx.", p.id === "kibaku-nendo" ? "chakra e bombas = nível" : "chakra = nível", `${top} PC`],
            ].map(([k, f, v]) => (
              <div key={k as string} className="flex flex-col items-center gap-0.5 rounded-xl bg-ink-2 px-2 py-1.5 sm:flex-row sm:gap-2.5 sm:px-3">
                <span className="font-display text-xl font-extrabold text-paper">{v}</span>
                <span className="flex flex-col items-center leading-tight sm:items-start">
                  <span className="text-[11px] font-bold text-text">{k}</span>
                  <span className="hidden text-[10px] text-faint sm:block">{f}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {p.id === "versatilidade" && (
          <VersatileEditor
            c={c}
            idx={idx}
            p={p}
            slots={versatileSlots(c, idx)}
            taken={c.poderes.flatMap((x, j) => (j !== idx && x.id === "versatilidade" ? (x.versatile ?? []) : []))}
            lista={c.optionals.fuuinjutsuLista}
            pular={pular}
            edit={edit}
          />
        )}

        {p.id === "hibon" && <HibonEditor c={c} p={p} edit={edit} />}

        {def?.mode === "efeitos" && p.id !== "versatilidade" && (
          <EffectsEditor c={c} idx={idx} p={p} effects={p.id === "hibon" ? hibonEffects(hibonEntry(c)?.hibonElement) : (def.effects ?? [])} name={name} top={p.level} pular={pular} showDesc={showDesc} setShowDesc={setShowDesc} edit={edit} />
        )}

        {def?.mode === "tecnicas" && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {def.techniques!.map((t) => {
              const on = t.level <= p.level;
              return (
                <li key={t.name} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${on ? "bg-ok/10 text-text" : "bg-ink-2 text-faint"}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${on ? "bg-ok text-paper-ink" : "bg-line-2"}`}>{on ? <IconCheck className="size-3.5" /> : t.level}</span>
                  <span>
                    <span className="text-xs text-faint">Nv {t.level} · </span>
                    {t.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <details className="group rounded-xl border border-line [&_summary::-webkit-details-marker]:hidden" open={def?.mode === "livre" || !!p.note}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-bold text-muted hover:text-text">
            <IconRight className="size-4 shrink-0 transition group-open:rotate-90" />
            Anotações e descrição do poder
          </summary>
          <div className="flex flex-col gap-3 px-3 pb-3">
            <label className="flex flex-col gap-1.5">
              <span className="sr-only">Anotações</span>
              <textarea rows={2} className="field resize-y" value={p.note ?? ""} placeholder={def?.mode === "livre" ? "Técnicas, invocações, benefícios por nível…" : "Detalhes, visual, combinações…"} onChange={(e) => edit((x) => void (x.note = e.target.value))} />
            </label>
            {def && <p className="text-xs leading-relaxed text-faint">{def.desc}</p>}
          </div>
        </details>
      </div>
    </motion.article>
  );
}

/**
 * Hibon Ninpou (Livro Básico, pág. 212): duas bonificações (diferentes, ou o Dano Adicional duas vezes) e o elemento
 * básico de onde vêm os efeitos exclusivos. As escolhas ficam na 1ª compra e valem para todas.
 */
function HibonEditor({ c, p, edit }: { c: Character; p: PowerEntry; edit: (fn: (x: PowerEntry) => void) => void }) {
  if (hibonEntry(c) !== p) return <p className="rounded-xl bg-ink-2 px-3 py-2 text-xs leading-relaxed text-muted">As bonificações e o elemento do Hibon Ninpou ficam na 1ª compra e valem para esta também.</p>;
  const b = [p.hibonBonus?.[0] ?? null, p.hibonBonus?.[1] ?? null];
  const hb = hibonBonus(c);
  const setBonus = (k: number, v: string) =>
    edit((x) => {
      const cur = [x.hibonBonus?.[0] ?? null, x.hibonBonus?.[1] ?? null];
      cur[k] = (v || null) as HibonBonus | null;
      x.hibonBonus = cur;
    });
  const efeitos = [hb.dano ? `+${hb.dano} de dano em todo efeito` : "", hb.dureza ? `+${hb.dureza} de dureza nas criações` : "", hb.dif ? `+${hb.dif} na dificuldade de resistência` : ""].filter(Boolean);
  const el = p.hibonElement ?? "";
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-ink-2 p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1].map((k) => (
          <label key={k} className="flex flex-col gap-1">
            <span className="label">{k + 1}ª bonificação</span>
            <select className="field py-2" value={b[k] ?? ""} onChange={(e) => setBonus(k, e.target.value)}>
              <option value="">Escolher…</option>
              {HIBON_BONUS.map((o) => (
                <option key={o.id} value={o.id} disabled={o.id !== "dano" && b[1 - k] === o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex flex-col gap-1">
          <span className="label">Elemento dos exclusivos</span>
          <select className="field py-2" value={el} onChange={(e) => edit((x) => void (x.hibonElement = e.target.value || null))}>
            <option value="">Escolher…</option>
            {HIBON_ELEMENTOS.map((id) => (
              <option key={id} value={id}>
                {PODER_BY_ID[id]?.name ?? id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        {efeitos.length ? (
          <>
            <strong className="text-text">Na mesa:</strong> {efeitos.join(" · ")}.{" "}
          </>
        ) : (
          "Escolha duas bonificações diferentes, ou o Dano Adicional duas vezes. "
        )}
        {el
          ? `Exclusivos do ${(PODER_BY_ID[el]?.name ?? el).split(" (")[0]}: ${exclusivosDe(el)
              .map((id) => EFEITO_BY_ID[id]?.name ?? id)
              .join(", ")}. O Hibon continua sendo um elemento próprio: não conta para aptidões do ${(PODER_BY_ID[el]?.name ?? el).split(" (")[0]}.`
          : "Sem elemento escolhido, o seletor mostra os exclusivos de todos os elementos."}
      </p>
    </div>
  );
}

/** Etiqueta de evolução: na repetição ("evolui o 2º") e no efeito que ainda vai evoluir ("evolui no 5º"). */
function EvoTag({ r, need }: { r: ReturnType<typeof effectRows>[number]; need: number | null }) {
  if (r.k > 0)
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok/20 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-3" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {r.from >= 0 ? `evolui o ${r.from + 1}º` : r.outra ? "evolui o de outra tabela" : `já entra no Nv ${need ?? "?"}`}
      </span>
    );
  if (r.next >= 0) return <span className="shrink-0 text-[11px] whitespace-nowrap text-faint">evolui no {r.next + 1}º</span>;
  return null;
}

/**
 * Poder de efeitos (tudo menos a Versatilidade): uma linha por nível, no mesmo formato da matriz da Versatilidade.
 * A evolução aparece na própria linha, ligada à escolha que ela evolui, e "Na ficha" resume cada efeito no nível final.
 */
function EffectsEditor({ c, idx, p, effects, name, top, pular, showDesc, setShowDesc, edit }: { c: Character; idx: number; p: PowerEntry; effects: string[]; name: string; top: number; pular: boolean; showDesc: boolean; setShowDesc: (v: boolean) => void; edit: (fn: (x: PowerEntry) => void) => void }) {
  const rows = effectRows(c, idx, p, pular);
  const totals = effectTotals(rows);
  const evolutions = rows.filter((r) => r.k > 0).length;
  const kanji = KANJI_PODER[p.id];
  const cols = "grid-cols-[2rem_minmax(0,1fr)] sm:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,14rem)]";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="hidden flex-1 text-xs leading-relaxed text-muted sm:block">Cada nível é uma escolha: um efeito novo ou a evolução de um que você já tem.</p>
        <button type="button" aria-pressed={showDesc} onClick={() => setShowDesc(!showDesc)} className={`chip ml-auto min-h-9 text-xs ${showDesc ? "border-chakra text-[#ffd3a8]" : "text-muted hover:border-muted"}`}>
          {showDesc ? "Esconder descrições" : "Mostrar descrições"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className={`grid items-center gap-x-2 bg-ink-2 px-2.5 py-2 ${cols}`}>
          <span className="text-[11px] font-bold tracking-[0.14em] text-faint">NV</span>
          <span className="flex min-w-0 items-center gap-2">
            {kanji && (
              <span className="font-display text-lg font-extrabold" style={{ color: corPoder(p.id) }} aria-hidden="true">
                {kanji}
              </span>
            )}
            <span className="truncate text-sm font-bold text-text">{name.split(" (")[0]}</span>
            {totals.length > 0 && (
              <span className="shrink-0 text-xs text-faint">
                {totals.length} efeito(s) · {evolutions} evolução(ões)
              </span>
            )}
          </span>
          <span className="hidden text-[11px] font-bold tracking-[0.14em] text-faint sm:block">NOME DA TÉCNICA</span>
        </div>
        <ol className="flex flex-col divide-y divide-line border-t border-line">
          {rows.map((r, i) => {
            const chosen = r.id;
            // Efeitos novos: os que não foram escolhidos ANTES desta escolha (a 1ª vez de um efeito é sempre o efeito novo).
            const earlier = p.effects.slice(0, i).filter((x): x is string => !!x);
            // Evolução que o efeito teria nesta escolha, contando as outras tabelas do mesmo poder (o poder comprado de
            // novo ou ele como versátil). Pulando evoluções, vai à mais alta que esta escolha permite.
            const evoAt = (id: string) => evolucaoSe(c, idx, i, id);
            // Efeitos de outra tabela do mesmo poder que esta escolha consegue evoluir.
            const daOutra = effects.filter((id) => !earlier.includes(id) && evolucaoNasOutras(c, idx, id) >= 0 && evoAt(id) > evolucaoNasOutras(c, idx, id));
            const fresh = effects
              .map((id) => EFEITO_BY_ID[id])
              .filter((e) => e && !earlier.includes(e.id) && !daOutra.includes(e.id) && liberado(c, e))
              .sort((a, b) => a.level - b.level);
            // Evoluções: efeitos escolhidos antes (ou em outra tabela) que ainda têm evolução.
            const evos = [...new Set([...earlier, ...daOutra])]
              .map((id) => ({ e: EFEITO_BY_ID[id], need: evolutionLevel(id, evoAt(id)), outra: !earlier.includes(id) }))
              .filter((o): o is { e: NonNullable<typeof o.e>; need: number; outra: boolean } => !!o.e && o.need !== null);
            const need = chosen && r.k ? r.lvl : null;
            const stale = !!chosen && !fresh.some((e) => e.id === chosen) && !evos.some((o) => o.e.id === chosen);
            const ef = chosen ? EFEITO_BY_ID[chosen] : undefined;
            const tag = chosen ? <EvoTag r={r} need={need} /> : null;
            const hasTag = !!chosen && (r.k > 0 || r.next >= 0);
            return (
              <li key={i} className={`grid items-center gap-x-2 gap-y-1.5 px-2.5 py-2 ${cols}`}>
                <span className="text-sm font-bold text-chakra">{i + 1}º</span>
                <EffectPicker
                  compact
                  label={`${i + 1}º efeito`}
                  context={`${name.split(" (")[0]} nível ${top}`}
                  value={chosen ?? null}
                  {...effectChoices(p.id, top, fresh, evos, stale ? chosen : null, (id) => firstEvolution(id, i + 1, pular))}
                  onChange={(v) => edit((x) => void (x.effects[i] = v))}
                  badge={hasTag ? <span className="hidden sm:contents">{tag}</span> : undefined}
                />
                {hasTag && <span className="col-start-2 flex sm:hidden">{tag}</span>}
                <input
                  aria-label={`Nome da técnica do ${i + 1}º efeito`}
                  className="field col-start-2 py-1.5 text-sm sm:col-start-auto"
                  placeholder="Nome da técnica (opcional)"
                  value={p.techniques[i] ?? ""}
                  onChange={(e) => edit((x) => void (x.techniques[i] = e.target.value))}
                />
                {showDesc && ef && (
                  <span className="col-start-2 text-xs leading-relaxed text-faint sm:col-end-4">
                    {r.k > 0 ? (
                      r.from >= 0 ? (
                        `O ${ef.name} escolhido no ${r.from + 1}º passa para o Nv ${need ?? "?"}.`
                      ) : r.outra ? (
                        `Evolui o ${ef.name} de outra tabela de ${name.split(" (")[0]} para o Nv ${need ?? "?"}.`
                      ) : (
                        `Pular evoluções: já entra como ${ef.name} Nv ${need ?? "?"}, com as evoluções anteriores.`
                      )
                    ) : (
                      <>
                        {ef.desc}
                        {ef.evolves && <span className="text-muted"> Evolui no Nv {ef.evolves.join(" e ")}.</span>}
                      </>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {totals.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-xl bg-ink-2 p-3">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="label">Na ficha</span>
            <span className="text-xs text-faint">cada efeito no nível mais alto que alcançou</span>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {totals.map((t) => (
              <li key={t.id} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line-2 py-0.5 pr-2.5 pl-1 text-[13px] font-bold">
                <span className={`rounded-full px-1.5 py-px text-[11px] ${PILL_FICHA[t.tone]}`}>Nv {t.lvl ?? "?"}</span>
                {EFEITO_BY_ID[t.id]?.name ?? t.id}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-seal" aria-hidden="true" />
              exclusivo do elemento
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-ok" aria-hidden="true" />
              evoluído
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-line-2" aria-hidden="true" />
              geral
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Versatilidade (Livro Básico, pág. 242–243): dois poderes versáteis (três na 4ª compra, regra da casa). O nível 1 dá o
 * efeito de nível 1 a todos; do 2º em diante, cada nível é de um deles, com no máximo 2 níveis seguidos no mesmo, e o
 * efeito tem nível igual ou menor. No computador vira uma matriz (níveis × poderes versáteis); no celular, cada nível
 * escolhe o poder num seletor de kanjis.
 */
function VersatileEditor({ c, idx, p, slots, taken, lista, pular, edit }: { c: Character; idx: number; p: PowerEntry; slots: number; taken: string[]; lista: boolean; pular: boolean; edit: (fn: (x: PowerEntry) => void) => void }) {
  const ks = Array.from({ length: slots }, (_, k) => k);
  const vv = ks.map((k) => p.versatile?.[k] ?? "");
  const cols = ks.filter((k) => vv[k]);
  const fourth = slots === 3;
  const o = owners(p);
  const broken = brokenLevels(o);
  const setV = (k: number, id: string) =>
    edit((x) => {
      const cur = ks.map((j) => x.versatile?.[j] ?? "");
      if (cur[k] === id) return;
      cur[k] = id;
      x.versatile = cur;
      // Trocar o poder apaga os efeitos escolhidos para ele.
      x.owner?.forEach((o, i) => o === k && (x.effects[i] = null));
    });
  // Cada nível do 2º em diante: o poder versátil e o efeito, escolhidos juntos ("k|efeito").
  const setLevel = (i: number, v: string | null) =>
    edit((x) => {
      const o = Array.from({ length: Math.max(x.level, i + 1) }, (_, j) => x.owner?.[j] ?? null);
      const cut = v ? v.indexOf("|") : -1;
      o[i] = v ? Number(v.slice(0, cut)) : null;
      x.owner = o;
      x.effects[i] = v ? v.slice(cut + 1) : null;
    });
  // Só o poder versátil do nível; o efeito é escolhido depois, na coluna dele.
  const setOwner = (i: number, k: number) =>
    edit((x) => {
      const o = Array.from({ length: Math.max(x.level, i + 1) }, (_, j) => x.owner?.[j] ?? null);
      if (o[i] === k) return;
      o[i] = k;
      x.owner = o;
      x.effects[i] = null;
    });
  const firstOf = (id: string) => (PODER_BY_ID[id]?.mode === "tecnicas" ? PODER_BY_ID[id].techniques?.[0]?.name : "Canhão");
  const colChoices = (i: number, k: number) => {
    const all = versatileChoices(p, vv, i, lista, pular, (e) => liberado(c, e), (k2, eff) => ({ ev: evolucaoSe(c, idx, i, eff, k2), outra: evolucaoNasOutras(c, idx, eff, k2) }));
    const options = all.options.filter((x) => x.value.startsWith(`${k}|`));
    const tabs: PickTab[] = [
      { key: "excl", label: "Exclusivos", kanji: kanjiOf(vv[k]), match: (x: PickOption) => x.tone === "excl" },
      { key: "evo", label: "Evoluir", match: (x: PickOption) => x.tone === "evo" },
      { key: "geral", label: "Gerais", match: (x: PickOption) => x.tone === "geral" },
    ].filter((t) => options.some(t.match));
    return { options, groups: all.groups.filter((g) => g.key === "fora" || g.key === `v${k}`), tabs };
  };
  const picker = (i: number, k: number) => {
    const has = !!p.effects[i];
    return (
      <EffectPicker
        compact
        label={`${i + 1}º nível · ${shortName(vv[k])}`}
        context={`${versatileName(vv[k])} · nível ${i + 1}`}
        placeholder={`Efeito de ${shortName(vv[k])}…`}
        value={has ? `${k}|${p.effects[i]}` : null}
        {...colChoices(i, k)}
        onChange={(v) => setLevel(i, v)}
      />
    );
  };
  const techInput = (i: number, cls: string) => (
    <input aria-label={`Nome da técnica do ${i + 1}º nível`} className={`field py-1.5 text-sm ${cls}`} placeholder="Nome da técnica (opcional)" value={p.techniques[i] ?? ""} onChange={(e) => edit((x) => void (x.techniques[i] = e.target.value))} />
  );
  const grid = { gridTemplateColumns: `2.25rem repeat(${Math.max(1, cols.length)}, minmax(0, 1fr)) minmax(8rem, 13rem)` };

  return (
    <div className="@container flex flex-col gap-3">
      {fourth && (
        <p className="rounded-xl bg-chakra/10 px-3 py-2 text-xs leading-relaxed text-text">
          <strong>Regra da casa:</strong> a 4ª Versatilidade traz 3 poderes versáteis e pode repetir os de outras compras.
        </p>
      )}
      <div className={`grid gap-2 ${fourth ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {ks.map((k) => (
          <label key={k} className="flex flex-col gap-1">
            <span className="label">{k + 1}º poder versátil</span>
            <select className="field py-2" value={vv[k]} onChange={(e) => setV(k, e.target.value)}>
              <option value="">Escolher…</option>
              {VERSATEIS.map((id) => (
                <option key={id} value={id} disabled={vv.some((x, j) => j !== k && x === id)}>
                  {versatileName(id)}
                  {taken.includes(id) ? (fourth ? " (também em outra compra)" : " (já é versátil em outra compra)") : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {cols.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 p-4 text-center text-sm text-muted">Escolha os poderes versáteis acima para montar os níveis.</p>
      ) : (
        <>
          {/* Editor largo: matriz níveis × poderes versáteis */}
          <div className="hidden overflow-hidden rounded-xl border border-line @2xl:block">
            <div className="grid items-center gap-2 bg-ink-2 px-3 py-2" style={grid}>
              <span className="text-[11px] font-bold tracking-[0.14em] text-faint">NV</span>
              {cols.map((k) => (
                <span key={k} className="flex min-w-0 items-center gap-2">
                  <span className="font-display text-lg font-extrabold" style={{ color: corPoder(vv[k]) }} aria-hidden="true">
                    {kanjiOf(vv[k])}
                  </span>
                  <span className="truncate text-sm font-bold text-text">{shortName(vv[k])}</span>
                  <span className="shrink-0 text-xs text-faint">{o.filter((x) => x === -1 || x === k).length} níveis</span>
                </span>
              ))}
              <span className="text-[11px] font-bold tracking-[0.14em] text-faint">NOME DA TÉCNICA</span>
            </div>
            {o.map((own, i) => (
              <div key={i} className="grid items-center gap-2 border-t border-line px-3 py-1.5" style={grid}>
                <span className={`text-sm font-bold ${broken.has(i) ? "text-bad" : "text-chakra"}`}>{i + 1}º</span>
                {cols.map((k) =>
                  i === 0 ? (
                    <span key={k} className="flex h-9 min-w-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-text" style={{ background: tintPoder(vv[k]) }}>
                      <span style={{ color: corPoder(vv[k]) }}>{kanjiOf(vv[k])}</span>
                      <span className="truncate">{firstOf(vv[k])}</span>
                    </span>
                  ) : own === k ? (
                    <div key={k} className="min-w-0">
                      {picker(i, k)}
                    </div>
                  ) : (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setOwner(i, k)}
                      aria-label={`Usar o ${i + 1}º nível em ${shortName(vv[k])}`}
                      className="h-9 rounded-lg border border-dashed border-line-2 text-faint transition hover:border-muted hover:text-text"
                    >
                      +
                    </button>
                  ),
                )}
                {techInput(i, "")}
              </div>
            ))}
          </div>

          {/* Editor estreito (celular, notebook): cada nível escolhe o poder num seletor de kanjis e o efeito logo ao lado */}
          <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line @2xl:hidden">
            {o.map((own, i) => (
              <li key={i} className="flex flex-col gap-1.5 px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className={`w-7 shrink-0 text-sm font-bold ${broken.has(i) ? "text-bad" : "text-chakra"}`}>{i + 1}º</span>
                  {i === 0 ? (
                    <span className="min-w-0 flex-1 truncate text-sm text-text">{cols.map((k) => `${firstOf(vv[k])} (${shortName(vv[k])})`).join(" · ")}</span>
                  ) : (
                    <>
                      <div role="group" aria-label={`Poder versátil do ${i + 1}º nível`} className="flex shrink-0 gap-0.5 rounded-lg border border-line-2 bg-ink-2 p-0.5">
                        {cols.map((k) => {
                          const on = own === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={on}
                              aria-label={shortName(vv[k])}
                              onClick={() => setOwner(i, k)}
                              className="grid size-10 place-items-center rounded-md font-display text-base font-extrabold transition"
                              style={on ? { background: tintPoder(vv[k], 28), color: corPoder(vv[k]) } : { color: "var(--color-line-2)" }}
                            >
                              {kanjiOf(vv[k])}
                            </button>
                          );
                        })}
                      </div>
                      <div className="min-w-0 flex-1">{own !== null && own >= 0 && vv[own] ? picker(i, own) : <span className="text-xs text-muted">Escolha o poder deste nível</span>}</div>
                    </>
                  )}
                </div>
                {techInput(i, "ml-9 w-auto")}
              </li>
            ))}
          </ol>

          <div className="flex items-center gap-3">
            <span className="hidden shrink-0 text-xs font-bold text-muted sm:block">Ordem dos níveis</span>
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {o.map((k, i) => (
                <SeqCell key={i} p={p} k={k} broken={broken.has(i)} />
              ))}
            </div>
            <span className={`shrink-0 text-xs ${broken.size ? "font-bold text-bad" : "text-ok"}`}>{broken.size ? "3 seguidos no mesmo poder" : "máx. 2 seguidos · ok"}</span>
          </div>
          <p className="text-xs leading-relaxed text-faint">Cada poder versátil usa as regras do próprio poder (alcance, tamanho e bônus do elemento) com o nível da Versatilidade. O efeito precisa ser do nível escolhido ou menor.</p>
        </>
      )}
    </div>
  );
}

/* ---------------- catálogo (gaveta) ---------------- */

function PowerCatalog({ c, blocked, onAdd, onAddCustom }: { c: Character; blocked: (p: Poder) => boolean; onAdd: (p: Poder) => void; onAddCustom: (name: string) => void }) {
  const [custom, setCustom] = useState("");
  const [showOthers, setShowOthers] = useState(false);
  const [pq, setPq] = useState("");
  const [pf, setPf] = useState<PowerFilter>("todos");
  const available = PODERES.filter((p) => showOthers || !blocked(p) || c.poderes.some((x) => x.id === p.id));
  // Busca no nome, na descrição e nos efeitos/técnicas do poder (ex.: "Meteoros" acha Katon e Raiton).
  const searched = available.map((p) => ({ p, hit: searchHit(p, pq) })).filter((x): x is { p: Poder; hit: string } => x.hit !== null);
  const shown = searched.filter((x) => POWER_FILTERS.find((f) => f.key === pf)!.match(x.p));
  const owned = new Set(c.poderes.map((p) => p.id));

  return (
    <section className="flex flex-col gap-3">
      <label className="flex h-12 items-center gap-3 rounded-xl border border-line-2 bg-ink-2 pr-1.5 pl-4 focus-within:border-chakra">
        <IconSearch className="size-5 shrink-0 text-muted" />
        <span className="sr-only">Buscar poder</span>
        <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Buscar poder, elemento ou efeito (ex.: Meteoros, cura)" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint" />
        {pq && (
          <button type="button" onClick={() => setPq("")} aria-label="Limpar busca de poder" className="grid size-9 place-items-center rounded-lg bg-panel-2">
            <IconX className="size-4" />
          </button>
        )}
      </label>
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        {POWER_FILTERS.map((f) => {
          const on = pf === f.key;
          return (
            <button key={f.key} type="button" aria-pressed={on} onClick={() => setPf(f.key)} className={`chip shrink-0 font-bold ${on ? "border-paper bg-paper text-paper-ink" : "text-text hover:border-muted"}`}>
              {f.label}
              <span className={`text-[11px] ${on ? "text-paper-muted" : "text-muted"}`}>{searched.filter((x) => f.match(x.p)).length}</span>
            </button>
          );
        })}
      </div>
      <Toggle checked={showOthers} onChange={setShowOthers} label="Mostrar restritos de outros clãs" />
      <span className="text-sm text-muted">
        {shown.length} de {available.length} poderes
      </span>
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map(({ p, hit }) => {
          const has = owned.has(p.id);
          const again = has && p.mode === "efeitos";
          const met = reqsMet(c, p.req);
          return (
            <li key={p.id}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={has && !again}
                onClick={() => onAdd(p)}
                className={`flex h-full w-full items-start gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${p.restricted ? "border-seal/50 bg-seal/10" : "border-line bg-ink-2 hover:border-line-2"}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${has ? "bg-ok/20 text-ok" : "bg-seal text-white"}`}>{has && !again ? <IconCheck className="size-4" /> : <IconPlus className="size-4" />}</span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-1.5 font-bold text-paper">
                    {p.name} {p.restricted && <Badge tone="seal">restrito</Badge>}
                    <Badge>{p.element ? "elemento" : MODE_LABEL[p.mode]}</Badge>
                  </span>
                  <span className="line-clamp-2 text-xs leading-snug text-muted" title={p.desc}>
                    {p.desc}
                  </span>
                  {hit && <span className="text-xs font-bold text-chakra">Tem: {hit}</span>}
                  {again && p.id === "versatilidade" ? (
                    <span className="text-xs font-bold text-ok">
                      Cada tabela extra pede uma Aprendizagem Rápida: {c.poderes.filter((x) => x.id === "versatilidade").length} de {1 + c.aptidoes.filter((x) => x.id === "aprendizagem-rapida").length} tabela(s) liberada(s).
                    </span>
                  ) : (
                    again && <span className="text-xs font-bold text-ok">Você já tem. Comprar de novo: nível 1 grátis, mais efeitos.</span>
                  )}
                  {p.reqText && <span className={`text-xs ${met ? "text-ok" : "text-bad"}`}>{met ? "✓" : "✗"} {p.reqText}</span>}
                  {blocked(p) && <span className="text-xs text-bad">{p.restricted ? `Restrito a: ${ownersText("poderes", p.id)}.` : "Samurais não compram poderes comuns."} Pode pegar, mas fica como observação.</span>}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line-2 p-6 text-center text-sm text-muted">
          {pq ? `Nenhum poder com “${pq}”.` : "Nenhum poder neste filtro."} Se for de outro livro, crie como poder personalizado abaixo.
        </p>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!custom.trim()) return;
          onAddCustom(custom.trim());
          setCustom("");
        }}
      >
        <input className="field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Poder personalizado ou de outro livro" aria-label="Nome do poder personalizado" />
        <button type="submit" className="btn-ghost shrink-0" disabled={!custom.trim()}>
          <IconPlus className="size-4" /> Adicionar
        </button>
      </form>
      {c.originId === "samurai" && <p className="text-sm text-muted">Pela regra, Samurais não compram poderes comuns (ficam como observação).</p>}
    </section>
  );
}

/* ---------------- busca no catálogo ---------------- */

type PowerFilter = "todos" | "elemento" | "efeitos" | "tecnicas" | "livre" | "restritos";
const POWER_FILTERS: { key: PowerFilter; label: string; match: (p: Poder) => boolean }[] = [
  { key: "todos", label: "Todos", match: () => true },
  { key: "elemento", label: "Elementos", match: (p) => !!p.element },
  { key: "efeitos", label: "Efeitos", match: (p) => p.mode === "efeitos" && !p.element },
  { key: "tecnicas", label: "Técnicas", match: (p) => p.mode === "tecnicas" },
  { key: "livre", label: "Livres", match: (p) => p.mode === "livre" },
  { key: "restritos", label: "Restritos", match: (p) => !!p.restricted },
];
const MODE_LABEL: Record<Poder["mode"], string> = { efeitos: "efeitos", tecnicas: "técnicas", livre: "livre" };

/** null = não combina; "" = combina pelo nome ou descrição; senão, os efeitos/técnicas que combinam. */
function searchHit(p: Poder, q: string): string | null {
  const t = norm(q.trim());
  if (!t || norm(`${p.name} ${p.desc} ${p.reqText ?? ""}`).includes(t)) return "";
  const names = [...(p.effects ?? []).map((id) => EFEITO_BY_ID[id]?.name ?? ""), ...(p.techniques ?? []).map((x) => x.name)];
  const hits = names.filter((n) => n && norm(n).includes(t));
  return hits.length ? hits.slice(0, 3).join(", ") + (hits.length > 3 ? "…" : "") : null;
}

/* ---------------- opções do seletor de efeito ---------------- */

/** Efeito novo no seletor. Pulando evoluções, ele já entra na evolução `ev` (ex.: Lâmina de Raios Nv 9). */
function freshLabel(e: Efeito, ev: number) {
  const need = ev ? evolutionLevel(e.id, ev) : null;
  if (!need) return { name: e.name, level: e.level, desc: e.desc };
  return { name: `${e.name} Nv ${need}`, level: e.level, desc: `Pular evoluções: já entra como ${e.name} Nv ${need}, com as evoluções anteriores. ${e.desc}` };
}

/** Seletor de um poder de efeitos: exclusivos do elemento, evoluções, gerais e o que passa do nível do poder. */
function effectChoices(powerId: string, top: number, fresh: Efeito[], evos: { e: Efeito; need: number; outra?: boolean }[], stale: string | null, firstEv: (id: string) => number = () => 0) {
  const short = shortName(powerId);
  const kanji = KANJI_PODER[powerId];
  const excl = (id: string) => EXCLUSIVOS.includes(id);
  const options: PickOption[] = [
    ...(stale ? [{ value: stale, name: EFEITO_BY_ID[stale]?.name ?? stale, level: EFEITO_BY_ID[stale]?.level ?? 0, desc: "Não cabe mais nesta escolha.", tone: "acima" as const, group: "fora" }] : []),
    ...[...fresh]
      .sort((a, b) => Number(excl(b.id)) - Number(excl(a.id)) || a.level - b.level)
      .map((e): PickOption => {
        const g = e.level > top ? "acima" : excl(e.id) ? "excl" : "geral";
        return { value: e.id, ...freshLabel(e, firstEv(e.id)), source: e.source, tone: g, group: g };
      }),
    ...evos.map((o): PickOption => {
      const g = o.need > top ? "acima" : "evo";
      const desc = o.outra ? `Você já tem ${o.e.name} em outra tabela de ${short}. Escolher aqui evolui para o Nv ${o.need}.` : `Você já tem ${o.e.name}. Escolher de novo evolui para o Nv ${o.need}.`;
      return { value: o.e.id, name: `${o.e.name} → evolução`, label: o.e.name, level: o.need, desc, source: o.e.source, tone: g, group: g };
    }),
  ];
  const groups: PickGroup[] = [
    { key: "fora", label: "Fora da regra", tone: "acima" },
    { key: "excl", label: `Do ${short}`, hint: "exclusivos", kanji, tone: "excl" },
    { key: "evo", label: "Evoluir efeito", hint: "o que você já tem", tone: "evo" },
    { key: "geral", label: "Efeitos gerais", hint: PODER_BY_ID[powerId]?.element ? "comuns a Ninpou e elementos" : undefined },
    { key: "acima", label: `Acima do nível ${top}`, hint: "pode escolher, mas vira observação", tone: "acima" },
  ];
  const all: PickTab[] = [
    { key: "excl", label: short, kanji, match: (o) => o.group === "excl" || (o.group === "acima" && excl(o.value)) },
    { key: "evo", label: "Evoluir", match: (o) => o.tone === "evo" },
    { key: "geral", label: "Gerais", match: (o) => o.group === "geral" },
  ];
  return { options, groups, tabs: all.filter((t) => options.some(t.match)) };
}

/** Efeitos de Doton do Kekkei Touta e do Daikiga só aparecem para quem tem as aptidões restritas deles. */
const liberado = (c: Character, e: Efeito) => (!EFEITOS_KEKKEI_TOUTA.includes(e.id) || reqsMet(c, e.req)) && reqsMet(c, e.libera);

/**
 * Seletor de um nível da Versatilidade: um grupo por poder versátil (exclusivos, evoluções e gerais de cada um).
 * O valor é "k|efeito" (k = índice do poder versátil).
 */
/**
 * `cruz`: evolução que o efeito teria neste nível contando as outras tabelas do mesmo poder, e a mais alta que ele já tem
 * nelas (−1 se não está em nenhuma).
 */
function versatileChoices(
  p: PowerEntry,
  vv: string[],
  i: number,
  lista: boolean,
  pular: boolean,
  ok: (e: Efeito) => boolean = () => true,
  cruz?: (k: number, eff: string) => { ev: number; outra: number },
) {
  const lvl = i + 1;
  const options: PickOption[] = [];
  const groups: PickGroup[] = [{ key: "fora", label: "Fora da regra", tone: "acima" }];
  const tabs: PickTab[] = [];
  vv.forEach((id, k) => {
    if (!id) return;
    const def = PODER_BY_ID[id];
    const kanji = KANJI_PODER[id];
    const group = `v${k}`;
    // O 3º nível seguido no mesmo poder não é permitido.
    const blocked = i - 2 >= 1 && p.owner?.[i - 1] === k && p.owner?.[i - 2] === k;
    groups.push({ key: group, label: versatileName(id), hint: blocked ? "3º nível seguido: escolha outro poder" : undefined, kanji, tone: "excl" });
    tabs.push({ key: group, label: shortName(id), kanji, match: (o) => o.group === group });
    const all = versatilePicks(p, k, pular);
    const picks = all.filter((x) => x.level !== lvl);
    const add = (eff: string, o: Omit<PickOption, "value" | "group" | "kanji" | "disabled">) => options.push({ ...o, value: `${k}|${eff}`, group, kanji, disabled: blocked });

    if (def?.mode === "tecnicas" && lista) {
      // Regra opcional da lista: o nível traz a técnica dele e as anteriores que faltaram.
      const prev = picks.filter((x) => x.level < lvl && x.eff).reduce((m, x) => Math.max(m, x.level), 0);
      const ts = def.techniques ?? [];
      const n = ts.reduce((best, t, j) => (t.level <= lvl && t.level > prev && (best < 0 || t.level >= ts[best].level) ? j : best), -1);
      if (n < 0) return;
      const junto = ts.filter((t, j) => j !== n && t.level > prev && t.level <= lvl).map((t) => t.name);
      add(tecId(n), { name: ts[n].name, level: ts[n].level, desc: junto.length ? `Lista (regra opcional): também traz ${junto.join(", ")}.` : undefined, tone: "tec" });
      return;
    }
    if (def?.mode === "tecnicas") {
      const used = picks.map((x) => x.eff);
      (def.techniques ?? []).forEach((t, n) => t.level <= lvl && !used.includes(tecId(n)) && add(tecId(n), { name: t.name, level: t.level, tone: "tec" }));
      return;
    }
    const others = picks.map((x) => x.eff);
    const before = picks.filter((x) => x.level < lvl).map((x) => x.eff).filter((x): x is string => !!x);
    const excl = (e: string) => EXCLUSIVOS.includes(e);
    (def?.effects ?? NINPOU_BASE)
      .map((e) => EFEITO_BY_ID[e])
      .filter((e) => e && e.level <= lvl && !others.includes(e.id) && ok(e))
      .sort((a, b) => Number(excl(b.id)) - Number(excl(a.id)) || a.level - b.level)
      .forEach((e) => {
        // Já está em outra tabela do mesmo poder: escolher aqui é evolução dele, quando ela cabe.
        const cz = cruz?.(k, e.id);
        const need = cz && cz.outra >= 0 && cz.ev > cz.outra ? evolutionLevel(e.id, cz.ev) : null;
        if (need !== null && need <= lvl)
          add(e.id, { name: `${e.name} → evolução`, level: need, desc: `Você já tem ${e.name} em outra tabela de ${shortName(id)}. Escolher aqui evolui para o Nv ${need}.`, source: e.source, tone: "evo" });
        else add(e.id, { ...freshLabel(e, firstEvolution(e.id, lvl, pular)), source: e.source, tone: excl(e.id) ? "excl" : "geral" });
      });
    [...new Set(before)].forEach((e) => {
      const prevEv = all.filter((x) => x.level < lvl && x.eff === e).reduce((m, x) => Math.max(m, x.ev), 0);
      const need = evolutionLevel(e, cruz ? cruz(k, e).ev : nextEvolution(e, prevEv, lvl, pular));
      const ef = EFEITO_BY_ID[e];
      if (ef && need !== null && need <= lvl) add(e, { name: `${ef.name} → evolução`, level: need, desc: `Você já tem ${ef.name}. Escolher de novo evolui para o Nv ${need}.`, source: ef.source, tone: "evo" });
    });
  });
  // Escolha que não cabe mais (poder trocado, nível abaixo do efeito…): continua visível para ser trocada.
  const k = p.owner?.[i];
  const eff = p.effects[i];
  if (typeof k === "number" && vv[k] && eff && !options.some((o) => o.value === `${k}|${eff}`)) {
    const t = PODER_BY_ID[vv[k]]?.techniques?.[tecIndex(eff)];
    options.unshift({ value: `${k}|${eff}`, name: t?.name ?? EFEITO_BY_ID[eff]?.name ?? eff, level: t?.level ?? EFEITO_BY_ID[eff]?.level ?? 0, desc: `${versatileName(vv[k])} · não cabe mais neste nível.`, tone: "acima", group: "fora" });
  }
  tabs.push({ key: "evo", label: "Evoluir", match: (o) => o.tone === "evo" });
  return { options, groups, tabs: tabs.filter((t) => options.some(t.match)) };
}
