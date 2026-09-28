import { ATTRS, COMBAT, SKILLS } from "./data/base";
import { combatTotal, derived, hasApt, powerLevel, skillTotal, uid } from "./rules";
import type { AttrKey, Character, CombatKey, ModTarget, PlayCond, PlayCounter, PlayEffect, PlayLog, PlayMod, PlayState } from "./types";

/* ---------------- catálogos ---------------- */

export const MOD_TARGETS: { k: ModTarget; label: string; short: string }[] = [
  { k: "FOR", label: "Força", short: "Força" },
  { k: "DES", label: "Destreza", short: "Destreza" },
  { k: "AGI", label: "Agilidade", short: "Agilidade" },
  { k: "PER", label: "Percepção", short: "Percepção" },
  { k: "INT", label: "Inteligência", short: "Inteligência" },
  { k: "VIG", label: "Vigor", short: "Vigor" },
  { k: "ESP", label: "Espírito", short: "Espírito" },
  { k: "CC", label: "Combate Corporal", short: "CC" },
  { k: "CD", label: "Combate à Distância", short: "CD" },
  { k: "ESQ", label: "Esquiva", short: "Esquiva" },
  { k: "LM", label: "Ler Movimento", short: "Ler Mov." },
  { k: "vit", label: "Vitalidade máxima", short: "Vit. máx." },
  { k: "chk", label: "Chakra máximo", short: "Chakra máx." },
  { k: "ini", label: "Iniciativa", short: "Iniciativa" },
  { k: "desloc", label: "Deslocamento (m)", short: "Desloc." },
  { k: "dano", label: "Dano base", short: "Dano base" },
  { k: "dif", label: "Dificuldade das técnicas", short: "Dif. técnicas" },
  { k: "dureza", label: "Dureza de corpo", short: "Dureza" },
  { k: "precAtk", label: "Precisão de ataque", short: "Prec. ataque" },
  { k: "precDef", label: "Precisão de defesa", short: "Prec. defesa" },
  { k: "acel", label: "Acelerado (2 = super)", short: "Acelerado" },
];
const TARGET_SHORT = Object.fromEntries(MOD_TARGETS.map((t) => [t.k, t.short])) as Record<ModTarget, string>;

export interface CondDef {
  k: string;
  n: string;
  atk?: number;
  def?: number;
  ini?: number;
  stack?: boolean;
  txt: string;
}

/** Condições prejudiciais do Livro Básico (pág. 275–278). */
export const CONDS: CondDef[] = [
  { k: "debilitado", n: "Debilitado", atk: -1, def: -1, stack: true, txt: "−1 em todos os testes (acumula até −3)." },
  { k: "fatigado", n: "Fatigado", atk: -1, def: -1, txt: "Lento; ataque e defesa −1. De novo: exausto." },
  { k: "exausto", n: "Exausto", atk: -3, def: -3, txt: "Lento; ataque e defesa −3. De novo ou fatigado: inconsciente." },
  { k: "lento", n: "Lento", txt: "Metade do deslocamento; sem corrida nem investida." },
  { k: "caido", n: "Caído", txt: "CC −3; defesa −3 contra corpo-a-corpo e área; +3 contra distância." },
  { k: "fintado", n: "Fintado", def: -2, txt: "Defesa −2 contra o próximo ataque." },
  { k: "desprevenido", n: "Desprevenido", def: -3, txt: "Defesa −3 e perde bônus de Esquiva." },
  { k: "flanqueado", n: "Flanqueado", def: -1, txt: "Defesa −1 contra os dois atacantes." },
  { k: "impedido", n: "Impedido", atk: -1, def: -1, txt: "Não sai do lugar; defesa fixa 9 contra área." },
  { k: "agarrado", n: "Agarrado", atk: -1, def: -1, txt: "Preso pela manobra agarrar: fica impedido." },
  { k: "ofuscado", n: "Ofuscado", atk: -1, txt: "Ataque −1 e testes que dependem de visão −1." },
  { k: "surdo", n: "Surdo", ini: -3, txt: "Iniciativa −3; sem Prontidão/Procurar auditivos." },
  { k: "cego", n: "Cego", txt: "Camuflagem visual total; sem testes visuais." },
  { k: "tonto", n: "Tonto", txt: "Perde a ação de movimento." },
  { k: "atordoado", n: "Atordoado", txt: "Sem ações, nem livres; ainda pode reagir." },
  { k: "assustado", n: "Assustado", txt: "Afasta-se da fonte do medo; se não puder, debilitado." },
  { k: "amedrontado", n: "Amedrontado", atk: -1, def: -1, txt: "Foge ou se encolhe; debilitado e não ataca." },
  { k: "confuso", n: "Confuso", txt: "1d8: 1–2 foge · 3–4 ataca o mais próximo · 5–6 nada · 7–8 normal." },
  { k: "sangrando", n: "Sangrando", stack: true, txt: "−2 Vit por nível no início do turno. Vigor 18 ou Medicina 16 tira um nível." },
  { k: "sufocando", n: "Sufocando", txt: "Vigor por turno, +1 de dificuldade a cada turno; falha = dano igual ao NC." },
  { k: "indefeso", n: "Indefeso", txt: "Ataques contra você são sucesso automático." },
  { k: "inconsciente", n: "Inconsciente", txt: "Indefeso e sem nenhuma ação." },
];
export const COND_BY: Record<string, CondDef> = Object.fromEntries(CONDS.map((c) => [c.k, c]));

