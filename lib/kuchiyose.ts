import { ATTRS } from "./data/base";
import { ESPECIE_BY_ID, type Especie } from "./data/kuchiyose";
import { APT_COST, originIds, powerLevel, uid } from "./rules";
import type { AttrKey, Character, CombatKey, ContratoKuchiyose, Invocacao, SizeKey } from "./types";

/* Regras do poder Kuchiyose e da ficha das criaturas (Livro Básico, pág. 224–227). */

/** Categorias de tamanho das invocações: limites de NC (pág. 226) e ajustes da Tabela de Tamanho (pág. 271). */
export const TAMANHOS: { k: SizeKey; n: string; mod: number; minNc: number; maxNc: number; atk: number; alc: number; desl: number; furt: number }[] = [
  { k: "miudo", n: "Miúdo", mod: -3, minNc: 14, maxNc: Infinity, atk: 1, alc: 1, desl: -6, furt: 2 },
  { k: "pequeno", n: "Pequeno", mod: -1, minNc: 0, maxNc: 8, atk: 0, alc: 1, desl: -3, furt: 1 },
  { k: "medio", n: "Médio", mod: 0, minNc: 0, maxNc: Infinity, atk: 0, alc: 1, desl: 0, furt: 0 },
  { k: "grande", n: "Grande", mod: 1, minNc: 12, maxNc: Infinity, atk: 0, alc: 2, desl: 3, furt: -1 },
  { k: "enorme", n: "Enorme", mod: 3, minNc: 14, maxNc: Infinity, atk: 0, alc: 3, desl: 6, furt: -2 },
  { k: "imenso", n: "Imenso", mod: 5, minNc: 16, maxNc: Infinity, atk: 0, alc: 4, desl: 9, furt: -3 },
];
export const TAMANHO_BY_ID = Object.fromEntries(TAMANHOS.map((t) => [t.k, t])) as Record<SizeKey, (typeof TAMANHOS)[number]>;
const sizeIndex = (k: SizeKey) => TAMANHOS.findIndex((t) => t.k === k);

/** Tamanho permitido pelo NC da criatura e pelo limite da espécie. */
export function tamanhoPermitido(k: SizeKey, nc: number, e: Especie | null): boolean {
  const t = TAMANHO_BY_ID[k];
  if (nc < t.minNc || nc > t.maxNc) return false;
  return !e?.maxSize || sizeIndex(k) <= sizeIndex(e.maxSize);
}

export const kuchiyoseLevel = (c: Character) => powerLevel(c, "kuchiyose");

/** Clãs cuja 1ª opção é o Kuchiyose restrito (Hatake: Cães; Sarutobi: Macacos; Shimura: Baku). */
const CLAS_KUCHIYOSE = ["hatake", "sarutobi", "shimura"];

/** Forma do poder pela origem: Hijutsu com o hijutsu Kuchiyose ou a 1ª opção desses clãs; senão, poder comum. */
export function formaAuto(c: Character): "hijutsu" | "comum" {
  if (originIds(c).includes("kuchiyose")) return "hijutsu";
  if (c.originId && CLAS_KUCHIYOSE.includes(c.originId) && c.originOption === 0) return "hijutsu";
  return "comum";
}

export const contrato = (c: Character): ContratoKuchiyose => c.kuchiyose ?? { forma: null, especie: null, criaturas: [] };

export const especieDe = (c: Character): Especie | null => ESPECIE_BY_ID[contrato(c).especie ?? ""] ?? null;

/** Forma em uso: a escolhida, ou a da origem. Espécies que só existem como poder comum forçam o comum. */
export function formaDe(c: Character): "hijutsu" | "comum" {
  if (especieDe(c)?.onlyComum) return "comum";
  return contrato(c).forma ?? formaAuto(c);
}

export const especieLiberada = (c: Character, e: Especie) => !e.exclusive || originIds(c).some((o) => e.exclusive!.origins.includes(o));

/** A etapa Invocações aparece com o poder comprado, com uma origem que traz o Kuchiyose, ou com criaturas já feitas. */
export const hasInvocacoes = (c: Character) => kuchiyoseLevel(c) > 0 || formaAuto(c) === "hijutsu" || contrato(c).criaturas.length > 0;

/** Quantidades possíveis numa invocação (sem contar a invocação numerosa, que usa o NC máximo). */
export function qtyOptions(e: Especie | null): number[] {
  if (e?.unitary) return [1];
  if (e?.triple) return [1, 3];
  return [1, 2];
}

/** NC máximo: o dobro do nível do poder; com mais de uma criatura, −2 (Doki: −1 com até 3). */
export function ncMaxFor(level: number, qty: number, e: Especie | null): number {
  const base = 2 * level;
  if (qty <= 1) return base;
  return Math.max(0, base - (e?.triple ? 1 : 2));
}

