"use client";

import { useState } from "react";
import { COND_BY, CONDS, addCustomCond, hasCond, removeCond, sg, stackCond, toggleCond } from "@/lib/play";
import { SectionTitle, type MesaProps } from "./shared";

export function Condicoes({ p, v, commit, patch }: MesaProps) {
  const [name, setName] = useState("");
  const exausto = hasCond(p, "exausto");

  const addCustom = () => {
    const n = name.trim();
    if (!n) return;
    commit((pl, log) => addCustomCond(pl, n, log));
    setName("");
  };

  return (
    <section aria-labelledby="h-cond" className="card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle id="h-cond" title="Condições">
          Penalidades de precisão somam até o limite de −3 por teste. Exausto substitui Fatigado.
        </SectionTitle>
        <div className="flex gap-2">
          <span className={`rounded-lg bg-panel-2 px-3 py-2 text-sm font-bold ${v.atk ? "text-bad" : "text-muted"}`}>Ataque {sg(v.atk)}</span>
          <span className={`rounded-lg bg-panel-2 px-3 py-2 text-sm font-bold ${v.def ? "text-bad" : "text-muted"}`}>Defesa {sg(v.def)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONDS.map((d) => {
          const on = hasCond(p, d.k);
          return (
            <button
              key={d.k}
              type="button"
              aria-pressed={on}
              title={d.txt}
              onClick={() => commit((pl, log) => toggleCond(pl, d.k, log))}
              className={`chip ${on ? "border-chakra bg-[#3a2410] text-[#ffd3a8]" : "text-text hover:border-muted"}`}
            >
              {d.n}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-2">
        {p.conds.map((x) => {
          const d = COND_BY[x.k];
          return (
            <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-panel-2 px-3 py-2.5">
              <span className="size-2.5 shrink-0 rounded-full bg-bad" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-bold text-paper">
                  {x.name} {d?.stack && <span className="text-[#ffd3a8]">×{x.stacks}</span>}
                </span>
                <span className="text-[13px] leading-snug text-muted">
                  {d ? d.txt : "Condição combinada na mesa."}
                  {x.k === "fatigado" && exausto ? " (anulado por Exausto)" : ""}
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                Turnos
                <input
                  type="number"
                  inputMode="numeric"
                  className="field min-h-10 w-16 py-1 text-center"
                  value={x.turns}
                  onChange={(e) =>
                    patch((pl) => {
                      const c = pl.conds.find((y) => y.id === x.id);
                      if (c) c.turns = Math.max(0, Number(e.target.value) || 0);
                    })
                  }
                  aria-label={`Turnos restantes de ${x.name} (0 = sem prazo)`}
                />
              </label>
              <input
                className="field min-h-10 w-40 py-1 text-sm"
                placeholder="Nota"
                aria-label={`Nota de ${x.name}`}
                value={x.note}
                onChange={(e) =>
                  patch((pl) => {
                    const c = pl.conds.find((y) => y.id === x.id);
                    if (c) c.note = e.target.value;
                  })
                }
              />
              {d?.stack && (
                <>
                  <button type="button" className="btn-ghost size-10 min-h-10 px-0" aria-label={`Menos ${x.name}`} onClick={() => commit((pl, log) => stackCond(pl, x.id, -1, log))}>
                    −
                  </button>
                  <button type="button" className="btn-ghost size-10 min-h-10 px-0" aria-label={`Mais ${x.name}`} onClick={() => commit((pl, log) => stackCond(pl, x.id, 1, log))}>
                    +
                  </button>
                </>
              )}
              <button type="button" className="btn-ghost min-h-10 px-3 text-xs" onClick={() => commit((pl, log) => removeCond(pl, x.id, log))}>
                Remover
              </button>
            </li>
          );
        })}
        {p.conds.length === 0 && <li className="text-sm text-muted">Nenhuma condição ativa.</li>}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <label htmlFor="new-cond" className="text-xs text-muted">
            Condição da mesa (fora do livro)
          </label>
          <input
            id="new-cond"
            className="field"
            placeholder="Ex.: Envenenado, Marcado pelo selo…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
          />
        </div>
        <button type="button" className="btn-ghost" onClick={addCustom} disabled={!name.trim()}>
          Adicionar condição
        </button>
      </div>
    </section>
  );
}
