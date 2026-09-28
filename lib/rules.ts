import { APT_BY_ID, BANNED_APTS } from "./data/aptidoes";
import { ATTRS, COMBAT, RANKS, SKILLS } from "./data/base";
import { ORIGIN_BY_ID } from "./data/origens";
import { EFEITO_BY_ID, PODER_BY_ID } from "./data/poderes";
import type { Aptidao, AttrKey, Character, CombatKey, Optionals, Req, SkillKey } from "./types";

/** Nível máximo de campanha da mesa (o livro vai até 20). */
export const NC_MIN = 4;
export const NC_MAX = 30;
export const FREE_APTS = 3;
export const APT_COST = 2;

const ceilHalf = (n: number) => Math.ceil(n / 2);

export interface Budget {
  attr: number;
  skill: number;
  power: number;
  social: number;
  minAttr: number;
  /** Limite de poder, perícia (pontos gastos) e atributos sociais. */
  cap: number;
  rank: string;
  ryos: number;
}

/**
 * Tabela de evolução estendida até NC 30.
 * Cada NC acima de 4 soma +6 atributos, +4 perícias e +2 poderes (o NC 20 dá +4 extras de Kage).
 * O mínimo de atributo sobe 1 a cada NC ímpar.
 */
export function budgetFor(nc: number, opt: Optionals): Budget {
  const n = Math.min(NC_MAX, Math.max(NC_MIN, Math.round(nc)));
  const steps = n - NC_MIN;
  let power: number;
  if (opt.tresPontosPoder) power = n >= 20 ? 60 + 3 * (n - 20) : 6 + 3 * steps;
  else power = n >= 20 ? 40 + 2 * (n - 20) : 4 + 2 * steps;
  if (opt.aptidoesBanidas) power += 4;
  const minAttr = Math.max(0, Math.ceil((n - 4) / 2));
  const rank = [...RANKS].reverse().find((r) => n >= r.min)!;
  return {
    attr: 12 + 6 * steps,
    skill: 8 + 4 * steps,
    power,
    social: Math.max(2, 2 * minAttr),
    minAttr,
    cap: Math.floor(n / 2),
    rank: rank.name,
    ryos: rank.ryos,
  };
}

export function rankLabel(nc: number) {
  const r = [...RANKS].reverse().find((x) => nc >= x.min)!;
  return nc > 20 ? `${r.name} · NC estendido` : r.name;
}

/* ---------------- consultas ---------------- */

export function aptLevel(c: Character, id: string): number {
  return c.aptidoes.filter((a) => a.id === id).reduce((m, a) => Math.max(m, a.level), 0);
}
export const hasApt = (c: Character, id: string, level = 1) => aptLevel(c, id) >= level;

export function powerLevel(c: Character, id: string): number {
  return c.poderes.filter((p) => p.id === id).reduce((m, p) => Math.max(m, p.level), 0);
}

export function combatTotal(c: Character, k: CombatKey): number {
  const def = COMBAT.find((x) => x.key === k)!;
  let attr = c.attrs[def.attr];
  if (k === "CC" && c.acuidade && hasApt(c, "acuidade")) attr = Math.max(attr, c.attrs.DES);
  return c.combatBase[k] + attr + (c.combatBonus[k] || 0);
}

/** Valor de perícia, ou null se é treinada e não recebeu pontos. */
export function skillTotal(c: Character, k: SkillKey): number | null {
  const def = SKILLS.find((s) => s.key === k)!;
  const pts = c.skills[k] || 0;
  if (def.trained && pts <= 0) return null;
  return ceilHalf(c.attrs[def.attr]) + pts + (c.skillBonus[k] || 0);
}

/** Valor usado em pré-requisitos (sem bônus de precisão). */
function skillForReq(c: Character, k: SkillKey): number {
  const def = SKILLS.find((s) => s.key === k)!;
  const pts = c.skills[k] || 0;
  if (def.trained && pts <= 0) return 0;
  return ceilHalf(c.attrs[def.attr]) + pts;
}

function combatForReq(c: Character, k: CombatKey): number {
  const def = COMBAT.find((x) => x.key === k)!;
  let attr = c.attrs[def.attr];
  if (k === "CC" && c.acuidade && hasApt(c, "acuidade")) attr = Math.max(attr, c.attrs.DES);
  return c.combatBase[k] + attr;
}

