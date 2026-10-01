import { APT_BY_ID, BANNED_APTS } from "./data/aptidoes";
import { ATTRS, COMBAT, RANKS, SKILLS } from "./data/base";
import { ORIGENS, ORIGIN_BY_ID } from "./data/origens";
import { EFEITO_BY_ID, EXCLUSIVOS, KEKKEI_ELEMENTOS, NINPOU_BASE, PODER_BY_ID, VERSATEIS } from "./data/poderes";
import { validateKuchiyose } from "./kuchiyose";
import type { AptEntry, Aptidao, AttrKey, Character, CombatKey, Optionals, PowerEntry, Req, SkillKey } from "./types";

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

/** NCs que dão pontos de poder extras: o 20 é o bônus de Kage do livro, os demais são regra da mesa. */
export const POWER_BONUS_NCS = [20, 24, 27, 30];
export const POWER_BONUS = 4;

/** Pontos de poder extras acumulados até o NC (com 3 pontos por NC, o bônus do NC 20 vira +6, como no Guia). */
export function powerBonusFor(nc: number, opt: Pick<Optionals, "tresPontosPoder">): number {
  return POWER_BONUS_NCS.filter((x) => nc >= x).reduce((t, x) => t + (x === 20 && opt.tresPontosPoder ? 6 : POWER_BONUS), 0);
}

/**
 * Tabela de evolução estendida até NC 30.
 * Cada NC acima de 4 soma +6 atributos, +4 perícias e +2 poderes (3 com a regra do Guia).
 * NC 20, 24, 27 e 30 dão +4 pontos de poder além do normal. O mínimo de atributo sobe 1 a cada NC ímpar.
 */
