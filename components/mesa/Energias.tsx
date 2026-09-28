"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { damage, heal, recover, setChk, setVit, spend, vitStatus } from "@/lib/play";
import { AnimatedNumber } from "../ui";
import type { MesaProps } from "./shared";

const pct = (cur: number, max: number) => Math.max(0, Math.min(100, (cur / Math.max(1, max)) * 100));

export function Energias({ p, v, commit }: MesaProps) {
  const status = vitStatus(p.vit);
  const statusCls = p.vit > 0 ? "bg-[#3d1f18] text-vit" : p.vit >= -10 ? "bg-[#6b3526] text-white" : "bg-bad text-[#1b0c08]";
  const over = p.chk - v.chkMax;

  return (
    <section aria-label="Energias" className="grid gap-4 md:grid-cols-2">
      <Pool
        title="Vitalidade"
        cur={p.vit}
        max={v.vitMax}
        maxNote={v.vitMax !== v.baseVitMax ? "máx. alterado por estado ativo" : undefined}
        badge={<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls}`}>{status}</span>}
        tone={{ box: "border-[#4a2418] bg-vit-bg", label: "text-vit-muted", num: "text-vit", track: "bg-[#3d1f18]", fill: "var(--color-bad)", border: "border-[#6b3526]", input: "bg-[#1f100c]" }}
        quick={[
          { label: "−1", run: () => commit((pl, log) => damage(pl, 1, log)) },
          { label: "−5", run: () => commit((pl, log) => damage(pl, 5, log)) },
          { label: "−10", run: () => commit((pl, log) => damage(pl, 10, log)) },
          { label: "+1", run: () => commit((pl, log) => heal(pl, v.vitMax, 1, log)) },
          { label: "+5", run: () => commit((pl, log) => heal(pl, v.vitMax, 5, log)) },
        ]}
        main={{ label: "Sofrer dano", cls: "btn-primary", run: (n) => commit((pl, log) => damage(pl, Math.abs(n), log)) }}
        second={{ label: "Curar", run: (n) => commit((pl, log) => heal(pl, v.vitMax, Math.abs(n), log)) }}
        onSet={(n) => commit((pl, log) => setVit(pl, n, log))}
        foot="0 fora de combate · −1 a −10 inconsciente · −11 a −20 morrendo · −21 morto. Cura nunca passa do máximo; “Definir” aceita qualquer valor."
      />
      <Pool
        title="Chakra"
        cur={p.chk}
        max={v.chkMax}
        badge={
          over > 0 ? (
            <span className="rounded-full bg-[#1f4e73] px-2.5 py-1 text-xs font-bold text-chk">+{over} acima do máximo</span>
          ) : p.chk <= 0 ? (
            <span className="rounded-full bg-[#4a2418] px-2.5 py-1 text-xs font-bold text-vit">Sem chakra · exausto</span>
          ) : null
        }
        tone={{ box: "border-[#1f3a52] bg-chk-bg", label: "text-chk-muted", num: "text-chk", track: "bg-[#1c3346]", fill: "#4f9bd9", border: "border-[#2d5577]", input: "bg-[#0e1821]" }}
        quick={[
          { label: "−1", run: () => commit((pl, log) => spend(pl, 1, log)) },
          { label: "−2", run: () => commit((pl, log) => spend(pl, 2, log)) },
          { label: "−5", run: () => commit((pl, log) => spend(pl, 5, log)) },
          { label: "+1", run: () => commit((pl, log) => recover(pl, v.chkMax, 1, log)) },
          { label: "+5", run: () => commit((pl, log) => recover(pl, v.chkMax, 5, log)) },
        ]}
        main={{ label: "Gastar chakra", cls: "btn bg-[#1f4e73] text-white hover:bg-[#1a4262]", run: (n) => commit((pl, log) => spend(pl, Math.abs(n), log)) }}
        second={{ label: "Recuperar", run: (n) => commit((pl, log) => recover(pl, v.chkMax, Math.abs(n), log)) }}
        onSet={(n) => commit((pl, log) => setChk(pl, n, log))}
        foot="Custo de técnica = nível usado. Em 0 você fica exausto até recuperar 1 ponto. Bônus como “Chakra +20” podem passar do máximo."
      />
    </section>
  );
}

interface PoolProps {
  title: string;
  cur: number;
  max: number;
  maxNote?: string;
  badge: React.ReactNode;
  tone: { box: string; label: string; num: string; track: string; fill: string; border: string; input: string };
  quick: { label: string; run: () => void }[];
  main: { label: string; cls: string; run: (n: number) => void };
  second: { label: string; run: (n: number) => void };
  onSet: (n: number) => void;
  foot: string;
}

function Pool({ title, cur, max, maxNote, badge, tone, quick, main, second, onSet, foot }: PoolProps) {
  const inputId = useId();
  const [amt, setAmt] = useState("5");
  const n = Number(amt);
  const valid = amt.trim() !== "" && Number.isFinite(n);

  return (
    <div className={`flex flex-col gap-3.5 rounded-2xl border p-4 sm:p-5 ${tone.box}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-bold uppercase tracking-[0.14em] ${tone.label}`}>{title}</span>
        {badge}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <AnimatedNumber value={cur} className={`font-display text-5xl font-extrabold leading-none sm:text-6xl ${tone.num}`} />
        <span className={`text-xl ${tone.label}`}>/ {max}</span>
        {maxNote && <span className="text-xs text-[#ffd3a8]">{maxNote}</span>}
      </div>
      <div className={`h-3 overflow-hidden rounded-full ${tone.track}`}>
        <motion.div className="h-3 rounded-full" style={{ background: tone.fill }} animate={{ width: `${pct(cur, max)}%` }} />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {quick.map((q) => (
          <button key={q.label} type="button" className={`btn min-h-10 border px-0 text-sm hover:border-muted ${tone.border}`} onClick={q.run}>
            {q.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-24 flex-col gap-1">
          <label htmlFor={inputId} className={`text-xs ${tone.label}`}>
            Valor
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            className={`field text-center ${tone.input} ${tone.border}`}
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && main.run(n)}
          />
        </div>
        <button type="button" className={`${main.cls} min-w-32 flex-1`} disabled={!valid} onClick={() => main.run(n)}>
          {main.label}
        </button>
        <button type="button" className={`btn border hover:border-muted ${tone.border}`} disabled={!valid} onClick={() => second.run(n)}>
          {second.label}
        </button>
        <button type="button" className={`btn border hover:border-muted ${tone.border}`} disabled={!valid} onClick={() => onSet(n)}>
          Definir
        </button>
      </div>
      <p className={`text-xs leading-relaxed ${tone.label}`}>{foot}</p>
    </div>
  );
}