export function checkReq(c: Character, r: Req): boolean {
  switch (r.t) {
    case "attr":
      return c.attrs[r.k] >= r.min;
    case "skill":
      return skillForReq(c, r.k) >= r.min;
    case "combat":
      return combatForReq(c, r.k) >= r.min;
    case "apt":
      if (c.optionals.aptidoesBanidas && BANNED_APTS.includes(r.id)) return true;
      return hasApt(c, r.id, r.level ?? 1);
    case "power":
      return powerLevel(c, r.id) >= r.min;
    case "noOrigin":
      return !c.originId;
    case "any":
      return r.of.some((x) => checkReq(c, x));
  }
}

export const reqsMet = (c: Character, reqs?: Req[]) => (reqs ?? []).every((r) => checkReq(c, r));

/** Limites de um Genin (NC 4) para aptidão restrita poder ser gratuita. */
function geninReachable(r: Req): boolean {
  switch (r.t) {
    case "attr":
    case "skill":
      return r.min <= 4;
    case "combat":
      return r.min <= 9;
    case "power":
      return r.min <= 2;
    case "apt":
    case "noOrigin":
      return true;
    case "any":
      return r.of.some(geninReachable);
  }
}

export function isFreeEligible(a: Aptidao): boolean {
  if (a.free) return true;
  if (a.cat === "restrita" || a.cat === "especial") return (a.req ?? []).every(geninReachable);
  return false;
}

/* ---------------- origem ---------------- */

export function originIds(c: Character): string[] {
  const ids = c.originId ? [c.originId] : [];
  return [...ids, ...c.extraOrigins.filter((x) => x && x !== c.originId)];
}

export const CUSTOM_ORIGIN = "custom";

export function originName(c: Character, id: string | null = c.originId): string | null {
  if (!id) return null;
  if (id === CUSTOM_ORIGIN) return c.customOrigin.name || "Clã/hijutsu próprio";
  return ORIGIN_BY_ID[id]?.name ?? null;
}

export function originKanji(c: Character): string {
  if (c.originId === CUSTOM_ORIGIN) return c.customOrigin.kanji || "忍";
  return (c.originId && ORIGIN_BY_ID[c.originId]?.kanji) || "忍";
}

/** Limites efetivos: no modo livre nada é travado. */
export function limitsFor(c: Character) {
  const b = budgetFor(c.nc, c.optionals);
  const free = c.optionals.livre;
  return { attrMax: free ? 99 : c.nc, cap: free ? 99 : b.cap, enforce: !free };
}

export function allowedRestricted(c: Character) {
  const apts = new Set<string>();
  const powers = new Set<string>();
  for (const id of originIds(c)) {
    if (id === CUSTOM_ORIGIN) {
      c.customOrigin.aptidoes.forEach((a) => apts.add(a));
      c.customOrigin.poderes.forEach((p) => powers.add(p));
      continue;
    }
    const o = ORIGIN_BY_ID[id];
    if (!o) continue;
    const opt = id === c.originId ? o.options[c.originOption] ?? o.options[0] : o.options[0];
    opt.aptidoes.forEach((a) => apts.add(a));
    opt.poderes.forEach((p) => powers.add(p));
  }
  return { apts, powers };
}

/* ---------------- energias e estatísticas ---------------- */

export function derived(c: Character) {
  const vig = c.attrs.VIG;
  let vit = 10 + 3 * vig + 5 * c.nc;
  if (hasApt(c, "corpulencia")) vit += 3 * vig;
  vit += c.bonus.vit || 0;
  let chakra = 10 + 3 * c.attrs.ESP;
  if (hasApt(c, "chakra-expandido")) chakra = Math.ceil(chakra * 1.5);
  chakra += c.bonus.chakra || 0;
  const prontidao = skillTotal(c, "prontidao") ?? 0;
  let ini = prontidao + c.attrs.AGI + (c.bonus.ini || 0);
  if (hasApt(c, "diligente")) ini += 3;
  const agiDesloc = hasApt(c, "velocista") ? c.attrs.AGI * 2 : c.attrs.AGI;
  const desloc = 10 + ceilHalf(agiDesloc) + (c.bonus.desloc || 0);
  const esq = combatTotal(c, "ESQ");
  return {
    vit,
    chakra,
    ini,
    desloc,
    reacaoEsquiva: esq + 9,
    carga: Math.max(10, c.attrs.FOR * 10),
  };
}

