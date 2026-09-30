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
  { key: "equipamento", label: "Equipamento" },
  { key: "historia", label: "História" },
  { key: "ficha", label: "Ficha" },
] as const;

/** Texto sem acentos e em minúsculas, para buscas. */
export const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export type StepKey = (typeof STEPS)[number]["key"];
