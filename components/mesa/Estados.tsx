"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  COND_BY,
  GATES,
  MOD_TARGETS,
  applyGate,
  makeCustom,
  makeHachimon,
  makeJuuinkaIchi,
  makeJuuinkaNi,
  modLabel,
  toggleEffect,
} from "@/lib/play";
import { powerLevel } from "@/lib/rules";
import type { ModTarget, PlayEffect } from "@/lib/types";
import { IconPlus, IconX } from "../ui";
import { NumInput, SectionTitle, type MesaProps } from "./shared";

const PRESETS = [
  { label: "Juuinka · Ichi", make: () => makeJuuinkaIchi() },
  { label: "Juuinka · Ni", make: () => makeJuuinkaNi() },
  { label: "Hachimon Tonkou", make: (lvl: number) => makeHachimon(lvl) },
  { label: "Estado personalizado", make: () => makeCustom() },
];

export function Estados(props: MesaProps) {
  const { c, p, commit } = props;
  const hachiLevel = Math.max(1, powerLevel(c, "hachimon"));
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const toggleEdit = (id: string) =>
    setEditing((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const add = (i: number) => {
    const e = PRESETS[i].make(hachiLevel);
    commit((pl, log) => {
      pl.effects.push(e);
      log(`${e.name} adicionado`, "n");
    });
    if (i === PRESETS.length - 1) setEditing((s) => new Set(s).add(e.id));
  };

  return (
    <section aria-labelledby="h-estados" className="card flex flex-col gap-4 p-4 sm:p-5">
      <SectionTitle id="h-estados" title="Estados e transformações">
        Ligue para somar os bônus à ficha em tempo real. Toque num bônus para escolher se ele vale; em “Editar” tudo pode ser mudado.
      </SectionTitle>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((pr, i) => (
          <button key={pr.label} type="button" className="chip text-text hover:border-muted" onClick={() => add(i)}>
            <IconPlus className="size-4" /> {pr.label}
          </button>
        ))}
      </div>

      {p.effects.length === 0 ? (
        <p className="rounded-xl bg-ink-2 px-4 py-6 text-center text-sm text-muted">
          Nenhum estado ainda. Adicione um selo, portão, modo ou bônus temporário acima.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {p.effects.map((e) => (
              <motion.li key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                <EffectCard {...props} e={e} edit={editing.has(e.id)} onToggleEdit={() => toggleEdit(e.id)} hachiLevel={hachiLevel} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function costLine(e: PlayEffect) {
  const parts: string[] = [];
  if (e.costVit) parts.push(`${e.costVit} Vit ao ativar`);
  if (e.costChk) parts.push(`${e.costChk} Chakra ao ativar`);
  if (e.perVit) parts.push(`−${e.perVit} Vit por turno`);
  if (e.perChk) parts.push(`−${e.perChk} Chakra por turno`);
  if (e.gainChk) parts.push(`+${e.gainChk} Chakra 1×/cena${e.usedScene ? " (usado)" : ""}`);
  parts.push(e.turns ? `dura ${e.turns} turnos` : "contínuo");
  if (e.after) {
    const extra = e.afterNote || (e.afterTurns ? `${e.afterTurns} turnos` : "");
    parts.push(`ao desativar: ${COND_BY[e.after]?.n ?? e.after}${extra ? ` (${extra})` : ""}`);
  }
  return parts.join(" · ");
}

function EffectCard({
  e,
  edit,
  onToggleEdit,
  hachiLevel,
  commit,
  patch,
}: MesaProps & { e: PlayEffect; edit: boolean; onToggleEdit: () => void; hachiLevel: number }) {
  const [newT, setNewT] = useState<ModTarget>("FOR");
  const [newV, setNewV] = useState(1);

  /** Mudanças de jogo no estado (entram no desfazer). */
  const change = (fn: (x: PlayEffect) => void) =>
    commit((pl) => {
      const x = pl.effects.find((y) => y.id === e.id);
      if (x) fn(x);
    });
  /** Campos de configuração (sem histórico). */
  const field = (fn: (x: PlayEffect) => void) =>
    patch((pl) => {
      const x = pl.effects.find((y) => y.id === e.id);
      if (x) fn(x);
    });

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${e.active ? "border-chakra bg-[#2a1c10]" : "border-line bg-ink-2"}`}>
      <div className="flex items-start gap-3 sm:items-center">
        <button
          type="button"
          role="switch"
          aria-checked={e.active}
          aria-label={`Ativar ${e.name}`}
          onClick={() => commit((pl, log) => toggleEffect(pl, e.id, log))}
          className={`relative mt-1 inline-flex h-8 w-14 shrink-0 rounded-full transition sm:mt-0 ${e.active ? "bg-chakra" : "bg-line-2"}`}
        >
          <motion.span layout className={`absolute top-1 size-6 rounded-full bg-white ${e.active ? "right-1" : "left-1"}`} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-display text-lg font-extrabold text-paper">{e.name || "Sem nome"}</span>
            <span className="text-xs text-muted">{e.src}</span>
          </div>
          <span className="text-[13px] leading-snug text-muted">{costLine(e)}</span>
        </div>
        {e.active && (
          <span className="hidden shrink-0 rounded-full bg-chakra px-2.5 py-1 text-xs font-bold text-paper-ink sm:inline">
            {e.turns ? `Ativo · ${e.left} turno(s)` : "Ativo"}
          </span>
        )}
        <button type="button" className="btn-ghost min-h-10 shrink-0 px-3 text-xs" aria-pressed={edit} onClick={onToggleEdit}>
          {edit ? "Pronto" : "Editar"}
        </button>
      </div>

      {e.gate !== undefined && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[13px] text-muted">Portão</span>
          {GATES.map((G) => {
            const sel = G.g === e.gate;
            return (
              <button
                key={G.g}
                type="button"
                aria-pressed={sel}
                aria-label={`Portão ${G.g}, ${G.n}`}
                title={G.n}
                onClick={() => change((x) => applyGate(x, G.g, Math.max(hachiLevel, G.g)))}
                className={`grid size-10 place-items-center rounded-lg border text-sm font-bold transition ${sel ? "border-chakra bg-chakra text-paper-ink" : G.g > hachiLevel ? "border-line-2 text-faint hover:border-muted" : "border-line-2 text-text hover:border-muted"}`}
              >
                {G.g}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {e.mods.map((m, i) => {
          const live = m.on && e.active;
          return (
            <div key={i} className="flex items-center gap-1">
              <button
                type="button"
                aria-pressed={m.on}
                onClick={() => change((x) => void (x.mods[i].on = !x.mods[i].on))}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition ${
                  live ? "border-chakra bg-chakra text-paper-ink" : m.on ? "border-chakra bg-[#3a2410] text-[#ffd3a8]" : "border-line-2 text-muted hover:border-muted"
                }`}
              >
                <span className={`size-2 rounded-full ${live ? "bg-paper-ink" : m.on ? "bg-chakra" : "bg-[#5a4c3c]"}`} />
                {modLabel(m)}
              </button>
              {edit && (
                <>
                  <button type="button" className="btn-ghost size-10 min-h-10 px-0" aria-label={`Diminuir ${modLabel(m)}`} onClick={() => change((x) => void (x.mods[i].v -= 1))}>
                    −
                  </button>
                  <button type="button" className="btn-ghost size-10 min-h-10 px-0" aria-label={`Aumentar ${modLabel(m)}`} onClick={() => change((x) => void (x.mods[i].v += 1))}>
                    +
                  </button>
                  <button type="button" className="btn-ghost size-10 min-h-10 px-0 text-bad" aria-label={`Remover ${modLabel(m)}`} onClick={() => change((x) => void x.mods.splice(i, 1))}>
                    <IconX className="size-4" />
                  </button>
                </>
              )}
            </div>
          );
        })}
        {e.mods.length === 0 && <span className="text-[13px] text-muted">Sem bônus ainda. Use “Editar” para adicionar.</span>}
      </div>

      {e.hint && <p className="text-[13px] leading-relaxed text-muted">{e.hint}</p>}

      {edit && (
        <div className="flex flex-col gap-3 border-t border-dashed border-line-2 pt-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor={`nm-${e.id}`} className="text-xs text-muted">
                Nome
              </label>
              <input id={`nm-${e.id}`} className="field py-2" value={e.name} onChange={(ev) => field((x) => void (x.name = ev.target.value))} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor={`src-${e.id}`} className="text-xs text-muted">
                Origem / observação
              </label>
              <input id={`src-${e.id}`} className="field py-2" value={e.src} onChange={(ev) => field((x) => void (x.src = ev.target.value))} />
            </div>
            <NumInput id={`cv-${e.id}`} label="Vit ao ativar" value={e.costVit} onChange={(n) => field((x) => void (x.costVit = n))} />
            <NumInput id={`cc-${e.id}`} label="Chakra ao ativar" value={e.costChk} onChange={(n) => field((x) => void (x.costChk = n))} />
            <NumInput id={`pv-${e.id}`} label="Vit por turno" value={e.perVit} onChange={(n) => field((x) => void (x.perVit = n))} />
            <NumInput id={`pc-${e.id}`} label="Chakra por turno" value={e.perChk} onChange={(n) => field((x) => void (x.perChk = n))} />
            <NumInput id={`gc-${e.id}`} label="Ganha chakra (1×/cena)" value={e.gainChk} onChange={(n) => field((x) => void (x.gainChk = n))} />
            <NumInput id={`tu-${e.id}`} label="Duração (0 = contínua)" value={e.turns} onChange={(n) => field((x) => void (x.turns = Math.max(0, n)))} />
            {e.active && e.turns > 0 && (
              <NumInput id={`lf-${e.id}`} label="Turnos restantes" value={e.left} onChange={(n) => field((x) => void (x.left = Math.max(0, n)))} />
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor={`af-${e.id}`} className="text-xs text-muted">
                Ao desativar
              </label>
              <select id={`af-${e.id}`} className="field py-2" value={e.after} onChange={(ev) => field((x) => void (x.after = ev.target.value))}>
                <option value="">Nada</option>
                {["fatigado", "exausto", "lento", "debilitado", "atordoado", "inconsciente"].map((k) => (
                  <option key={k} value={k}>
                    {COND_BY[k].n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`an-${e.id}`} className="text-xs text-muted">
                Nota da condição
              </label>
              <input id={`an-${e.id}`} className="field py-2" value={e.afterNote} onChange={(ev) => field((x) => void (x.afterNote = ev.target.value))} />
            </div>
            <NumInput id={`at-${e.id}`} label="Turnos da condição" value={e.afterTurns} onChange={(n) => field((x) => void (x.afterTurns = Math.max(0, n)))} />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-48 flex-1 flex-col gap-1 sm:flex-none">
              <label htmlFor={`nt-${e.id}`} className="text-xs text-muted">
                Novo bônus
              </label>
              <select id={`nt-${e.id}`} className="field py-2" value={newT} onChange={(ev) => setNewT(ev.target.value as ModTarget)}>
                {MOD_TARGETS.map((t) => (
                  <option key={t.k} value={t.k}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <NumInput id={`nv-${e.id}`} label="Valor" value={newV} onChange={setNewV} className="w-24" />
            <button
              type="button"
              className="btn-ghost"
              disabled={!newV}
              onClick={() => change((x) => void x.mods.push({ t: newT, v: newV, on: true }))}
            >
              <IconPlus className="size-4" /> Adicionar bônus
            </button>
            <span className="flex-1" />
            <button
              type="button"
              className="btn border border-bad/40 text-bad hover:border-bad"
              onClick={() =>
                commit((pl, log) => {
                  pl.effects = pl.effects.filter((y) => y.id !== e.id);
                  log(`${e.name} removido da ficha`, "n");
                })
              }
            >
              Remover estado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
