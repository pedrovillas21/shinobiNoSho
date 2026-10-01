import { hasInvocacoes } from "@/lib/kuchiyose";
import type { Character } from "@/lib/types";

export type Setter = (fn: (d: Character) => void) => void;

export interface StepProps {
  c: Character;
  set: Setter;
}

export const STEPS = [
  { key: "conceito", label: "Conceito" },
  { key: "cla", label: "Clã" },
  { key: "atributos", label: "Atributos" },
  { key: "pericias", label: "Perícias" },
  { key: "aptidoes", label: "Aptidões" },
  { key: "poderes", label: "Poderes" },
  { key: "invocacoes", label: "Invocações" },
  { key: "equipamento", label: "Equipamento" },
  { key: "historia", label: "História" },
  { key: "ficha", label: "Ficha" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];
export type Step = (typeof STEPS)[number];

/** Etapas da ficha: Invocações só aparece para quem tem o poder Kuchiyose (ou uma origem que o traz). */
export const stepsFor = (c: Character): Step[] => STEPS.filter((s) => s.key !== "invocacoes" || hasInvocacoes(c));

/** "Etapa N" de uma etapa, contando só as que aparecem nesta ficha. */
export const stepKicker = (c: Character, key: StepKey) => `Etapa ${stepsFor(c).findIndex((s) => s.key === key) + 1}`;

/** Onde a pessoa está dentro da etapa Invocações: a parte do contrato ou a criatura em edição e sua sub-etapa. */
export interface InvNav {
  aba: number;
  edit: string | null;
  etapa: number;
}

export const ABAS_CONTRATO = ["Forma do poder", "Espécie", "Criaturas"] as const;

/** Texto sem acentos e em minúsculas, para buscas. */
export const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
