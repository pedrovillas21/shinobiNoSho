"use client";

import { useState } from "react";
import { RESET_LABEL, endScene, restNight, restoreAll, tickCounter } from "@/lib/play";
import { uid } from "@/lib/rules";
import type { PlayCounter, PlayLog } from "@/lib/types";
import { IconTrash } from "../ui";
import { type MesaProps } from "./shared";

/** O que a próxima Pílula do Soldado causa, pelas já tomadas desde o descanso. */
const PILL_NEXT = ["a próxima deixa fatigado", "a próxima deixa exausto", "a próxima deixa inconsciente", "a próxima intoxica (sem chakra)"];

const DOT: Record<PlayLog["tone"], string> = { bad: "bg-bad", ok: "bg-ok", chk: "bg-[#4f9bd9]", n: "bg-muted" };

export function Lateral(props: MesaProps) {
  return (
    <>
      <Descanso {...props} />
      <Contadores {...props} />
      <Historico {...props} />
      <Notas {...props} />
    </>
  );
}

function Descanso({ c, v, commit }: MesaProps) {
  const [confirm, setConfirm] = useState(false);
  const items = [
    {
      title: "Noite de descanso",
      sub: `+${10 + 2 * c.attrs.VIG} Vit, +${5 + 2 * c.attrs.ESP} Chakra, tira fatigado e exausto, repõe usos`,
      color: "var(--color-chk-muted)",
      icon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
      run: () => commit((pl, log, ch) => restNight(pl, ch, v, log)),
    },
    {
      title: "Fim da cena",
      sub: "Zera usos “por cena” e tira fintado, flanqueado, desprevenido e caído",
      color: "var(--color-chakra)",
      icon: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
      run: () => commit((pl, log) => endScene(pl, log)),
    },
  ];
  return (
    <section aria-labelledby="h-rest" className="card flex flex-col gap-3 p-4 sm:p-5">
      <h2 id="h-rest" className="font-display text-xl font-extrabold text-paper">
        Descanso e cena
      </h2>
      {items.map((it) => (
        <button key={it.title} type="button" className="btn-ghost min-h-16 justify-start gap-3 py-2 text-left" onClick={it.run}>
          <svg viewBox="0 0 24 24" fill="none" stroke={it.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden="true">
            {it.icon}
          </svg>
          <span className="flex flex-col gap-0.5">
            <span>{it.title}</span>
            <span className="text-xs font-normal leading-snug text-muted">{it.sub}</span>
          </span>
        </button>
      ))}
      {confirm ? (
        <div className="flex gap-2">
          <button
            type="button"
            className="btn flex-1 bg-ok text-paper-ink"
            onClick={() => {
              commit((pl, log, ch) => restoreAll(pl, ch, log));
              setConfirm(false);
            }}
          >
            Confirmar: restaurar tudo
          </button>
          <button type="button" className="btn-ghost" onClick={() => setConfirm(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" className="btn-ghost min-h-16 justify-start gap-3 py-2 text-left" onClick={() => setConfirm(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-ok)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden="true">
            <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />
          </svg>
          <span className="flex flex-col gap-0.5">
            <span>Restaurar tudo</span>
            <span className="text-xs font-normal leading-snug text-muted">Vitalidade e chakra cheios, sem condições nem estados ativos</span>
          </span>
        </button>
      )}
    </section>
  );
}

function Contadores({ c, v, p, commit, patch }: MesaProps) {
  const [name, setName] = useState("");
  const [max, setMax] = useState("1");
  const [reset, setReset] = useState<PlayCounter["reset"]>("cena");
  const pillGain = Math.ceil(v.attrs.ESP / 2);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const m = Math.max(1, Number(max) || 1);
    commit((pl, log) => {
      pl.counters.push({ id: uid(), n, cur: m, max: m, reset, pill: /p[ií]lula/i.test(n) });
      log(`Contador criado: ${n}`, "n");
    });
    setName("");
    setMax("1");
  };

  return (
    <section aria-labelledby="h-ctr" className="card flex flex-col gap-3 p-4 sm:p-5">
      <h2 id="h-ctr" className="font-display text-xl font-extrabold text-paper">
        Usos e consumíveis
      </h2>
      <ul className="flex flex-col">
        {p.counters.map((k) => (
          <li key={k.id} className="flex flex-wrap items-center gap-2 border-b border-line py-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-bold">{k.n}</span>
              <span className="text-xs text-muted">
                {RESET_LABEL[k.reset]}
                {k.pill ? ` · +${pillGain} chakra · ${PILL_NEXT[Math.min(p.pills ?? 0, 3)]}` : ""}
              </span>
            </div>
            {k.pill && (
              <button type="button" className="btn min-h-10 border border-[#2d5577] px-3 text-xs" disabled={k.cur <= 0} onClick={() => commit((pl, log) => tickCounter(pl, k.id, -1, log, pillGain))}>
                Tomar
              </button>
            )}
            <button type="button" className="btn-ghost size-10 min-h-10 px-0" aria-label={`Usar um: ${k.n}`} onClick={() => commit((pl, log) => tickCounter(pl, k.id, -1, log))}>
              −
            </button>
            <span className={`min-w-14 text-center font-display text-xl font-extrabold tabular-nums ${k.cur <= 0 ? "text-bad" : "text-paper"}`}>
              {k.cur}
              <span className="text-xs text-muted">/{k.max}</span>
            </span>
            <button type="button" className="btn-ghost size-10 min-h-10 px-0" aria-label={`Repor um: ${k.n}`} onClick={() => commit((pl, log) => tickCounter(pl, k.id, 1, log))}>
              +
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-lg text-faint hover:text-bad"
              aria-label={`Apagar contador ${k.n}`}
              onClick={() => patch((pl) => void (pl.counters = pl.counters.filter((x) => x.id !== k.id)))}
            >
              <IconTrash className="size-4" />
            </button>
            {k.note && <span className="basis-full text-xs leading-snug text-muted">{k.note}</span>}
          </li>
        ))}
        {p.counters.length === 0 && <li className="py-2 text-sm text-muted">Nenhum contador.</li>}
      </ul>
      <div className="grid grid-cols-[minmax(0,1fr)_72px] items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="ctr-n" className="text-xs text-muted">
            Novo contador
          </label>
          <input id="ctr-n" className="field" placeholder="Ex.: Shurikens, Kage Bunshin…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ctr-m" className="text-xs text-muted">
            Máx.
          </label>
          <input id="ctr-m" type="number" inputMode="numeric" className="field text-center" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <select aria-label="Quando repõe" className="field" value={reset} onChange={(e) => setReset(e.target.value as PlayCounter["reset"])}>
          <option value="cena">Repõe no fim da cena</option>
          <option value="descanso">Repõe no descanso</option>
          <option value="nunca">Não repõe (consumível)</option>
        </select>
        <button type="button" className="btn-ghost" onClick={add} disabled={!name.trim()}>
          Adicionar
        </button>
      </div>
      {c.items.length > 0 && <p className="text-xs leading-relaxed text-faint">Os itens do equipamento viraram contadores na primeira abertura da mesa.</p>}
    </section>
  );
}

function Historico({ p, patch }: MesaProps) {
  return (
    <section aria-labelledby="h-log" className="card flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="h-log" className="font-display text-xl font-extrabold text-paper">
          Histórico
        </h2>
        {p.log.length > 0 && (
          <button type="button" className="text-xs font-bold text-muted hover:text-text" onClick={() => patch((pl) => void (pl.log = []))}>
            Limpar
          </button>
        )}
      </div>
      {p.log.length === 0 ? (
        <p className="text-sm text-muted">Cada dano, gasto e ativação aparece aqui.</p>
      ) : (
        <ol className="flex max-h-[420px] flex-col overflow-y-auto">
          {p.log.map((l) => (
            <li key={l.id} className="flex items-baseline gap-2.5 border-b border-panel-2 py-1.5">
              <span className={`size-2 shrink-0 -translate-y-px rounded-full ${DOT[l.tone]}`} />
              <span className="w-8 shrink-0 text-xs font-bold text-muted">{l.r}</span>
              <span className="text-sm leading-snug">{l.txt}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Notas({ p, patch }: MesaProps) {
  return (
    <section className="card flex flex-col gap-2 p-4 sm:p-5">
      <label htmlFor="mesa-notas" className="font-display text-xl font-extrabold text-paper">
        Anotações da sessão
      </label>
      <textarea
        id="mesa-notas"
        rows={6}
        className="field resize-y py-3 leading-relaxed"
        placeholder="Pistas, nomes, acordos com o Mestre…"
        value={p.notes}
        onChange={(e) => patch((pl) => void (pl.notes = e.target.value))}
      />
    </section>
  );
}