/** Condições que acabam sozinhas no fim da cena. */
const SCENE_CONDS = ["fintado", "flanqueado", "desprevenido", "caido"];

/** Oito Portões (Livro Básico, pág. 205–207). Portões 7 e 8 escalam com o nível do poder. */
export const GATES = [
  { g: 1, n: "Kaimon", f: 1, a: 0, d: 3, t: 2, sup: false, gen: 0 },
  { g: 2, n: "Kyūmon", f: 2, a: 0, d: 2, t: 5, sup: false, gen: 0 },
  { g: 3, n: "Seimon", f: 3, a: 0, d: 3, t: 5, sup: false, gen: -1 },
  { g: 4, n: "Shōmon", f: 4, a: 1, d: 4, t: 5, sup: false, gen: -1 },
  { g: 5, n: "Tomon", f: 5, a: 2, d: 5, t: 5, sup: false, gen: -2 },
  { g: 6, n: "Keimon", f: 6, a: 3, d: 6, t: 5, sup: false, gen: -2 },
  { g: 7, n: "Kyōmon", f: 7, a: 3, d: 7, t: 5, sup: true, gen: -3 },
  { g: 8, n: "Shimon", f: 16, a: 6, d: 0, t: 5, sup: true, gen: -8 },
] as const;

export const RESET_LABEL: Record<PlayCounter["reset"], string> = {
  cena: "repõe no fim da cena",
  descanso: "repõe no descanso",
  nunca: "consumível",
};

/* ---------------- utilidades ---------------- */

export const sg = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0");

export function modLabel(m: PlayMod) {
  if (m.t === "acel") return m.v >= 2 ? "Super acelerado" : "Acelerado";
  return `${TARGET_SHORT[m.t] ?? m.t} ${sg(m.v)}${m.t === "desloc" ? "m" : ""}`;
}

export function vitStatus(v: number) {
  if (v > 0) return "De pé";
  if (v === 0) return "Fora de combate";
  if (v >= -10) return "Inconsciente";
  if (v >= -20) return "Morrendo · −2/turno";
  return "Morto";
}

export const hasCond = (p: PlayState, k: string) => p.conds.some((c) => c.k === k);

/* ---------------- presets de estados ---------------- */

const blankEffect = (): PlayEffect => ({
  id: uid(),
  name: "Novo estado",
  src: "Personalizado",
  active: false,
  costVit: 0,
  costChk: 0,
  gainChk: 0,
  usedScene: false,
  perVit: 0,
  perChk: 0,
  turns: 0,
  left: 0,
  after: "",
  afterNote: "",
  afterTurns: 0,
  hint: "",
  mods: [],
});

export const makeCustom = (): PlayEffect => blankEffect();

