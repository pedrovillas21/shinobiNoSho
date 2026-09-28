"use client";

import { useId } from "react";
import type { Character } from "@/lib/types";
import { NumberField, StepHeader } from "../../ui";
import type { StepProps } from "../shared";

const FIELDS: { key: keyof Pick<Character, "appearance" | "personality" | "goals" | "history" | "notes">; label: string; hint: string; rows: number }[] = [
  { key: "appearance", label: "Aparência", hint: "Rosto, roupas, marcas, bandana…", rows: 3 },
  { key: "personality", label: "Personalidade", hint: "Jeito de agir, manias, medos, hobbies.", rows: 3 },
  { key: "goals", label: "Objetivos", hint: "O que move o seu shinobi?", rows: 2 },
  { key: "history", label: "História", hint: "Família, passado, time e sensei.", rows: 6 },
  { key: "notes", label: "Anotações da mesa", hint: "Missões, contatos, dívidas, segredos.", rows: 3 },
];

function Area({ label, hint, rows, value, onChange }: { label: string; hint: string; rows: number; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea id={id} rows={rows} className="field resize-y leading-relaxed" placeholder={hint} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function StepHistoria({ c, set }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader kicker="Etapa 8" title="História">
        Não são regras, mas é o que torna o personagem único. Qual a personalidade? Como é a família? Ele tem objetivos?
      </StepHeader>
      {FIELDS.map((f) => (
        <Area key={f.key} label={f.label} hint={f.hint} rows={f.rows} value={c[f.key]} onChange={(v) => set((d) => void (d[f.key] = v))} />
      ))}
      <section className="card flex flex-col gap-3 p-4">
        <span className="label">Bônus manuais</span>
        <p className="text-xs text-muted">Para benefícios de hijutsu, bijuu ou itens que alteram os valores derivados.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Vitalidade" value={c.bonus.vit} onChange={(n) => set((d) => void (d.bonus.vit = n))} />
          <NumberField label="Chakra" value={c.bonus.chakra} onChange={(n) => set((d) => void (d.bonus.chakra = n))} />
          <NumberField label="Iniciativa" value={c.bonus.ini} onChange={(n) => set((d) => void (d.bonus.ini = n))} />
          <NumberField label="Deslocamento (m)" value={c.bonus.desloc} onChange={(n) => set((d) => void (d.bonus.desloc = n))} />
        </div>
      </section>
    </div>
  );
}