export function budgetFor(nc: number, opt: Optionals): Budget {
  const n = Math.min(NC_MAX, Math.max(NC_MIN, Math.round(nc)));
  const steps = n - NC_MIN;
  let power = opt.tresPontosPoder ? 6 + 3 * steps : 4 + 2 * steps;
  power += powerBonusFor(n, opt);
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

/** Aptidões recebidas de graça por outra (ex.: as 2 de técnica da Técnica Avançada). */
export function grantedApts(c: Character): string[] {
  return c.aptidoes.flatMap((e) => (APT_BY_ID[e.id]?.grants ? (e.choices ?? []).filter(Boolean) : []));
}

export function aptLevel(c: Character, id: string): number {
  const lvl = c.aptidoes.filter((a) => a.id === id).reduce((m, a) => Math.max(m, a.level), 0);
  return lvl || (grantedApts(c).includes(id) ? 1 : 0);
}
export const hasApt = (c: Character, id: string, level = 1) => aptLevel(c, id) >= level;

/**
 * Pontos de poder gastos numa aptidão. Cada nível de uma aptidão evolutiva é uma nova compra (Livro Básico, pág. 57),
 * inclusive numa aptidão gratuita: a gratuidade cobre só o nível 1. Aptidões com `levelsFree` (Kurohigi) são compradas uma vez.
 */
export function aptCost(e: AptEntry): number {
  const buys = APT_BY_ID[e.id]?.levelsFree ? 1 : Math.max(1, e.level);
  return (buys - (e.free ? 1 : 0)) * APT_COST;
}

export function powerLevel(c: Character, id: string): number {
  const comprado = c.poderes.filter((p) => p.id === id).reduce((m, p) => Math.max(m, p.level), 0);
  // Kekkei genkai de elemento: 1 nível grátis em cada elemento que a forma.
  return comprado || (kekkeiDe(c, id) ? 1 : 0);
}

/** Elementos grátis das kekkei genkai da ficha, com o nível da kekkei genkai (o Canhão usa esse nível). */
export function kekkeiGratis(c: Character): { el: string; from: string; lvl: number }[] {
  const out: { el: string; from: string; lvl: number }[] = [];
  for (const [k, v] of Object.entries(KEKKEI_ELEMENTOS)) {
    const lvl = c.poderes.filter((p) => p.id === k).reduce((m, p) => Math.max(m, p.level), 0);
    if (!lvl) continue;
    for (const el of v.gratis) {
      const cur = out.find((x) => x.el === el);
      if (!cur) out.push({ el, from: k, lvl });
      else if (lvl > cur.lvl) Object.assign(cur, { from: k, lvl });
    }
  }
  return out;
}

/** Kekkei genkai da ficha que dá o elemento de graça (a de nível mais alto), ou null. */
export const kekkeiDe = (c: Character, el: string) => kekkeiGratis(c).find((x) => x.el === el)?.from ?? null;

/** A compra `idx` é a 1ª do elemento que uma kekkei genkai dá: o nível 1 dela não custa pontos. Devolve a kekkei genkai. */
export function nivelGratis(c: Character, idx: number): string | null {
  const p = c.poderes[idx];
  if (c.poderes.findIndex((x) => x.id === p.id) !== idx) return null;
  return kekkeiDe(c, p.id);
}

/** Evolução mais alta que o nível `lvl` permite para o efeito (0 = nenhuma). */
export const reachEvolution = (effectId: string, lvl: number) => (EFEITO_BY_ID[effectId]?.evolves ?? []).filter((l) => l <= lvl).length;

/**
 * Evolução com que o efeito entra na 1ª escolha, no nível `lvl`. Pelo livro, nenhuma. Na regra opcional de pular
 * evoluções, já entra na mais alta que o nível permite, com as anteriores junto (Lâmina de Raios no nível 9 = Nv 9).
 */
export const firstEvolution = (effectId: string, lvl: number, pular: boolean) => (pular ? reachEvolution(effectId, lvl) : 0);

/**
 * Evolução que uma repetição do efeito alcança, escolhida no nível `lvl` depois da evolução `ev`. Pelo livro, é sempre a
 * seguinte (não se pulam evoluções). Na regra opcional, vai direto à mais alta que o nível permite, com as anteriores junto.
 */
export function nextEvolution(effectId: string, ev: number, lvl: number, pular: boolean): number {
  return pular ? Math.max(ev + 1, reachEvolution(effectId, lvl)) : ev + 1;
}

/** Evolução do efeito escolhido no nível `i + 1` desta compra (0 = efeito novo, 1 = 1ª evolução…). */
export function evolutionIndex(effects: (string | null)[], i: number, pular = false): number {
  const id = effects[i];
  if (!id) return 0;
  let ev = -1;
  for (let j = 0; j <= i; j++) if (effects[j] === id) ev = ev < 0 ? firstEvolution(id, j + 1, pular) : nextEvolution(id, ev, j + 1, pular);
  return ev;
}

/** Nível do poder exigido pela evolução `k` do efeito (1 = 1ª evolução), ou null se não existe. */
export function evolutionLevel(effectId: string, k: number): number | null {
  return EFEITO_BY_ID[effectId]?.evolves?.[k - 1] ?? null;
}

/** Compra repetida de um poder de efeitos (a 2ª compra em diante tem o nível 1 gratuito). */
export function isRepurchase(c: Character, idx: number): boolean {
  const p = c.poderes[idx];
  return PODER_BY_ID[p.id]?.mode === "efeitos" && c.poderes.slice(0, idx).some((x) => x.id === p.id);
}

/* ---------------- Versatilidade (Livro Básico, pág. 242–243) ---------------- */

/** Nome curto do poder versátil (ex.: "Katon Versátil"). */
export const versatileName = (id: string) => `${(PODER_BY_ID[id]?.name ?? id).split(" (")[0]} Versátil`;

/** Nível de Versatilidade que conta como nível do poder versátil nos pré-requisitos (ex.: Versatilidade 5 com Suiton Versátil cumpre Suiton 5). */
export function versatileLevel(c: Character, id: string): number {
  return c.poderes.filter((p) => p.id === "versatilidade" && p.versatile?.includes(id)).reduce((m, p) => Math.max(m, p.level), 0);
}

/**
 * Quantos poderes versáteis a compra de Versatilidade na posição `idx` de `c.poderes` traz. Regra da casa: a 4ª compra
 * traz 3 poderes e pode repetir os de outras compras; as demais seguem o livro (2 poderes novos).
 */
export function versatileSlots(c: Character, idx: number): number {
  return isFourthVersatile(c, idx) ? 3 : 2;
}

/** A compra na posição `idx` é a 4ª Versatilidade da ficha. */
export function isFourthVersatile(c: Character, idx: number): boolean {
  return c.poderes[idx]?.id === "versatilidade" && c.poderes.slice(0, idx).filter((p) => p.id === "versatilidade").length === 3;
}

/** Escolha de um nível de poder de técnicas prontas usado como versátil (Fuuinjutsu): índice da técnica. */
export const tecId = (i: number) => `tec:${i}`;
export const tecIndex = (id: string | null | undefined) => (id?.startsWith("tec:") ? Number(id.slice(4)) : -1);

export interface VersatilePick {
  /** Nível da Versatilidade em que foi escolhido. */
  level: number;
  eff: string | null;
  /** 0 = efeito novo; 1 = 1ª evolução… */
  ev: number;
  tech: string;
  /** Recebido no nível 1 (vale para os dois poderes versáteis). */
  auto?: boolean;
}

/**
 * O que um poder versátil (índice `k`) ganhou em cada nível. O nível 1 dá o efeito de nível 1 a todos (Canhão, ou a técnica
 * de nível 1 num poder de técnicas); do 2º em diante, cada nível é de um deles.
 */
export function versatilePicks(p: PowerEntry, k: number, pular = false): VersatilePick[] {
  const id = p.versatile?.[k];
  if (!id) return [];
  const tec = PODER_BY_ID[id]?.mode === "tecnicas";
  const out: VersatilePick[] = [{ level: 1, eff: tec ? tecId(0) : "canhao", ev: 0, tech: p.techniques[0] ?? "", auto: true }];
  for (let i = 1; i < p.level; i++) {
    if (p.owner?.[i] !== k) continue;
    const eff = p.effects[i] ?? null;
    const prev = eff && !tec ? out.findLast((x) => x.eff === eff) : undefined;
    const ev = !eff || tec ? 0 : prev ? nextEvolution(eff, prev.ev, i + 1, pular) : firstEvolution(eff, i + 1, pular);
    out.push({ level: i + 1, eff, ev, tech: p.techniques[i] ?? "" });
  }
  return out;
}

/**
 * Técnicas (índices em `techniques`) que um poder versátil de técnicas prontas (Fuuinjutsu) tem. Pelo livro, só as
 * escolhidas em cada nível: pular um nível de técnica perde a técnica. Na regra opcional da lista, cada nível recebido
 * traz todas as técnicas até ele, inclusive as que ficaram para trás (como no Fuuinjutsu comum).
 */
export function versatileTechs(p: PowerEntry, k: number, lista: boolean): number[] {
  const techs = PODER_BY_ID[p.versatile?.[k] ?? ""]?.techniques ?? [];
  const picks = versatilePicks(p, k);
  if (!lista) return [...new Set(picks.map((x) => tecIndex(x.eff)).filter((n) => techs[n]))];
  const top = picks.reduce((m, x) => (x.eff ? Math.max(m, x.level) : m), 0);
  return techs.flatMap((t, n) => (t.level <= top ? [n] : []));
}

/**
 * Controle Perfeito (Livro Básico, Tensai): Inteligência no lugar do Espírito em todos os parâmetros de poderes e
 * aptidões (dano, tamanho, alcance, dificuldade, custo…). Troca tudo junto e não vale para pré-requisitos.
 */
export function espParam(c: Character, attrs: Record<AttrKey, number> = c.attrs): { label: "Esp" | "Int"; val: number } {
  return hasApt(c, "controle-perfeito") && attrs.INT > attrs.ESP ? { label: "Int", val: attrs.INT } : { label: "Esp", val: attrs.ESP };
}

/** Escolha do Talento Natural: poder (versátil ou Hibon) e efeito que ganha com todas as evoluções. */
export function talentoNatural(c: Character): { target: string; eff: string } | null {
  const e = c.aptidoes.find((a) => a.id === "talento-natural");
  const [target, eff] = e?.choices ?? [];
  return target && eff ? { target, eff } : null;
}

/** Poderes que podem receber o Talento Natural: versáteis de efeitos e Hibon Ninpou. */
export function talentoTargets(c: Character): string[] {
  const vs = c.poderes.filter((p) => p.id === "versatilidade").flatMap((p) => p.versatile ?? []);
  const out = [...new Set(vs)].filter((id) => PODER_BY_ID[id]?.mode === "efeitos");
  if (powerLevel(c, "hibon") > 0) out.push("hibon");
  return out;
}

/** Efeitos que o Talento Natural pode dar a um poder: os do poder que não são exclusivos de elemento. */
export const talentoEffects = (target: string) => (PODER_BY_ID[target]?.effects ?? NINPOU_BASE).filter((id) => !EXCLUSIVOS.includes(id));

/* ---------------- Clã Uchiha (Livro Básico, pág. 180–187) ---------------- */

/** Pares de técnicas do Mangekyou Sharingan, uma em cada olho. O Susanoo vem ao dominar as duas. */
export const MANGEKYOU_PARES = [
  { k: "tsukuyomi", label: "Tsukuyomi e Amaterasu", tecs: ["tsukuyomi", "amaterasu"] },
  { k: "kagutsuchi", label: "Kagutsuchi e Amaterasu", tecs: ["amaterasu", "kagutsuchi"] },
  { k: "kamui", label: "Kamui (curto e longo alcance)", tecs: ["kamui"] },
] as const;

const MANGEKYOU_NOME: Record<string, string> = { amaterasu: "Amaterasu", tsukuyomi: "Tsukuyomi", kagutsuchi: "Kagutsuchi", kamui: "Kamui", susanoo: "Susanoo" };

/** Poderes que não são de ninjutsu (o Kamui pede nível 8 num poder de ninjutsu). */
const NAO_NINJUTSU = ["hachimon", "juuken", "shikakyu", "magen", "jinchuuriki", "senninka"];

/** Maior nível entre os poderes de ninjutsu da ficha. */
export function ninjutsuLevel(c: Character): number {
  return c.poderes.filter((p) => PODER_BY_ID[p.id] && !NAO_NINJUTSU.includes(p.id)).reduce((m, p) => Math.max(m, p.level), 0);
}

/** Nível de Katon para as técnicas do Uchiha (o Katon Versátil conta). */
export const katonLevel = (c: Character) => Math.max(powerLevel(c, "katon"), versatileLevel(c, "katon"));

export interface MangekyouTec {
  id: string;
  name: string;
  /** Já despertou: cumpre os pré-requisitos da técnica. */
  ok: boolean;
  falta: string[];
}

function mangekyouTec(c: Character, id: string): MangekyouTec {
  const falta: string[] = [];
  if ((id === "amaterasu" || id === "kagutsuchi") && katonLevel(c) < 8) falta.push("Katon 8");
  if (id === "tsukuyomi") {
    if (!hasApt(c, "fascinar")) falta.push("Fascinar");
    if (!hasApt(c, "ilusao-profunda")) falta.push("Ilusão Profunda");
    if (c.attrs.INT < 16) falta.push("Inteligência 16");
  }
  if (id === "kamui" && ninjutsuLevel(c) < 8) falta.push("nível 8 num poder de ninjutsu");
  return { id, name: MANGEKYOU_NOME[id], ok: !falta.length, falta };
}

/**
 * Mangekyou Sharingan da ficha: o par de técnicas escolhido (na variante da aptidão) e o Susanoo, cada um liberado
 * ou com o que falta. As técnicas são aprendidas ao cumprir os pré-requisitos; o Susanoo, ao dominar as duas.
 */
export function mangekyou(c: Character) {
  const e = c.aptidoes.find((a) => a.id === "mangekyou");
  if (!e) return null;
  const par = MANGEKYOU_PARES.find((x) => x.k === e.variant);
  const tecs = (par?.tecs ?? []).map((id) => mangekyouTec(c, id));
  const dominou = !!par && tecs.every((t) => t.ok);
  const susanoo: MangekyouTec = { id: "susanoo", name: "Susanoo", ok: dominou, falta: dominou ? [] : [par ? "dominar o par de técnicas" : "escolher o par de técnicas"] };
  return { par, tecs, susanoo, eterno: hasApt(c, "eien-mangekyou") };
}

/** A técnica do Mangekyou (ou o Susanoo) já despertou. */
export function hasMangekyouTec(c: Character, id: string): boolean {
  const m = mangekyou(c);
  return !!m && [...m.tecs, m.susanoo].some((t) => t.id === id && t.ok);
}

/** Custo em pontos de visão: o Mangekyou Eterno não paga (Livro Básico, pág. 184). */
export const custoVisao = (c: Character, n: number) => (hasApt(c, "eien-mangekyou") ? 0 : n);

/** Hipnose Sharingan: Sandan Sharingan, Fascinar e Ilusão Profunda. */
export const hasHipnose = (c: Character) => hasApt(c, "sandan-sharingan") && hasApt(c, "fascinar") && hasApt(c, "ilusao-profunda");

/** Mímica Sharingan: 1 técnica copiada para cada 4 pontos completos de Inteligência (máximo 5). */
export const mimicaCopias = (c: Character) => Math.min(5, Math.floor(c.attrs.INT / 4));

export const isUchiha = (c: Character) => c.originId === "uchiha" || c.extraOrigins.includes("uchiha");

/* ---------------- totais ---------------- */

/** Precisão vinda de aptidões: Reflexos, Intuição e a penalidade da Resiliência. Não conta para pré-requisitos. */
function aptCombatMod(c: Character, k: CombatKey): number {
  if (k === "ESQ") return (hasApt(c, "reflexos") ? 1 : 0) - (hasApt(c, "resiliencia") ? 3 : 0);
  if (k === "LM") return hasApt(c, "intuicao") ? 1 : 0;
  return 0;
}

/** Bônus de Esquiva da ficha (Reflexos e bônus positivos em "Outros"), perdidos quando desprevenido ou sem poder se mover. */
export const esqBonus = (c: Character) => (hasApt(c, "reflexos") ? 1 : 0) + Math.max(0, c.combatBonus.ESQ || 0);

export function combatTotal(c: Character, k: CombatKey): number {
  const def = COMBAT.find((x) => x.key === k)!;
  let attr = c.attrs[def.attr];
  if (k === "CC" && c.acuidade && hasApt(c, "acuidade")) attr = Math.max(attr, c.attrs.DES);
  return c.combatBase[k] + attr + (c.combatBonus[k] || 0) + aptCombatMod(c, k);
}

/** Resiliência (clã Akimichi): −3 de precisão em Acrobacia e Furtividade. */
const RESILIENCIA_SKILLS: SkillKey[] = ["acrobacia", "furtividade"];

/** Valor de perícia, ou null se é treinada e não recebeu pontos. */
export function skillTotal(c: Character, k: SkillKey): number | null {
  const def = SKILLS.find((s) => s.key === k)!;
  const pts = c.skills[k] || 0;
  if (def.trained && pts <= 0) return null;
  const resil = RESILIENCIA_SKILLS.includes(k) && hasApt(c, "resiliencia") ? 3 : 0;
  return ceilHalf(c.attrs[def.attr]) + pts + (c.skillBonus[k] || 0) - resil;
}

/** Testes sociais: Carisma ou Manipulação + metade do atributo ou perícia (Livro Básico, pág. 53–55). */
export function socialTests(c: Character) {
  const { car, man } = c.social;
  const arte = ceilHalf(skillTotal(c, "arte") ?? 0);
  const per = ceilHalf(c.attrs.PER);
  const int = ceilHalf(c.attrs.INT);
  return [
    { name: "Atuação", formula: "Carisma + ½ Arte", v: car + arte },
    { name: "Barganha", formula: "Carisma + ½ Percepção", v: car + per },
    { name: "Blefar", formula: "Manipulação + ½ Inteligência", v: man + int, alt: `com Carisma: ${car + int} (Dif +3 inamistoso, +6 hostil; −3 amistoso, −6 prestativo)` },
    { name: "Intimidação", formula: "Manipulação + ½ Percepção", v: man + per },
    { name: "Mudar Atitude", formula: "Manipulação + ½ Percepção", v: man + per, alt: `com Carisma, só para melhorar: ${car + per}` },
    { name: "Obter Informação", formula: "Carisma + ½ Inteligência", v: car + int },
  ];
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
      return Math.max(powerLevel(c, r.id), versatileLevel(c, r.id)) >= r.min;
    case "effect":
      return c.poderes.some((p) => p.effects.slice(0, p.level).includes(r.id));
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
    case "effect":
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

/** Clãs e hijutsus do catálogo que liberam uma aptidão ou poder restrito. */
export function restrictedOwners(kind: "aptidoes" | "poderes", id: string): string[] {
  return ORIGENS.filter((o) => o.options.some((x) => x[kind].includes(id))).map((o) => o.name);
}

/** Texto curto de onde vem uma aptidão/poder restrito, para as observações. */
export function ownersText(kind: "aptidoes" | "poderes", id: string): string {
  const names = restrictedOwners(kind, id);
  if (!names.length) return "outro clã/hijutsu";
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} e outros` : names.join(", ");
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

/** Benefícios do Chakra Expandido: pela aptidão ou pelo Chakra Bijuu do Jinchuuriki nível 1 (não acumulam). */
export const hasChakraExpandido = (c: Character) => hasApt(c, "chakra-expandido") || powerLevel(c, "jinchuuriki") >= 1;

/** Compartimentos sem penalidade: 3; com Burro de Carga, 4, 5 com Força 8 e 6 com Força 12 (Guia Avançado). */
export function compLimit(c: Character): number {
  if (!hasApt(c, "burro-carga")) return 3;
  const f = c.attrs.FOR;
  return f >= 12 ? 6 : f >= 8 ? 5 : 4;
}

/** Compartimentos acima do limite: cada um dá −3m de deslocamento e −1 de precisão (Livro Básico, pág. 126). */
export const extraComps = (c: Character) => Math.max(0, c.items.reduce((t, i) => t + i.comps, 0) - compLimit(c));

export function derived(c: Character) {
  const vig = c.attrs.VIG;
  let vit = 10 + 3 * vig + 5 * c.nc;
  if (hasApt(c, "corpulencia")) vit += 3 * vig;
  vit += c.bonus.vit || 0;
  let chakra = 10 + 3 * c.attrs.ESP;
  if (hasChakraExpandido(c)) chakra = Math.ceil(chakra * 1.5);
  if (hasApt(c, "controle-perfeito", 2)) chakra += c.attrs.INT;
  // Rinnegan: doujutsu permanente, reduz o chakra total em 10% (Livro de Hijutsus).
  if (hasApt(c, "rinnegan")) chakra = Math.ceil(chakra * 0.9);
  chakra += c.bonus.chakra || 0;
  const prontidao = skillTotal(c, "prontidao") ?? 0;
  let ini = prontidao + c.attrs.AGI + (c.bonus.ini || 0);
  if (hasApt(c, "diligente")) ini += 3;
  const resil = hasApt(c, "resiliencia");
  const agiDesloc = hasApt(c, "velocista") ? c.attrs.AGI * 2 : c.attrs.AGI;
  const comps = extraComps(c);
  const desloc = Math.max(0, 10 + ceilHalf(agiDesloc) - (resil ? 5 : 0) - 3 * comps + (c.bonus.desloc || 0));
  const esq = combatTotal(c, "ESQ");
  return {
    vit,
    chakra,
    ini,
    desloc,
    reacaoEsquiva: esq + 9,
    carga: Math.max(10, c.attrs.FOR * 10),
    /** Resiliência: dureza de corpo 1 a cada 4 pontos completos de Vigor (tamanho não conta). */
    dureza: resil ? Math.floor(vig / 4) : 0,
    extraComps: comps,
  };
}

/* ---------------- pontos gastos ---------------- */

export function spent(c: Character) {
  const attr = ATTRS.reduce((t, a) => t + (c.attrs[a.key] || 0), 0);
  const skill = SKILLS.reduce((t, s) => t + (c.skills[s.key] || 0), 0) + c.customSkills.reduce((t, s) => t + (s.pts || 0), 0);
  // Comprar o mesmo poder de novo: o nível 1 da nova compra é gratuito (Livro Básico, pág. 95). O 1º nível de um
  // elemento que a kekkei genkai já dá também.
  const powerLevels = c.poderes.reduce((t, p, i) => t + p.level - (isRepurchase(c, i) || nivelGratis(c, i) ? 1 : 0), 0);
  const paidApts = c.aptidoes.reduce((t, a) => t + aptCost(a), 0);
  const freeUsed = c.aptidoes.filter((a) => a.free).length;
  const social = c.social.car + c.social.man;
  const ryos = c.items.reduce((t, i) => t + i.price * i.qty, 0);
  const comps = c.items.reduce((t, i) => t + i.comps, 0);
  return { attr, skill, power: powerLevels + paidApts, powerLevels, paidApts, freeUsed, social, ryos, comps };
}

/* ---------------- validação ---------------- */

/** "erro" = fora das regras normais (só observação: nada é bloqueado); "aviso" = algo em aberto. */
export type Severity = "erro" | "aviso" | "ok";
export interface Issue {
  sev: Severity;
  step: string;
  text: string;
}

const ELEMENTS = ["doton", "fuuton", "katon", "raiton", "suiton"];
/** Aptidões Especiais do Tensai que o catálogo guarda como restritas de clã. */
const TENSAI_SPECIAL = ["presa-prata", "vontade-fogo", "maximizar"];
const NATURAL: Record<string, string> = {
  "elemento-natural-katon": "katon",
  "elemento-natural-suiton": "suiton",
  "elemento-natural-fuuton": "fuuton",
  "elemento-natural-terra": "doton",
};

/** Regras da Versatilidade, da Aprendizagem Rápida e do Talento Natural (Livro Básico, pág. 242–243). */
function validateVersatilidade(c: Character, push: (sev: Severity, step: string, text: string) => void) {
  const vs = c.poderes.filter((p) => p.id === "versatilidade");
  const extra = c.aptidoes.filter((a) => a.id === "aprendizagem-rapida").length;
  if (vs.length > 1 + extra)
    push("erro", "poderes", `Versatilidade comprada ${vs.length} vezes: cada compra além da 1ª pede uma Aprendizagem Rápida (você tem ${extra}).`);
  const seen = new Set<string>();
  vs.forEach((p, n) => {
    const tag = vs.length > 1 ? `Versatilidade (${n + 1}ª compra)` : "Versatilidade";
    // Regra da casa: a 4ª compra traz 3 poderes versáteis e pode repetir os de outras compras.
    const fourth = n === 3;
    const slots = fourth ? 3 : 2;
    const vv = (p.versatile ?? []).slice(0, slots).filter(Boolean);
    if (vv.length < slots) push("aviso", "poderes", `${tag}: escolha os ${slots === 3 ? "três" : "dois"} poderes versáteis.`);
    if (new Set(vv).size < vv.length) push("erro", "poderes", `${tag}: os poderes versáteis da mesma compra precisam ser diferentes.`);
    for (const id of new Set(vv)) {
      if (!VERSATEIS.includes(id)) push("erro", "poderes", `${tag}: ${PODER_BY_ID[id]?.name ?? id} não pode ser versátil.`);
      if (fourth) continue;
      if (seen.has(id)) push("erro", "poderes", `${tag}: ${versatileName(id)} já é versátil em outra compra (cada compra traz dois poderes novos).`);
      seen.add(id);
    }
    let missing = 0;
    let run = 0;
    let last: number | null = null;
    for (let i = 1; i < p.level; i++) {
      const k = p.owner?.[i];
      const lvl = i + 1;
      if (typeof k !== "number" || k < 0 || k >= slots) {
        missing++;
        run = 0;
        last = null;
        continue;
      }
      run = k === last ? run + 1 : 1;
      last = k;
      const id = p.versatile?.[k];
      if (!id) continue;
      if (run > 2) push("erro", "poderes", `${tag}: o nível ${lvl} é o 3º seguido de ${versatileName(id)}; depois de 2 seguidos, o próximo é de outro poder.`);
      const eff = p.effects[i];
      if (!eff) {
        missing++;
        continue;
      }
      const def = PODER_BY_ID[id];
      if (def?.mode === "tecnicas") {
        const t = def.techniques?.[tecIndex(eff)];
        if (!t) missing++;
        else if (t.level > lvl) push("erro", "poderes", `${tag}: ${t.name} é de nível ${t.level}, acima do nível ${lvl} em que foi escolhida.`);
        continue;
      }
      const ef = EFEITO_BY_ID[eff];
      if (!ef || !(def?.effects ?? NINPOU_BASE).includes(eff)) {
        push("erro", "poderes", `${tag}: ${ef?.name ?? eff} não é um efeito de ${versatileName(id)}.`);
        continue;
      }
      const vp = versatilePicks(p, k, c.optionals.pularEvolucoes);
      const ev = vp.find((x) => x.level === lvl)?.ev ?? 0;
      // O nível de Versatilidade substitui o nível do poder, não os atributos.
      if (!vp.some((x) => x.eff === eff && x.level < lvl) && !reqsMet(c, ef.req)) push("erro", "poderes", `${tag}: ${ef.name} (${versatileName(id)}) pede ${ef.reqText}.`);
      if (!ev) {
        if (ef.level > lvl) push("erro", "poderes", `${tag}: ${ef.name} é de nível ${ef.level}, acima do nível ${lvl} em que foi escolhido.`);
        continue;
      }
      const need = evolutionLevel(eff, ev);
      if (need === null) push("erro", "poderes", `${tag}: ${ef.name} não tem ${ev > 1 ? `${ev}ª ` : ""}evolução.`);
      else if (need > lvl) push("erro", "poderes", `${tag}: a evolução ${ef.name} Nv ${need} só pode ser escolhida no nível ${need} ou depois.`);
    }
    if (missing) push("aviso", "poderes", `${tag}: ${missing} nível(is) sem poder versátil ou efeito escolhido.`);
  });

  if (hasApt(c, "talento-natural")) {
    const tn = talentoNatural(c);
    if (!tn) push("aviso", "aptidoes", "Talento Natural: escolha o poder e o efeito.");
    else {
      if (!talentoTargets(c).includes(tn.target)) push("erro", "aptidoes", `Talento Natural: ${PODER_BY_ID[tn.target]?.name ?? tn.target} não é um poder versátil nem Hibon Ninpou da ficha.`);
      if (!talentoEffects(tn.target).includes(tn.eff)) push("erro", "aptidoes", `Talento Natural: ${EFEITO_BY_ID[tn.eff]?.name ?? tn.eff} não serve (efeito exclusivo ou de outro poder).`);
    }
  }
}

/** Exigência de elemento do clã, Elemento Natural: Katon e o par de técnicas do Mangekyou. */
function validateUchiha(c: Character, push: (sev: Severity, step: string, text: string) => void) {
  const natural = hasApt(c, "elemento-natural-katon");
  if (isUchiha(c) && !natural && katonLevel(c) === 0)
    push("erro", "aptidoes", "Clã Uchiha: é obrigatório ter o poder Katon ou a aptidão Elemento Natural: Katon desde a criação.");
  if (natural && c.poderes.some((p) => p.id === "katon" && p.effects.slice(0, p.level).includes("sopro")))
    push("aviso", "poderes", "Katon: o Elemento Natural: Katon já dá o Sopro Destrutivo no nível 4 (e evolui sozinho no 7 e no 10). Troque essa escolha por outro efeito.");
  const m = mangekyou(c);
  if (!m) return;
  if (!m.par) return push("aviso", "aptidoes", "Mangekyou Sharingan: escolha o par de técnicas dos olhos.");
  const pend = [...m.tecs, m.susanoo].filter((t) => !t.ok);
  if (pend.length) push("aviso", "aptidoes", `Mangekyou Sharingan: ainda não despertou ${pend.map((t) => `${t.name} (falta ${t.falta.join(", ")})`).join("; ")}.`);
}

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
    if ((a.cat === "restrita" || a.cat === "especial") && !allowed.apts.has(a.id)) push("erro", "aptidoes", `${a.name} é restrita a: ${ownersText("aptidoes", a.id)}.`);
    if (!reqsMet(c, a.req)) push("erro", "aptidoes", `${a.name}: pré-requisito não atendido (${a.reqText}).`);
    if (e.free && !isFreeEligible(a)) push("erro", "aptidoes", `${a.name} normalmente não pode ser uma das gratuitas.`);
    if (e.level > (a.maxLevel ?? 1)) push("erro", "aptidoes", a.maxLevel ? `${a.name} vai até o nível ${a.maxLevel}.` : `${a.name} não tem níveis.`);
    a.levels?.slice(0, e.level - 1).forEach((l, i) => {
      if (!reqsMet(c, l.req)) push("erro", "aptidoes", `${a.name} nível ${i + 2}: pré-requisito não atendido (${l.reqText}).`);
    });
    if (c.originId === "samurai" && a.cat === "shinobi") push("erro", "aptidoes", `Samurais não compram aptidões shinobi (${a.name}).`);
    if (a.grants) {
      const picks = (e.choices ?? []).filter(Boolean);
      const catLabel = a.grants.cat === "tecnica" ? "de técnica" : a.grants.cat;
      if (picks.length < a.grants.n) push("aviso", "aptidoes", `${a.name}: escolha ${a.grants.n - picks.length} aptidão(ões) ${catLabel} gratuita(s).`);
      if (new Set(picks).size < picks.length) push("erro", "aptidoes", `${a.name}: a mesma aptidão foi escolhida duas vezes.`);
      for (const id of new Set(picks)) {
        const g = APT_BY_ID[id];
        if (!g) continue;
        if (g.cat !== a.grants.cat) push("erro", "aptidoes", `${a.name}: ${g.name} não é uma aptidão ${catLabel}.`);
        if (!reqsMet(c, g.req)) push("erro", "aptidoes", `${a.name}: ${g.name} pede ${g.reqText}.`);
        if (c.aptidoes.some((x) => x.id === id)) push("aviso", "aptidoes", `${g.name} já está comprada; pela ${a.name} escolha outra e economize os pontos.`);
      }
    }
  }
  const dupes = new Map<string, number>();
  c.aptidoes.forEach((e) => {
    const a = APT_BY_ID[e.id];
    if (!a || a.generic || a.repeatable) return;
    dupes.set(e.id, (dupes.get(e.id) ?? 0) + 1);
  });
  dupes.forEach((n, id) => n > 1 && push("erro", "aptidoes", `${APT_BY_ID[id].name} foi adicionada ${n} vezes (use o nível).`));
  const especiais = c.aptidoes.filter((e) => APT_BY_ID[e.id]?.cat === "especial" || TENSAI_SPECIAL.includes(e.id));
  if (new Set(especiais.map((e) => e.id)).size > 2) push("erro", "aptidoes", "Tensai dá direito a no máximo 2 Aptidões Especiais diferentes.");

  // Poderes
  if (s.power > b.power) push("erro", "poderes", `Pontos de poder: ${s.power - b.power} acima do limite (${b.power}).`);
  else if (s.power < b.power) push("aviso", "poderes", `Pontos de poder: faltam ${b.power - s.power} para gastar.`);
  const naturals = new Set(Object.entries(NATURAL).filter(([apt]) => hasApt(c, apt)).map(([, el]) => el));
  // Elementos que a kekkei genkai dá não contam na afinidade.
  for (const g of kekkeiGratis(c)) naturals.add(g.el);
  const elems = c.poderes.filter((p) => ELEMENTS.includes(p.id) && !naturals.has(p.id));
  // Restrição de Elemento: com a kekkei genkai, só ela e os elementos que a formam.
  const restritas = Object.keys(KEKKEI_ELEMENTOS).filter((k) => KEKKEI_ELEMENTOS[k].restrito && c.poderes.some((p) => p.id === k));
  if (restritas.length) {
    const ok = new Set(restritas.flatMap((k) => [k, ...KEKKEI_ELEMENTOS[k].gratis]));
    const fora = new Set(c.poderes.filter((p) => (ELEMENTS.includes(p.id) || p.id in KEKKEI_ELEMENTOS) && !ok.has(p.id)).map((p) => p.id));
    const nome = (id: string) => (PODER_BY_ID[id]?.name ?? id).split(" (")[0];
    if (fora.size) push("erro", "poderes", `Restrição de Elemento: com ${restritas.map(nome).join(" e ")}, só se aprende ${[...ok].map(nome).join(", ")} (fora: ${[...fora].map(nome).join(", ")}).`);
  }
  // Mímica Sharingan (Nidan Sharingan): Novo Elemento dá uma afinidade elemental a mais.
  const novoElemento = hasApt(c, "nidan-sharingan");
  const elemLimit = (c.attrs.ESP >= 10 ? 2 : 1) + (novoElemento ? 1 : 0);
  if (elems.length > elemLimit)
    push(
      "erro",
      "poderes",
      `Afinidade elemental: ${elems.length} elementos; o limite é ${elemLimit}${c.attrs.ESP < 10 ? " (+1 com Espírito 10)" : ""}${novoElemento ? ", já com o Novo Elemento do Nidan Sharingan" : ""}.`,
    );
  for (const p of c.poderes) {
    const def = PODER_BY_ID[p.id];
    const name = def?.name ?? p.customName ?? "Poder";
    if (p.level > b.cap) push("erro", "poderes", `${name} ${p.level} passa do limite de poder ${b.cap}.`);
    if (!def) continue;
    if (def.restricted && !allowed.powers.has(def.id)) push("erro", "poderes", `${def.name} é restrito a: ${ownersText("poderes", def.id)}.`);
    if (!reqsMet(c, def.req)) push("erro", "poderes", `${def.name}: pré-requisito não atendido (${def.reqText}).`);
    if (c.originId === "samurai" && !def.restricted) push("erro", "poderes", `Samurais não compram poderes comuns (${def.name}).`);
    if (def.mode === "efeitos" && def.id !== "versatilidade") {
      // A ordem das escolhas é livre: o limite é o nível do poder (o mais alto entre as compras).
      const top = powerLevel(c, p.id);
      p.effects.slice(0, p.level).forEach((eid, i) => {
        if (!eid) return;
        const ef = EFEITO_BY_ID[eid];
        if (!ef) return;
        const k = evolutionIndex(p.effects, i, c.optionals.pularEvolucoes);
        if (p.effects.indexOf(eid) === i && !reqsMet(c, ef.req)) push("erro", "poderes", `${def.name}: ${ef.name} pede ${ef.reqText}.`);
        if (!k) {
          if (ef.level > top) push("erro", "poderes", `${def.name}: ${ef.name} é de nível ${ef.level}, acima do nível ${top} do poder.`);
          return;
        }
        const need = evolutionLevel(eid, k);
        if (need === null) push("erro", "poderes", `${def.name}: ${ef.name} não tem ${k > 1 ? `${k}ª ` : ""}evolução.`);
        else if (need > top) push("erro", "poderes", `${def.name}: a evolução ${ef.name} Nv ${need} pede o poder no nível ${need}.`);
      });
      const missing = p.effects.slice(0, p.level).filter((x) => !x).length + Math.max(0, p.level - p.effects.length);
      if (missing > 0) push("aviso", "poderes", `${def.name}: ${missing} efeito(s) por escolher.`);
    }
  }

  validateVersatilidade(c, push);
  validateUchiha(c, push);
  validateKuchiyose(c, push);

  // Aptidões que a ficha soma sozinha: avisa se o bônus também foi digitado em "Outros".
  if (hasApt(c, "reflexos") && (c.combatBonus.ESQ || 0) >= 1)
    push("aviso", "atributos", "Reflexos já soma +1 na Esquiva automaticamente; confira se o +1 em “Outros” não está repetido.");
  if (hasApt(c, "intuicao") && (c.combatBonus.LM || 0) >= 1)
    push("aviso", "atributos", "Intuição já soma +1 em Ler Movimento automaticamente; confira se o +1 em “Outros” não está repetido.");

  // Equipamento
  const ryosTotal = b.ryos + (c.extraRyos || 0);
  if (s.ryos > ryosTotal) push("aviso", "equipamento", `Equipamento custa ${s.ryos - ryosTotal} ryos a mais que o disponível.`);
  const over = extraComps(c);
  if (over > 0) push("aviso", "equipamento", `${s.comps} compartimentos (limite ${compLimit(c)}): −${3 * over}m de deslocamento e −${over} de precisão.`);

  // Origem
  const extras = c.extraOrigins.filter((x) => x && x !== c.originId);
  const extraNeedsRule = extras.filter((x) => !ORIGIN_BY_ID[x]?.stackable);
  if (extraNeedsRule.length && !c.optionals.multiHijutsu)
    push("erro", "cla", `Mais de um clã/hijutsu (${extraNeedsRule.map((x) => ORIGIN_BY_ID[x]?.name ?? x).join(", ")}) exige a regra opcional de 2+ hijutsus.`);

  if (!c.name.trim()) push("aviso", "conceito", "Dê um nome ao seu shinobi.");
  if (!c.originId && !hasApt(c, "trabalho-duro")) push("aviso", "cla", "Sem clã ou hijutsu: considere a aptidão Trabalho Duro.");

  return out;
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
    optionals: { tresPontosPoder: false, aptidoesBanidas: false, danoExtraAuto: false, multiHijutsu: false, fuuinjutsuLista: false, pularEvolucoes: false },
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

/** Itens que eram poderes em versões antigas e, pelos livros, são aptidões (Senjutsu virou linha de aptidões no Guia de 10 anos). */
const POWER_TO_APT: Record<string, string> = { senjutsu: "senjutsu", souma: "souma-no-kou", "kuroi-kaminari": "relampago-negro" };
/** Poderes que não existem nos livros (Kakuran e Nan no Kaizou são só Aptidões Especiais do Tensai). */
const REMOVED_POWERS = ["kakuran", "nan-no-kaizou"];

/** Versatilidades antigas guardavam os poderes versáteis só no nome (ex.: "Katon Versátil + Suiton Versátil"). */
function migrateVersatile(p: PowerEntry): PowerEntry {
  if (p.id !== "versatilidade" || p.versatile?.length) return p;
  const name = (p.customName ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const found = VERSATEIS.map((id) => ({ id, at: name.indexOf(id) })).filter((x) => x.at >= 0);
  const versatile = found.sort((a, b) => a.at - b.at).slice(0, 2).map((x) => x.id);
  return versatile.length ? { ...p, versatile } : p;
}

function migrateApts(raw: Partial<Character>): Pick<Character, "aptidoes" | "poderes"> {
  const poderes = (raw.poderes ?? []).filter((p) => !POWER_TO_APT[p.id] && !REMOVED_POWERS.includes(p.id)).map(migrateVersatile);
  const aptidoes = (raw.aptidoes ?? []).map((e) => {
    const a = APT_BY_ID[e.id];
    // Aptidões sem níveis (ex.: Kugutsu, que antes aceitava 3) voltam ao nível 1; os níveis de marionete são do Kurohigi.
    return a && e.level > (a.maxLevel ?? 1) ? { ...e, level: a.maxLevel ?? 1 } : e;
  });
  for (const p of raw.poderes ?? []) {
    const id = POWER_TO_APT[p.id];
    if (!id || aptidoes.some((e) => e.id === id)) continue;
    aptidoes.push({ uid: uid(), id, level: Math.min(Math.max(1, p.level), APT_BY_ID[id]?.maxLevel ?? 1), free: false });
  }
  return { aptidoes, poderes };
}

/** Completa campos faltantes (fichas importadas de versões antigas). */
export function normalize(raw: Partial<Character>): Character {
  const base = newCharacter(raw.nc ?? 4);
  const { aptidoes, poderes } = migrateApts(raw);
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
    aptidoes,
    poderes,
    items: raw.items ?? [],
    kuchiyose: raw.kuchiyose ? { forma: raw.kuchiyose.forma ?? null, especie: raw.kuchiyose.especie ?? null, criaturas: raw.kuchiyose.criaturas ?? [] } : undefined,
    extraOrigins: raw.extraOrigins ?? [],
    customOrigin: { ...base.customOrigin, ...(raw.customOrigin ?? {}) },
    customSkills: raw.customSkills ?? [],
    id: raw.id ?? base.id,
  };
}