/** Pontos de atributo pela tabela de personagens (12 no NC 4, +6 por NC). Abaixo do NC 4 a criatura não tem pontos. */
export const invAttrBudget = (nc: number) => (nc >= 4 ? 12 + 6 * (nc - 4) : 0);
export const invMinAttr = (nc: number) => (nc >= 4 ? Math.max(0, Math.ceil((nc - 4) / 2)) : 0);
/** 1 Ponto de Poder a cada 2 NC completos. */
export const invPowerPoints = (nc: number) => Math.floor(nc / 2);
export const invFreeApts = (nc: number) => (nc >= 4 ? 3 : 0);

export function statsInvocacao(c: Character, inv: Invocacao) {
  const e = especieDe(c);
  const size = TAMANHO_BY_ID[inv.size] ?? TAMANHO_BY_ID.medio;
  const forma = formaDe(c);
  const pen = forma === "comum" ? (e?.comumPenalty ?? 3) : 0;
  const zero = inv.nc < 4;
  const A = inv.attrs;
  const has = (n: string) => inv.apts.includes(n);
  // Força e Vigor de tamanho valem para Vitalidade, dano e pré-requisitos; não para o Combate Corporal (pág. 271).
  const forT = A.FOR + size.mod;
  const vigT = A.VIG + size.mod;
  const prec = (v: number) => (zero ? 0 : v - pen);
  const combat: Record<CombatKey, number> = {
    CC: prec(3 + A.FOR + size.atk),
    CD: prec(3 + A.DES + size.atk),
    ESQ: prec(3 + A.AGI + (has("Reflexos") ? 1 : 0)),
    LM: prec(3 + A.PER + (has("Intuição") ? 1 : 0)),
  };
  const agiDesloc = has("Velocista") ? A.AGI * 2 : A.AGI;
  const freeApts = invFreeApts(inv.nc);
  const powerLvl = inv.power ? inv.powerLevel : 0;
  const extraApts = Math.max(0, inv.apts.length - freeApts);
  return {
    especie: e,
    size,
    forma,
    pen,
    forT,
    vigT,
    budget: invAttrBudget(inv.nc),
    minAttr: invMinAttr(inv.nc),
    spentAttr: ATTRS.reduce((t, a) => t + (A[a.key] || 0), 0),
    pp: invPowerPoints(inv.nc),
    ppSpent: powerLvl + extraApts * APT_COST,
    cap: Math.floor(inv.nc / 2),
    freeApts,
    // Vitalidade pela regra comum, reduzida pela metade (arredonda para baixo).
    vit: Math.floor((10 + 3 * vigT + 5 * inv.nc) / 2),
    chakra: 10 + 3 * A.ESP,
    // Dano corporal de qualquer invocação: Força − 3, mínimo 3; +1 com arma marcial.
    dano: zero ? 0 : Math.max(3, forT - 3) + (inv.marcial ? 1 : 0),
    combat,
    desloc: Math.max(0, 10 + Math.ceil(agiDesloc / 2) + size.desl),
    alcance: size.alc,
    skills: (e?.skills ?? []).map((s) => ({ ...s, v: zero ? 0 : A[s.attr] + (s.name.startsWith("Furtividade") ? size.furt : 0) })),
  };
}

/** Técnica da espécie disponível para esta criatura (NC, tamanho e poder). */
export function tecnicaAtiva(inv: Invocacao, t: { minNc?: number; minSize?: SizeKey; needsPower?: string }): string | null {
  if (t.minNc && inv.nc < t.minNc) return `pede NC ${t.minNc}`;
  if (t.minSize && sizeIndex(inv.size) < sizeIndex(t.minSize)) return `pede tamanho ${TAMANHO_BY_ID[t.minSize].n} ou maior`;
  if (t.needsPower && inv.power !== t.needsPower) return `pede o poder ${t.needsPower[0].toUpperCase()}${t.needsPower.slice(1)}`;
  return null;
}

/** Sub-etapas da ficha da criatura. */
export const ETAPAS_CRIATURA = ["Base", "Atributos", "Poder", "Aptidões", "Ficha"] as const;

export interface InvIssue {
  sev: "erro" | "aviso";
  /** Sub-etapa da ficha (1 a 5). */
  etapa: number;
  text: string;
  /** Recomendação do livro (não aparece nas observações da ficha do personagem). */
  dica?: boolean;
}