export const makeJuuinkaIchi = (): PlayEffect => ({
  ...blankEffect(),
  name: "Juuinka · Ichi",
  src: "Selo Amaldiçoado · 1º estágio",
  costVit: 8,
  after: "fatigado",
  afterNote: "30 min · selo desativado",
  hint: "O livro pede 2 bônus fixos da lista. Aqui você marca os que a mesa aceitar e pode mudar os valores em “Editar”.",
  mods: [
    { t: "FOR", v: 4, on: false },
    { t: "dano", v: 2, on: false },
    { t: "precAtk", v: 1, on: false },
    { t: "precDef", v: 1, on: false },
    { t: "dif", v: 1, on: false },
    { t: "dureza", v: 1, on: false },
  ],
});

export const makeJuuinkaNi = (): PlayEffect => ({
  ...blankEffect(),
  name: "Juuinka · Ni",
  src: "Selo Amaldiçoado · 2º estágio",
  costVit: 4,
  gainChk: 20,
  hint: "Soma os bônus do 1º estágio (deixe-o ativo). Selo do Céu ou da Terra: ligue “Desloc. +3m”.",
  mods: [
    { t: "acel", v: 1, on: true },
    { t: "desloc", v: 3, on: false },
  ],
});

export function gateMods(g: number, level = g): PlayMod[] {
  const G = GATES[g - 1];
  const f = g === 7 ? level : g === 8 ? 2 * level : G.f;
  const mods: PlayMod[] = [{ t: "FOR", v: f, on: true }];
  if (G.a) mods.push({ t: "AGI", v: G.a, on: true });
  mods.push({ t: "acel", v: G.sup ? 2 : 1, on: true });
  return mods;
}

export function gateSrc(g: number) {
  const G = GATES[g - 1];
  return `Portão ${g} · ${G.n}${G.gen ? ` · Dif ${G.gen} vs Genjutsu` : ""}${g === 8 ? " · paralisado e morte ao fechar" : ""}`;
}

/** Aplica os valores do portão ao estado (mantém duração restante se já estiver aberto). */
export function applyGate(e: PlayEffect, g: number, level = g) {
  const G = GATES[g - 1];
  const dmg = g === 7 ? level : G.d;
  e.gate = g;
  e.src = gateSrc(g);
  e.mods = gateMods(g, level);
  e.costVit = dmg;
  e.perVit = dmg;
  e.turns = G.t;
}

export function makeHachimon(level = 1): PlayEffect {
  const e: PlayEffect = {
    ...blankEffect(),
    name: "Hachimon Tonkou",
    after: "fatigado",
    afterNote: "cansaço dos Portões",
    afterTurns: 4,
    hint: `Dano na abertura e no início de cada turno. Vitalidade em 0 fecha os portões.${level > 1 ? ` Seu Hachimon é nível ${level}.` : ""}`,
  };
  applyGate(e, 1, level);
  return e;
}

/* ---------------- ficha em jogo ---------------- */

export function newPlay(c: Character): PlayState {
  const d = derived(c);
  const effects: PlayEffect[] = [];
  if (hasApt(c, "juuinka-ichi")) effects.push(makeJuuinkaIchi());
  if (hasApt(c, "juuinka-ni")) effects.push(makeJuuinkaNi());
  const hachi = powerLevel(c, "hachimon");
  if (hachi > 0) effects.push(makeHachimon(hachi));
  const counters: PlayCounter[] = [{ id: uid(), n: "Kawarimi no Jutsu", cur: 1, max: 1, reset: "cena" }];
  for (const it of c.items) {
    if (!it.name.trim()) continue;
    const pill = /p[ií]lula/i.test(it.name);
    const max = pill && /10/.test(it.name) ? it.qty * 10 : it.qty;
    counters.push({ id: uid(), n: it.name, cur: max, max, reset: "nunca", pill });
  }
  return { vit: d.vit, chk: d.chakra, round: 0, conds: [], effects, counters, log: [], notes: "" };
}

/* ---------------- números com estados aplicados ---------------- */