/* ---------------- pontos gastos ---------------- */

export function spent(c: Character) {
  const attr = ATTRS.reduce((t, a) => t + (c.attrs[a.key] || 0), 0);
  const skill = SKILLS.reduce((t, s) => t + (c.skills[s.key] || 0), 0) + c.customSkills.reduce((t, s) => t + (s.pts || 0), 0);
  const powerLevels = c.poderes.reduce((t, p) => t + p.level, 0);
  const paidApts = c.aptidoes.filter((a) => !a.free).reduce((t, a) => t + a.level * APT_COST, 0);
  const freeUsed = c.aptidoes.filter((a) => a.free).length;
  const social = c.social.car + c.social.man;
  const ryos = c.items.reduce((t, i) => t + i.price * i.qty, 0);
  const comps = c.items.reduce((t, i) => t + i.comps, 0);
  return { attr, skill, power: powerLevels + paidApts, powerLevels, paidApts, freeUsed, social, ryos, comps };
}

/* ---------------- validação ---------------- */

export type Severity = "erro" | "aviso" | "ok";
export interface Issue {
  sev: Severity;
  step: string;
  text: string;
}

const ELEMENTS = ["doton", "fuuton", "katon", "raiton", "suiton"];
const NATURAL: Record<string, string> = {
  "elemento-natural-katon": "katon",
  "elemento-natural-suiton": "suiton",
  "elemento-natural-fuuton": "fuuton",
  "elemento-natural-terra": "doton",
};

