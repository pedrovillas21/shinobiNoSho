"use client";

import { motion } from "motion/react";
import { ATTRS, COMBAT } from "@/lib/data/base";
import { budgetFor, combatTotal, hasApt, limitsFor, spent } from "@/lib/rules";
import type { CombatKey } from "@/lib/types";
import { AnimatedNumber, NumberField, Stepper, StepHeader, Toggle } from "../../ui";
import type { StepProps } from "../shared";

export function StepAtributos({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const lim = limitsFor(c);
  const left = b.attr - s.attr;
  const moved = COMBAT.reduce((t, k) => t + Math.max(0, c.combatBase[k.key] - 3), 0);
  const below = ATTRS.filter((a) => c.attrs[a.key] < b.minAttr);

  const fillMin = () =>
    set((d) => {
      ATTRS.forEach((a) => {
        if (d.attrs[a.key] < b.minAttr) d.attrs[a.key] = b.minAttr;
      });
    });

  const canBase = (k: CombatKey, delta: number) => {
    const next = { ...c.combatBase, [k]: c.combatBase[k] + delta };
    const up = COMBAT.reduce((t, x) => t + Math.max(0, next[x.key] - 3), 0);
    const down = COMBAT.reduce((t, x) => t + Math.max(0, 3 - next[x.key]), 0);
    if (!lim.enforce) return next[k] >= 0;
    return next[k] >= 1 && next[k] <= 5 && up <= 2 && down <= 2;
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <StepHeader kicker="Etapa 3" title="Atributos">
          Cada nível custa 1 ponto. Máximo igual ao NC ({c.nc}). Todos os atributos precisam atingir o mínimo de {b.minAttr} antes de você distribuir o resto livremente.
        </StepHeader>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-xl px-3 py-2 text-sm font-bold ${left < 0 ? "bg-bad/15 text-bad" : left === 0 ? "bg-ok/15 text-ok" : "bg-chakra/15 text-chakra"}`}>
            {left >= 0 ? `${left} ponto(s) restantes` : `${-left} ponto(s) a mais`}
          </span>
          {below.length > 0 && (
            <button type="button" className="btn-ghost min-h-10" onClick={fillMin}>
              Aplicar mínimo {b.minAttr} em todos
            </button>
          )}
          <button type="button" className="btn-ghost min-h-10" onClick={() => set((d) => ATTRS.forEach((a) => (d.attrs[a.key] = b.minAttr)))}>
            Reiniciar no mínimo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {ATTRS.map((a, i) => {
          const v = c.attrs[a.key];
          const low = v < b.minAttr;
          return (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex flex-col gap-3 rounded-2xl bg-paper p-4 text-paper-ink ring-2 ${low ? "ring-bad" : "ring-transparent"}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-extrabold">{a.name}</span>
                <span className="text-xs font-bold tracking-wider text-paper-muted">{a.key}</span>
              </div>
              <div className="flex justify-center">
                <Stepper tone="paper" label={a.name} value={v} min={0} max={lim.attrMax} canInc={!lim.enforce || left > 0} onChange={(n) => set((d) => void (d.attrs[a.key] = n))} />
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-paper-3">
                <motion.div className="h-1.5 rounded-full bg-seal" animate={{ width: `${Math.min(100, (v / c.nc) * 100)}%` }} />
              </div>
              <p className="text-xs leading-snug text-paper-muted">{low ? `Abaixo do mínimo (${b.minAttr}).` : a.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl font-extrabold text-paper">Habilidades de combate</h3>
          <p className="text-sm text-muted">
            Valor base 3 em cada. Você pode mover até 2 pontos entre elas ({moved}/2 movidos). Total = valor base + atributo.
          </p>
        </div>
        {hasApt(c, "acuidade") && (
          <div className="max-w-md">
            <Toggle checked={c.acuidade} onChange={(v) => set((d) => void (d.acuidade = v))} label="Usar Acuidade" hint="Combate Corporal usa Destreza quando for maior que Força." />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COMBAT.map((k) => {
            const attrName = k.key === "CC" && c.acuidade && hasApt(c, "acuidade") && c.attrs.DES > c.attrs.FOR ? "DES" : k.attr;
            return (
              <div key={k.key} className="card flex flex-col gap-3 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-muted">{k.name}</span>
                  <span className="text-xs text-faint">{k.short}</span>
                </div>
                <AnimatedNumber value={combatTotal(c, k.key)} className="font-display text-4xl font-extrabold text-paper" />
                <span className="text-xs text-faint">
                  base {c.combatBase[k.key]} + {attrName} {c.attrs[attrName]}
                  {c.combatBonus[k.key] ? ` + ${c.combatBonus[k.key]}` : ""}
                </span>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-faint">Valor base</span>
                    <Stepper size="sm" label={`valor base de ${k.name}`} value={c.combatBase[k.key]} min={canBase(k.key, -1) ? 0 : c.combatBase[k.key]} max={canBase(k.key, 1) ? 99 : c.combatBase[k.key]} onChange={(n) => set((d) => void (d.combatBase[k.key] = n))} />
                  </div>
                  <NumberField className="w-20" label="Outros" value={c.combatBonus[k.key]} onChange={(n) => set((d) => void (d.combatBonus[k.key] = n))} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl font-extrabold text-paper">Atributos sociais</h3>
          <p className="text-sm text-muted">
            {b.social} pontos para Carisma e Manipulação (2× o atributo mínimo, no mínimo 2). Máximo {b.cap} em cada. Não é obrigatório gastar todos.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["car", "Carisma", "Atrair e agradar: charme, simpatia, influência."],
              ["man", "Manipulação", "Fazer alguém agir como você quer: blefe, lábia, enganação."],
            ] as const
          ).map(([k, name, desc]) => (
            <div key={k} className="card flex items-center justify-between gap-4 p-4">
              <div className="flex flex-col">
                <span className="font-display text-lg font-extrabold text-paper">{name}</span>
                <span className="text-xs text-muted">{desc}</span>
              </div>
              <Stepper label={name} value={c.social[k]} max={lim.cap} canInc={!lim.enforce || s.social < b.social} onChange={(n) => set((d) => void (d.social[k] = n))} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