export function validarInvocacao(c: Character, inv: Invocacao): InvIssue[] {
  const out: InvIssue[] = [];
  const push = (sev: InvIssue["sev"], etapa: number, text: string, dica?: boolean) => out.push({ sev, etapa, text, dica });
  const e = especieDe(c);
  const s = statsInvocacao(c, inv);
  const lvl = kuchiyoseLevel(c);
  const ncMax = ncMaxFor(lvl, inv.qty, e);

  // Base
  if (!qtyOptions(e).includes(inv.qty)) push("erro", 1, e?.unitary ? `${e.name}: invocação unitária, só uma por cena.` : `Quantidade ${inv.qty} não é permitida para ${e?.name ?? "a espécie"}.`);
  if (inv.nc > ncMax) push("erro", 1, `NC ${inv.nc} passa do limite: Kuchiyose ${lvl} com ${inv.qty === 1 ? "1 criatura" : `${inv.qty} criaturas`} permite até NC ${ncMax}.`);
  if (inv.nc < 4) push("aviso", 1, "Abaixo de NC 4: sem pontos nem aptidões, precisões em zero e ataques sem dano.");
  if (!tamanhoPermitido(inv.size, inv.nc, e)) {
    const t = s.size;
    const why = e?.maxSize && sizeIndex(inv.size) > sizeIndex(e.maxSize) ? `${e.name} vão até ${TAMANHO_BY_ID[e.maxSize].n}` : t.minNc > inv.nc ? `pede NC ${t.minNc}` : `vai até NC ${t.maxNc}`;
    push("erro", 1, `Tamanho ${t.n} não é permitido (${why}).`);
  }

  // Atributos
  if (s.spentAttr > s.budget) push("erro", 2, `Atributos: ${s.spentAttr - s.budget} ponto(s) acima dos ${s.budget}.`);
  else if (s.spentAttr < s.budget) push("aviso", 2, `Faltam ${s.budget - s.spentAttr} ponto(s) de atributo.`);
  for (const a of ATTRS) {
    const v = inv.attrs[a.key];
    if (e?.intZero && a.key === "INT") {
      if (v > 0) push("erro", 2, `${e.name} têm sempre Inteligência zero.`);
      continue;
    }
    if (inv.nc >= 4 && v > inv.nc) push("erro", 2, `${a.name} ${v} passa do máximo (NC ${inv.nc}).`);
    if (v < s.minAttr) push("erro", 2, `${a.name} ${v} está abaixo do mínimo ${s.minAttr}.`);
  }
  if (e && inv.nc >= 4) {
    const minMain = Math.min(...e.main.map((k) => inv.attrs[k]));
    const outros = ATTRS.filter((a) => !e.main.includes(a.key) && inv.attrs[a.key] > minMain);
    if (outros.length) push("aviso", 2, `Recomendado (não obrigatório): mais pontos nos principais (${e.main.map((k) => ATTRS.find((a) => a.key === k)!.name).join(", ")}).`, true);
  }

  // Poder
  if (inv.power && !e?.powers.some((p) => p.id === inv.power)) push("erro", 3, `${e?.name ?? "A espécie"} não pode ter esse poder.`);
  if (inv.power && inv.powerLevel > s.cap) push("erro", 3, `O poder no nível ${inv.powerLevel} passa do limite de poder (${s.cap}).`);
  if (s.ppSpent > s.pp) push("erro", inv.apts.length > s.freeApts ? 4 : 3, `Pontos de Poder: ${s.ppSpent} gastos de ${s.pp} (1 a cada 2 NC).`);

  // Aptidões
  if (inv.nc < 4 && inv.apts.length) push("erro", 4, "Abaixo de NC 4 a criatura não tem aptidões.");
  const fora = inv.apts.filter((n) => !e?.apts.includes(n));
  if (fora.length) push("erro", 4, `Fora da lista de ${e?.name ?? "da espécie"}: ${fora.join(", ")}.`);

  if (s.forma === "comum") push("aviso", 5, `Poder comum: a criatura é capanga, com −${s.pen} de precisão já aplicado.`, true);
  return out;
}

/** Observações do contrato e das criaturas, para a lista da ficha do personagem. */
export function validateKuchiyose(c: Character, push: (sev: "erro" | "aviso", step: string, text: string) => void) {
  if (!hasInvocacoes(c)) return;
  const k = contrato(c);
  const e = especieDe(c);
  if (kuchiyoseLevel(c) === 0) push("aviso", "invocacoes", "Kuchiyose: compre o poder na etapa Poderes para poder invocar.");
  if (!e) push("aviso", "invocacoes", "Kuchiyose: escolha a espécie do contrato.");
  else if (!especieLiberada(c, e)) push("erro", "invocacoes", `Kuchiyose: ${e.name} são exclusivos de ${e.exclusive!.label}.`);
  if (k.forma === "hijutsu" && formaAuto(c) === "comum" && !e?.onlyComum)
    push("aviso", "invocacoes", "Kuchiyose como Hijutsu pede não ter outro clã ou hijutsu (ou a opção do clã com Kuchiyose).");
  for (const inv of k.criaturas) {
    for (const i of validarInvocacao(c, inv)) if (!i.dica) push(i.sev, "invocacoes", `${inv.name.trim() || "Criatura sem nome"}: ${i.text}`);
  }
}

export function novaInvocacao(c: Character): Invocacao {
  const e = especieDe(c);
  const nc = Math.max(4, ncMaxFor(kuchiyoseLevel(c), 1, e));
  const min = invMinAttr(nc);
  const attrs = Object.fromEntries(ATTRS.map((a) => [a.key, e?.intZero && a.key === "INT" ? 0 : min])) as Record<AttrKey, number>;
  return { uid: uid(), name: "", personality: "", qty: 1, nc, size: "medio", attrs, power: null, powerLevel: 0, apts: [], marcial: false };
}
