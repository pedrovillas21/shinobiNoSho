"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ATTRS, SKILLS } from "@/lib/data/base";
import { budgetFor, hasApt, skillTotal, spent, uid } from "@/lib/rules";
import type { AttrKey, CustomSkill } from "@/lib/types";
import { AnimatedNumber, Badge, IconLock, IconPlus, IconTrash, Stepper, StepHeader } from "../../ui";
import { stepKicker, type StepProps } from "../shared";

function BonusInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center gap-1 text-[11px] text-faint">
      outros
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        className="w-12 rounded-md border border-line-2 bg-ink-2 px-1.5 py-0.5 text-center text-xs text-text"
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

export function StepPericias({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const left = b.skill - s.skill;
  const [name, setName] = useState("");
  const [attr, setAttr] = useState<AttrKey>("INT");

  const editCustom = (u: string, fn: (x: CustomSkill) => void) => set((d) => fn(d.customSkills.find((x) => x.uid === u)!));

  return (
    <div className="flex flex-col gap-6">
      <StepHeader kicker={stepKicker(c, "pericias")} title="Perícias">
        O nível inicial é metade do atributo (arredondado para cima). Cada ponto soma +1, e pela regra você gasta no máximo {b.cap} pontos por perícia. Perícias treinadas só podem ser usadas com ao menos 1 ponto. Nada é travado: o que passar vira observação.
      </StepHeader>
      <span className={`self-start rounded-xl px-3 py-2 text-sm font-bold ${left < 0 ? "bg-bad/15 text-bad" : left === 0 ? "bg-ok/15 text-ok" : "bg-chakra/15 text-chakra"}`}>
        {left >= 0 ? `${left} ponto(s) de perícia restantes` : `${-left} ponto(s) a mais`}
      </span>

      <ul className="grid gap-2 md:grid-cols-2">
        {SKILLS.map((sk) => {
          const pts = c.skills[sk.key] || 0;
          const base = Math.ceil(c.attrs[sk.attr] / 2);
          const total = skillTotal(c, sk.key);
          const locked = sk.needsQuimico && !hasApt(c, "quimico");
          const over = pts > b.cap;
          return (
            <li key={sk.key} className={`card flex items-center gap-3 p-3 ${(locked && pts > 0) || over ? "border-bad/50" : ""}`}>
              <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-paper text-paper-ink">
                {total === null ? <span className="text-lg font-bold text-paper-muted">—</span> : <AnimatedNumber value={total} className="font-display text-2xl font-extrabold" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-paper">{sk.name}</span>
                  <Badge>{sk.attr}</Badge>
                  {sk.trained && <Badge tone="chakra">treinada</Badge>}
                  {sk.armor && <Badge>armadura</Badge>}
                  {locked && (
                    <Badge tone={pts > 0 ? "bad" : "muted"}>
                      <IconLock className="size-3" /> requer Químico
                    </Badge>
                  )}
                  {over && <Badge tone="bad">acima do limite {b.cap}</Badge>}
                </div>
                <span className="truncate text-xs text-faint" title={sk.desc}>
                  base {base} + {pts} pt{c.skillBonus[sk.key] ? ` + ${c.skillBonus[sk.key]} outros` : ""} · {sk.desc}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Stepper size="sm" label={sk.name} value={pts} onChange={(n) => set((d) => void (d.skills[sk.key] = n))} />
                <BonusInput label={`Bônus em ${sk.name}`} value={c.skillBonus[sk.key]} onChange={(n) => set((d) => void (d.skillBonus[sk.key] = n))} />
              </div>
            </li>
          );
        })}
      </ul>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-2xl font-extrabold text-paper">Perícias personalizadas</h3>
        <p className="text-sm text-muted">Crie perícias que não estão na lista (Voo, Navegação, Culinária…). Elas usam os mesmos pontos e limites.</p>
        <motion.ul layout className="grid gap-2 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {c.customSkills.map((cs) => {
              const total = cs.trained && cs.pts <= 0 ? null : Math.ceil(c.attrs[cs.attr] / 2) + cs.pts + (cs.bonus || 0);
              return (
                <motion.li layout key={cs.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }} className="card flex items-center gap-3 p-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-paper text-paper-ink">
                    {total === null ? <span className="text-lg font-bold text-paper-muted">—</span> : <AnimatedNumber value={total} className="font-display text-2xl font-extrabold" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input className="field py-1.5 text-sm font-bold" value={cs.name} placeholder="Nome da perícia" aria-label="Nome da perícia" onChange={(e) => editCustom(cs.uid, (x) => void (x.name = e.target.value))} />
                    <div className="flex flex-wrap items-center gap-2">
                      <select aria-label={`Atributo de ${cs.name || "perícia"}`} className="rounded-md border border-line-2 bg-ink-2 px-1.5 py-1 text-xs" value={cs.attr} onChange={(e) => editCustom(cs.uid, (x) => void (x.attr = e.target.value as AttrKey))}>
                        {ATTRS.map((a) => (
                          <option key={a.key} value={a.key}>
                            {a.key}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-muted">
                        <input type="checkbox" checked={cs.trained} onChange={(e) => editCustom(cs.uid, (x) => void (x.trained = e.target.checked))} className="accent-[var(--color-chakra)]" />
                        treinada
                      </label>
                      <BonusInput label={`Bônus em ${cs.name || "perícia"}`} value={cs.bonus} onChange={(n) => editCustom(cs.uid, (x) => void (x.bonus = n))} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Stepper size="sm" label={cs.name || "perícia"} value={cs.pts} onChange={(n) => editCustom(cs.uid, (x) => void (x.pts = n))} />
                    <button type="button" onClick={() => set((d) => void (d.customSkills = d.customSkills.filter((x) => x.uid !== cs.uid)))} className="flex items-center gap-1 text-[11px] text-faint hover:text-bad" aria-label={`Remover ${cs.name || "perícia"}`}>
                      <IconTrash className="size-3.5" /> remover
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            set((d) => void d.customSkills.push({ uid: uid(), name: name.trim(), attr, trained: false, pts: 0, bonus: 0 }));
            setName("");
          }}
        >
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova perícia" aria-label="Nome da nova perícia" />
          <select className="field sm:w-28" value={attr} onChange={(e) => setAttr(e.target.value as AttrKey)} aria-label="Atributo da nova perícia">
            {ATTRS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.key}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost shrink-0" disabled={!name.trim()}>
            <IconPlus className="size-4" /> Adicionar
          </button>
        </form>
      </section>

      <p className="text-xs leading-relaxed text-faint">
        “Outros” é para bônus de aptidões (como Perito) ou técnicas; bônus de precisão não contam para pré-requisitos. Venefício normalmente só pode ser comprada com a aptidão Químico.
      </p>
    </div>
  );
}
