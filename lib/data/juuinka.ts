import type { ModTarget } from "../types";

/** Bônus do 1º estágio do Selo Amaldiçoado (Livro de Hijutsus, pág. 56). Escolhe-se 2 na compra. */
export const JUUINKA_BONUS: { k: string; label: string; t: ModTarget; v: number; note?: string }[] = [
  { k: "for", label: "Força +4", t: "FOR", v: 4, note: "não acumula com Dano Base +2" },
  { k: "dano", label: "Dano Base +2", t: "dano", v: 2, note: "um ataque, inclui Energizar" },
  { k: "precAtk", label: "Precisão de Ataque +1", t: "precAtk", v: 1 },
  { k: "precDef", label: "Precisão de Defesa +1", t: "precDef", v: 1 },
  { k: "dif", label: "Dificuldade das Técnicas +1", t: "dif", v: 1 },
  { k: "dureza", label: "Dureza de Corpo +1", t: "dureza", v: 1 },
];
export const JUUINKA_BONUS_BY = Object.fromEntries(JUUINKA_BONUS.map((b) => [b.k, b]));
export const JUUINKA_ICHI_PICKS = 2;

/** Benefícios padrão do 2º estágio; cada um pode ser trocado por um bônus do 1º estágio na compra. */
export const JUUINKA_NI_DEFAULT = [
  { k: "acel", label: "Acelerado" },
  { k: "chk20", label: "Chakra +20 (1×/cena)" },
];

export const JUUINKA_SELOS = [
  { k: "", label: "Selo comum" },
  { k: "ceu", label: "Selo do Céu", hint: "Asas: Voo 2 (até 2m de altura), +3m no deslocamento e na altura dos saltos; asas são armas naturais medianas de corte (dano de arma 3) e bloqueiam ataques que não sejam de poderes." },
  { k: "terra", label: "Selo da Terra", hint: "Cauda: +1 de precisão em Agilidade e perícias de Agilidade, +3m no deslocamento; a cauda é arma natural pesada de esmagamento (dano de arma 5, requer Força 12)." },
];

/** Escolhas do 2º estágio, completando os padrões que faltarem. */
export function niChoices(choices?: string[]): string[] {
  return JUUINKA_NI_DEFAULT.map((d, i) => choices?.[i] || d.k);
}

export function juuinkaChoiceLabel(k: string): string {
  return JUUINKA_BONUS_BY[k]?.label ?? JUUINKA_NI_DEFAULT.find((d) => d.k === k)?.label ?? k;
}