export function playView(c: Character, p: PlayState) {
  const add: Partial<Record<ModTarget, number>> = {};
  for (const e of p.effects) {
    if (!e.active) continue;
    for (const m of e.mods) if (m.on) add[m.t] = (add[m.t] ?? 0) + m.v;
  }
  const g = (k: ModTarget) => add[k] ?? 0;

  const attrs = { ...c.attrs };
  (Object.keys(attrs) as AttrKey[]).forEach((k) => (attrs[k] += g(k)));
  const combatBonus = { ...c.combatBonus };
  (Object.keys(combatBonus) as CombatKey[]).forEach((k) => (combatBonus[k] = (combatBonus[k] || 0) + g(k)));
  const c2: Character = {
    ...c,
    attrs,
    combatBonus,
    bonus: {
      vit: (c.bonus.vit || 0) + g("vit"),
      chakra: (c.bonus.chakra || 0) + g("chk"),
      ini: (c.bonus.ini || 0) + g("ini"),
      desloc: (c.bonus.desloc || 0) + g("desloc"),
    },
  };

  const base = derived(c);
  const d = derived(c2);
  const exausto = hasCond(p, "exausto");
  let atk = 0;
  let def = 0;
  let iniPen = 0;
  for (const x of p.conds) {
    const cd = COND_BY[x.k];
    if (!cd) continue;
    if (x.k === "fatigado" && exausto) continue;
    const mult = cd.stack ? x.stacks : 1;
    atk += (cd.atk ?? 0) * mult;
    def += (cd.def ?? 0) * mult;
    iniPen += cd.ini ?? 0;
  }
  atk = Math.max(-3, atk);
  def = Math.max(-3, def);

  const acel = g("acel");
  const ini = d.ini + (acel >= 2 ? 4 : acel >= 1 ? 2 : 0) + iniPen;
  let desloc = d.desloc;
  // Acelerado dobra a Agilidade no deslocamento (Velocista já dobra).
  if (acel && !hasApt(c, "velocista")) desloc += Math.ceil(attrs.AGI) - Math.ceil(attrs.AGI / 2);
  const lento = hasCond(p, "lento") || hasCond(p, "fatigado") || exausto;
  if (lento) desloc = Math.floor(desloc / 2);

  return {
    add,
    attrs,
    baseAttrs: c.attrs,
    combat: Object.fromEntries(COMBAT.map((k) => [k.key, combatTotal(c2, k.key)])) as Record<CombatKey, number>,
    baseCombat: Object.fromEntries(COMBAT.map((k) => [k.key, combatTotal(c, k.key)])) as Record<CombatKey, number>,
    vitMax: d.vit,
    baseVitMax: base.vit,
    chkMax: d.chakra,
    ini,
    baseIni: base.ini,
    desloc,
    skills: SKILLS.map((s) => ({ key: s.key, name: s.name, eff: skillTotal(c2, s.key), base: skillTotal(c, s.key) })),
    reacao: combatTotal(c2, "ESQ") + 9,
    baseReacao: base.reacaoEsquiva,
    acel,
    lento,
    atk,
    def,
    iniPen,
    precAtk: g("precAtk") + atk,
    precDef: g("precDef") + def,
    dano: g("dano"),
    dif: g("dif"),
    dureza: g("dureza"),
  };
}
export type PlayView = ReturnType<typeof playView>;

export const ATTR_KEYS = ATTRS.map((a) => a.key);

/* ---------------- ações (sobre um rascunho) ---------------- */

export type Logger = (txt: string, tone?: PlayLog["tone"]) => void;

export function addCond(p: PlayState, k: string, o: { note?: string; turns?: number; name?: string }, log: Logger): void {
  const def = COND_BY[k];
  const name = def?.n ?? o.name ?? k;
  const ex = p.conds.find((c) => c.k === k);
  if (k === "fatigado" && hasCond(p, "exausto")) {
    log("Fatigado estando exausto", "bad");
    return addCond(p, "inconsciente", {}, log);
  }
  if (k === "fatigado" && ex) {
    p.conds = p.conds.filter((c) => c !== ex);
    log("Fatigado pela 2ª vez", "bad");
    return addCond(p, "exausto", o, log);
  }
  if (k === "exausto" && ex) {
    log("Exausto pela 2ª vez", "bad");
    return addCond(p, "inconsciente", {}, log);
  }
  if (ex && def?.stack) {
    ex.stacks += 1;
    log(`${name} ×${ex.stacks}`, "bad");
    return;
  }
  if (ex) {
    if (o.turns) ex.turns = o.turns;
    if (o.note) ex.note = o.note;
    return;
  }
  const c: PlayCond = { id: uid(), k, name, stacks: 1, turns: o.turns ?? 0, note: o.note ?? "" };
  p.conds.push(c);
  log(`${name}${c.note ? ` (${c.note})` : ""}${c.turns ? ` por ${c.turns} turno(s)` : ""}`, "bad");
}