export function validate(c: Character): Issue[] {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const out: Issue[] = [];
  const push = (sev: Severity, step: string, text: string) => out.push({ sev, step, text });

  // Atributos
  if (s.attr > b.attr) push("erro", "atributos", `Atributos: ${s.attr - b.attr} ponto(s) acima do limite.`);
  else if (s.attr < b.attr) push("aviso", "atributos", `Atributos: faltam ${b.attr - s.attr} ponto(s) para gastar.`);
  for (const a of ATTRS) {
    const v = c.attrs[a.key];
    if (v > c.nc) push("erro", "atributos", `${a.name} ${v} passa do máximo (NC ${c.nc}).`);
    if (v < b.minAttr) push("erro", "atributos", `${a.name} ${v} está abaixo do mínimo ${b.minAttr}.`);
  }

  // Habilidades de combate
  const moved = COMBAT.reduce((t, k) => t + Math.max(0, c.combatBase[k.key] - 3), 0);
  const removed = COMBAT.reduce((t, k) => t + Math.max(0, 3 - c.combatBase[k.key]), 0);
  if (moved !== removed) push("erro", "atributos", "Habilidades de combate: a soma dos valores base deve continuar 12.");
  if (moved > 2) push("erro", "atributos", "Habilidades de combate: só é possível mover até 2 pontos de valor base.");

  // Sociais
  if (s.social > b.social) push("erro", "atributos", `Sociais: ${s.social - b.social} ponto(s) acima de ${b.social}.`);
  if (c.social.car > b.cap || c.social.man > b.cap) push("erro", "atributos", `Carisma e Manipulação têm limite ${b.cap}.`);

  // Perícias
  if (s.skill > b.skill) push("erro", "pericias", `Perícias: ${s.skill - b.skill} ponto(s) acima do limite.`);
  else if (s.skill < b.skill) push("aviso", "pericias", `Perícias: faltam ${b.skill - s.skill} ponto(s) para gastar.`);
  for (const sk of SKILLS) {
    const pts = c.skills[sk.key] || 0;
    if (pts > b.cap) push("erro", "pericias", `${sk.name}: no máximo ${b.cap} pontos gastos (limite de poder).`);
    if (sk.needsQuimico && pts > 0 && !hasApt(c, "quimico")) push("erro", "pericias", "Venefício exige a aptidão Químico.");
  }
  for (const cs of c.customSkills) {
    if (!cs.name.trim()) push("aviso", "pericias", "Há uma perícia personalizada sem nome.");
    if (cs.pts > b.cap) push("erro", "pericias", `${cs.name || "Perícia"}: no máximo ${b.cap} pontos gastos.`);
  }

  // Aptidões
  const allowed = allowedRestricted(c);
  if (s.freeUsed > FREE_APTS) push("erro", "aptidoes", `Só ${FREE_APTS} aptidões podem ser gratuitas.`);
  else if (s.freeUsed < FREE_APTS) push("aviso", "aptidoes", `Você ainda tem ${FREE_APTS - s.freeUsed} aptidão(ões) gratuita(s).`);
  for (const e of c.aptidoes) {
    if (e.id === "custom") continue;
    const a = APT_BY_ID[e.id];
    if (!a) continue;
    if (c.optionals.aptidoesBanidas && BANNED_APTS.includes(a.id)) push("erro", "aptidoes", `${a.name} está banida pela regra opcional.`);
    if ((a.cat === "restrita" || a.cat === "especial") && !allowed.apts.has(a.id)) push("erro", "aptidoes", `${a.name} é restrita a outro clã/hijutsu.`);
    if (!reqsMet(c, a.req)) push("erro", "aptidoes", `${a.name}: pré-requisito não atendido (${a.reqText}).`);
    if (e.free && !isFreeEligible(a)) push("erro", "aptidoes", `${a.name} não pode ser escolhida como gratuita.`);
    if (a.maxLevel && e.level > a.maxLevel) push("erro", "aptidoes", `${a.name} vai até o nível ${a.maxLevel}.`);
    if (c.originId === "samurai" && a.cat === "shinobi") push("erro", "aptidoes", `Samurais não compram aptidões shinobi (${a.name}).`);
  }
  const dupes = new Map<string, number>();
  c.aptidoes.forEach((e) => {
    const a = APT_BY_ID[e.id];
    if (!a || a.generic) return;
    dupes.set(e.id, (dupes.get(e.id) ?? 0) + 1);
  });
  dupes.forEach((n, id) => n > 1 && push("erro", "aptidoes", `${APT_BY_ID[id].name} foi adicionada ${n} vezes (use o nível).`));

  // Poderes
  if (s.power > b.power) push("erro", "poderes", `Pontos de poder: ${s.power - b.power} acima do limite (${b.power}).`);
  else if (s.power < b.power) push("aviso", "poderes", `Pontos de poder: faltam ${b.power - s.power} para gastar.`);
  const naturals = new Set(Object.entries(NATURAL).filter(([apt]) => hasApt(c, apt)).map(([, el]) => el));
  const elems = c.poderes.filter((p) => ELEMENTS.includes(p.id) && !naturals.has(p.id));
  const elemLimit = c.attrs.ESP >= 10 ? 2 : 1;
  if (elems.length > elemLimit)
    push("erro", "poderes", `Afinidade elemental: ${elems.length} elementos; o limite é ${elemLimit}${elemLimit === 1 ? " (2 com Espírito 10)" : ""}.`);
  for (const p of c.poderes) {
    const def = PODER_BY_ID[p.id];
    const name = def?.name ?? p.customName ?? "Poder";
    if (p.level > b.cap) push("erro", "poderes", `${name} ${p.level} passa do limite de poder ${b.cap}.`);
    if (!def) continue;
    if (def.restricted && !allowed.powers.has(def.id)) push("erro", "poderes", `${def.name} é restrito a outro clã/hijutsu.`);
    if (!reqsMet(c, def.req)) push("erro", "poderes", `${def.name}: pré-requisito não atendido (${def.reqText}).`);
    if (c.originId === "samurai" && !def.restricted) push("erro", "poderes", `Samurais não compram poderes comuns (${def.name}).`);
    if (def.mode === "efeitos") {
      p.effects.slice(0, p.level).forEach((eid, i) => {
        if (!eid) return;
        const ef = EFEITO_BY_ID[eid];
        if (ef && ef.level > i + 1) push("erro", "poderes", `${def.name} nv ${i + 1}: ${ef.name} é de nível ${ef.level}.`);
      });
      const missing = p.effects.slice(0, p.level).filter((x) => !x).length + Math.max(0, p.level - p.effects.length);
      if (missing > 0) push("aviso", "poderes", `${def.name}: ${missing} efeito(s) por escolher.`);
    }
  }

  // Equipamento
  const ryosTotal = b.ryos + (c.extraRyos || 0);
  if (s.ryos > ryosTotal) push("aviso", "equipamento", `Equipamento custa ${s.ryos - ryosTotal} ryos a mais que o disponível.`);
  const compLimit = 3 + (hasApt(c, "burro-carga") ? 1 : 0);
  if (s.comps > compLimit) push("aviso", "equipamento", `${s.comps} compartimentos: acima de ${compLimit} o deslocamento cai 3m.`);

  if (!c.name.trim()) push("aviso", "conceito", "Dê um nome ao seu shinobi.");
  if (!c.originId && !hasApt(c, "trabalho-duro")) push("aviso", "cla", "Sem clã ou hijutsu: considere a aptidão Trabalho Duro.");

  // Modo livre: nada bloqueia, tudo vira lembrete.
  return c.optionals.livre ? out.map((i) => (i.sev === "erro" ? { ...i, sev: "aviso" as const } : i)) : out;
}