const NO_CHAKRA = "sem chakra";

export function checkChakra(p: PlayState, log: Logger) {
  const flag = p.conds.find((c) => c.note === NO_CHAKRA);
  if (p.chk <= 0 && !hasCond(p, "exausto")) addCond(p, "exausto", { note: NO_CHAKRA }, log);
  if (p.chk > 0 && flag) {
    p.conds = p.conds.filter((c) => c !== flag);
    log("Chakra voltou: exausto removido", "ok");
  }
}

export function deactivate(p: PlayState, e: PlayEffect, log: Logger, why?: string) {
  e.active = false;
  e.left = 0;
  log(`${e.name} desativado${why ? ` (${why})` : ""}`, "n");
  if (e.after) addCond(p, e.after, { note: e.afterNote, turns: e.afterTurns }, log);
}

function checkGates(p: PlayState, log: Logger) {
  if (p.vit > 0) return;
  p.effects.forEach((e) => e.active && e.gate && deactivate(p, e, log, "Vitalidade em 0"));
}

export function toggleEffect(p: PlayState, id: string, log: Logger) {
  const e = p.effects.find((x) => x.id === id);
  if (!e) return;
  if (e.active) return deactivate(p, e, log);
  e.active = true;
  e.left = e.turns || 0;
  const parts: string[] = [];
  if (e.costVit) {
    p.vit -= e.costVit;
    parts.push(`−${e.costVit} Vit`);
  }
  if (e.costChk) {
    p.chk -= e.costChk;
    parts.push(`−${e.costChk} Chakra`);
  }
  if (e.gainChk) {
    if (!e.usedScene) {
      p.chk += e.gainChk;
      e.usedScene = true;
      parts.push(`+${e.gainChk} Chakra`);
    } else parts.push("bônus de chakra já usado nesta cena");
  }
  log(`${e.name} ativado${parts.length ? `: ${parts.join(", ")}` : ""}`, "ok");
  checkChakra(p, log);
  checkGates(p, log);
}

export function nextTurn(p: PlayState, log: Logger) {
  if (!p.round) {
    p.round = 1;
    log("Combate iniciado", "n");
    return;
  }
  p.round += 1;
  log(`Início da rodada ${p.round}`, "n");
  const bleed = p.conds.filter((c) => c.k === "sangrando").reduce((t, c) => t + c.stacks, 0);
  if (bleed) {
    p.vit -= 2 * bleed;
    log(`Sangrando ×${bleed}: −${2 * bleed} Vit`, "bad");
  } else if (p.vit <= -11 && p.vit >= -20) {
    p.vit -= 2;
    log("Morrendo: −2 Vit", "bad");
  }
  for (const e of p.effects) {
    if (!e.active) continue;
    if (e.perVit) {
      p.vit -= e.perVit;
      log(`${e.name}: −${e.perVit} Vit`, "bad");
    }
    if (e.perChk) {
      p.chk -= e.perChk;
      log(`${e.name}: −${e.perChk} Chakra`, "chk");
    }
    if (e.turns) {
      e.left -= 1;
      if (e.left <= 0) deactivate(p, e, log, "fim da duração");
    }
  }
  const ended: PlayCond[] = [];
  for (const c of p.conds) {
    if (!c.turns) continue;
    c.turns -= 1;
    if (c.turns <= 0) ended.push(c);
  }
  ended.forEach((c) => log(`${c.name} terminou`, "ok"));
  p.conds = p.conds.filter((c) => !ended.includes(c));
  checkChakra(p, log);
  checkGates(p, log);
}

export function endCombat(p: PlayState, log: Logger) {
  p.round = 0;
  log("Combate encerrado", "n");
}

export function damage(p: PlayState, n: number, log: Logger) {
  const before = vitStatus(p.vit);
  p.vit -= n;
  log(`Dano sofrido: −${n} Vit`, "bad");
  const after = vitStatus(p.vit);
  if (after !== before) log(`Agora: ${after}`, "bad");
  checkGates(p, log);
}

export function heal(p: PlayState, max: number, n: number, log: Logger) {
  const next = Math.max(p.vit, Math.min(max, p.vit + n));
  log(`Cura: +${next - p.vit} Vit${next - p.vit < n ? " (limite do máximo)" : ""}`, "ok");
  p.vit = next;
}