/* ---------------- ficha padrão ---------------- */

const zeroAttrs = (): Record<AttrKey, number> => ({ FOR: 0, DES: 0, AGI: 0, PER: 0, INT: 0, VIG: 0, ESP: 0 });
const zeroSkills = () => Object.fromEntries(SKILLS.map((s) => [s.key, 0])) as Record<SkillKey, number>;

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export function newCharacter(nc = 4): Character {
  const now = Date.now();
  const min = Math.max(0, Math.ceil((nc - 4) / 2));
  const attrs = zeroAttrs();
  (Object.keys(attrs) as AttrKey[]).forEach((k) => (attrs[k] = min));
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    name: "",
    player: "",
    age: "",
    gender: "",
    village: "",
    originVillage: "",
    alignment: "",
    appearance: "",
    personality: "",
    history: "",
    goals: "",
    nc,
    optionals: { tresPontosPoder: false, aptidoesBanidas: false, danoExtraAuto: false, multiHijutsu: false, livre: false },
    originId: null,
    originOption: 0,
    extraOrigins: [],
    customOrigin: { name: "", kind: "cla", kanji: "", desc: "", aptidoes: [], poderes: [] },
    attrs,
    combatBase: { CC: 3, CD: 3, ESQ: 3, LM: 3 },
    combatBonus: { CC: 0, CD: 0, ESQ: 0, LM: 0 },
    acuidade: true,
    social: { car: 0, man: 0 },
    skills: zeroSkills(),
    skillBonus: zeroSkills(),
    customSkills: [],
    aptidoes: [],
    poderes: [],
    items: [],
    extraRyos: 0,
    bonus: { vit: 0, chakra: 0, desloc: 0, ini: 0 },
    notes: "",
  };
}

/** Completa campos faltantes (fichas importadas de versões antigas). */
export function normalize(raw: Partial<Character>): Character {
  const base = newCharacter(raw.nc ?? 4);
  return {
    ...base,
    ...raw,
    optionals: { ...base.optionals, ...(raw.optionals ?? {}) },
    attrs: { ...base.attrs, ...(raw.attrs ?? {}) },
    combatBase: { ...base.combatBase, ...(raw.combatBase ?? {}) },
    combatBonus: { ...base.combatBonus, ...(raw.combatBonus ?? {}) },
    social: { ...base.social, ...(raw.social ?? {}) },
    skills: { ...base.skills, ...(raw.skills ?? {}) },
    skillBonus: { ...base.skillBonus, ...(raw.skillBonus ?? {}) },
    bonus: { ...base.bonus, ...(raw.bonus ?? {}) },
    aptidoes: raw.aptidoes ?? [],
    poderes: raw.poderes ?? [],
    items: raw.items ?? [],
    extraOrigins: raw.extraOrigins ?? [],
    customOrigin: { ...base.customOrigin, ...(raw.customOrigin ?? {}) },
    customSkills: raw.customSkills ?? [],
    id: raw.id ?? base.id,
  };
}