export function setVit(p: PlayState, n: number, log: Logger) {
  p.vit = n;
  log(`Vitalidade definida em ${n}`, "n");
  checkGates(p, log);
}

export function spend(p: PlayState, n: number, log: Logger) {
  p.chk -= n;
  log(`Chakra gasto: −${n}`, "chk");
  checkChakra(p, log);
}

export function recover(p: PlayState, max: number, n: number, log: Logger) {
  const next = Math.max(p.chk, Math.min(max, p.chk + n));
  log(`Chakra recuperado: +${next - p.chk}`, "chk");
  p.chk = next;
  checkChakra(p, log);
}

export function setChk(p: PlayState, n: number, log: Logger) {
  p.chk = n;
  log(`Chakra definido em ${n}`, "chk");
  checkChakra(p, log);
}

export function toggleCond(p: PlayState, k: string, log: Logger) {
  if (hasCond(p, k)) {
    p.conds = p.conds.filter((c) => c.k !== k);
    log(`${COND_BY[k]?.n ?? k} removido`, "ok");
  } else addCond(p, k, {}, log);
}

export function stackCond(p: PlayState, id: string, delta: number, log: Logger) {
  const c = p.conds.find((x) => x.id === id);
  if (!c) return;
  c.stacks += delta;
  if (c.stacks <= 0) {
    p.conds = p.conds.filter((x) => x !== c);
    log(`${c.name} removido`, "ok");
  } else log(`${c.name} ×${c.stacks}`, delta > 0 ? "bad" : "ok");
}

export function removeCond(p: PlayState, id: string, log: Logger) {
  const c = p.conds.find((x) => x.id === id);
  if (!c) return;
  p.conds = p.conds.filter((x) => x !== c);
  log(`${c.name} removido`, "ok");
}

export function addCustomCond(p: PlayState, name: string, log: Logger) {
  const id = uid();
  p.conds.push({ id, k: `custom:${id}`, name, stacks: 1, turns: 0, note: "" });
  log(`${name} (condição da mesa)`, "bad");
}

export function tickCounter(p: PlayState, id: string, delta: number, log: Logger, pillGain?: number) {
  const k = p.counters.find((x) => x.id === id);
  if (!k) return;
  const next = Math.max(0, k.cur + delta);
  if (next === k.cur) return;
  k.cur = next;
  if (pillGain !== undefined) {
    p.chk += pillGain;
    log(`${k.n}: +${pillGain} Chakra (fatigado após 1 hora)`, "chk");
    checkChakra(p, log);
  } else log(`${k.n} ${delta < 0 ? "usado" : "reposto"}: ${k.cur}/${k.max}`, "n");
}

export function restNight(p: PlayState, c: Character, v: PlayView, log: Logger) {
  const gv = 10 + 2 * c.attrs.VIG;
  const gc = 5 + 2 * c.attrs.ESP;
  const nv = Math.max(p.vit, Math.min(v.vitMax, p.vit + gv));
  const nc = Math.max(p.chk, Math.min(v.chkMax, p.chk + gc));
  log(`Noite de descanso: +${nv - p.vit} Vit, +${nc - p.chk} Chakra`, "ok");
  p.vit = nv;
  p.chk = nc;
  p.round = 0;
  p.conds = p.conds.filter((x) => x.k !== "fatigado" && x.k !== "exausto");
  p.counters.forEach((k) => k.reset !== "nunca" && (k.cur = k.max));
  p.effects.forEach((e) => (e.usedScene = false));
}

export function endScene(p: PlayState, log: Logger) {
  p.round = 0;
  p.conds = p.conds.filter((x) => !SCENE_CONDS.includes(x.k));
  p.counters.forEach((k) => k.reset === "cena" && (k.cur = k.max));
  p.effects.forEach((e) => (e.usedScene = false));
  log("Fim da cena: usos por cena repostos", "ok");
}

export function restoreAll(p: PlayState, c: Character, log: Logger) {
  p.effects.forEach((e) => {
    e.active = false;
    e.left = 0;
    e.usedScene = false;
  });
  p.conds = [];
  p.round = 0;
  const d = derived(c);
  p.vit = d.vit;
  p.chk = d.chakra;
  log("Tudo restaurado", "ok");
}
