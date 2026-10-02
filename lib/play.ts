import { ATTRS, COMBAT, SKILLS } from "./data/base";
import { JUUINKA_BONUS, JUUINKA_BONUS_BY, JUUINKA_ICHI_PICKS, JUUINKA_SELOS, juuinkaChoiceLabel, niChoices } from "./data/juuinka";
import { CONTADORES, ESTADOS, ESTADO_BY_ID, blankEffect, ccFromFor, makeEstado, refreshEstado, sg } from "./estados";
import { aptLevel, combatTotal, derived, esqBonus, hasApt, mangekyou, powerLevel, skillTest, skillTotal, socialTests, uid } from "./rules";
import type { AptEntry, AttrKey, Character, CombatKey, ModTarget, PlayCond, PlayCounter, PlayEffect, PlayLog, PlayMod, PlayState } from "./types";

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

/** Condições em que a pessoa perde os bônus de Esquiva (desprevenida ou sem poder se mover). */
const ESQ_LOST = ["desprevenido", "impedido", "agarrado", "indefeso", "inconsciente"];

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

export { sg };

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

export const makeCustom = (): PlayEffect => blankEffect();

const aptEntry = (c: Character | undefined, id: string): AptEntry | undefined => c?.aptidoes.find((a) => a.id === id);

/** Os bônus do Ichi são escolhidos na Mesa a cada ativação (regra da mesa), então não dependem da ficha. */
const ICHI_SIG = "mesa";

/** Assinatura das escolhas da ficha: quando muda, a mesa remonta os bônus do selo. */
function juuinkaSig(c: Character | undefined, id: "juuinka-ichi" | "juuinka-ni"): string {
  if (id === "juuinka-ichi") return ICHI_SIG;
  const e = aptEntry(c, id);
  if (!e) return "";
  return `${niChoices(e.choices).join(",")}|${e.variant ?? ""}`;
}

/** Aplica ao estado os bônus escolhidos na criação da ficha (Livro de Hijutsus, pág. 56–57). */
function applyJuuinka(e: PlayEffect, c: Character | undefined, id: "juuinka-ichi" | "juuinka-ni") {
  const entry = aptEntry(c, id);
  e.auto = id;
  e.sig = juuinkaSig(c, id);
  if (id === "juuinka-ichi") {
    // Regra da mesa: os 6 bônus ficam na lista e a pessoa liga 2 a cada ativação (dá para trocar com o selo ativo).
    // Mantém o que já estava ligado; em estados antigos, usa as escolhas feitas na criação.
    const wasOn = new Set(e.mods.filter((m) => m.on).map((m) => `${m.t}:${m.v}`));
    const fromSheet = new Set(entry?.choices ?? []);
    e.mods = JUUINKA_BONUS.map((b) => ({ t: b.t, v: b.v, on: wasOn.size ? wasOn.has(`${b.t}:${b.v}`) : fromSheet.has(b.k) }));
    e.pick = JUUINKA_ICHI_PICKS;
    e.picked = e.mods.flatMap((m, i) => (m.on ? [i] : []));
    e.hint = `Regra da mesa: escolha ${JUUINKA_ICHI_PICKS} bônus sempre que ativar (pode trocar com o selo ativo; ligar outro desliga o mais antigo). Força +4 não acumula com Dano Base +2 (que vale para um ataque).`;
    return;
  }
  const ni = niChoices(entry?.choices);
  e.gainChk = ni.includes("chk20") ? 20 : 0;
  const mods: PlayMod[] = [];
  for (const k of ni) {
    if (k === "acel") mods.push({ t: "acel", v: 1, on: true });
    else if (JUUINKA_BONUS_BY[k]) mods.push({ t: JUUINKA_BONUS_BY[k].t, v: JUUINKA_BONUS_BY[k].v, on: true });
  }
  const selo = JUUINKA_SELOS.find((x) => x.k === (entry?.variant ?? ""));
  if (selo?.k) mods.push({ t: "desloc", v: 3, on: true });
  e.mods = mods;
  e.src = `Selo Amaldiçoado · 2º estágio${selo?.k ? ` · ${selo.label}` : ""}`;
  e.hint = [
    "Soma os bônus do 1º estágio (ele é ativado junto, se estiver desligado).",
    `Benefícios: ${ni.map(juuinkaChoiceLabel).join(" e ")}.`,
    selo && "hint" in selo ? selo.hint : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const makeJuuinkaIchi = (c?: Character): PlayEffect => {
  const e: PlayEffect = {
    ...blankEffect(),
    name: "Juuinka · Ichi",
    src: "Selo Amaldiçoado · 1º estágio",
    costVit: 8,
    after: "fatigado",
    afterNote: "30 min · selo desativado",
  };
  applyJuuinka(e, c, "juuinka-ichi");
  return e;
};

export const makeJuuinkaNi = (c?: Character): PlayEffect => {
  const e: PlayEffect = { ...blankEffect(), name: "Juuinka · Ni", src: "Selo Amaldiçoado · 2º estágio", costVit: 4 };
  applyJuuinka(e, c, "juuinka-ni");
  return e;
};

/* Yamata no Jutsu (Livro de Hijutsus Vol. 2, pág. 38; Tabela de Tamanho do Livro Básico, pág. 271). */
const YAMATA = [
  { size: "Enorme", bonus: 3, desloc: 6, alcance: 3, furt: -2, intim: 1, chk: 5 },
  { size: "Imenso", bonus: 5, desloc: 9, alcance: 4, furt: -3, intim: 2, chk: 7 },
] as const;

// "dv" marca a versão com Dureza de Corpo, CC com Acuidade e a Vitalidade da regra da mesa: estados antigos são remontados.
const yamataSig = (c: Character | undefined) =>
  `dv|${Math.min(2, Math.max(1, c ? aptLevel(c, "yamata") : 1))}|${c && hasApt(c, "corpulencia") ? "corp" : ""}|${c ? `${c.attrs.FOR}|${c.attrs.DES}|${c.acuidade && hasApt(c, "acuidade")}` : ""}`;

function applyYamata(e: PlayEffect, c: Character | undefined) {
  const lvl = Math.min(2, Math.max(1, c ? aptLevel(c, "yamata") : 1));
  const Y = YAMATA[lvl - 1];
  // O bônus de Força por tamanho não entra no CC; a Destreza do Yamata não é de tamanho e, com Acuidade, conta.
  // Regra da mesa: o Vigor do Yamata aumenta a Vitalidade (o livro diz que tamanho temporário não aumenta).
  const vitPerVig = c && hasApt(c, "corpulencia") ? 6 : 3;
  const cc = c ? ccFromFor(c, Y.bonus, 0, Y.bonus) : Y.bonus;
  e.auto = "yamata";
  e.sig = yamataSig(c);
  e.src = `Hebinomichi · tamanho ${Y.size}${lvl > 1 ? " · nível 2" : ""}`;
  e.costChk = Y.chk;
  e.gainVit = vitPerVig * Y.bonus;
  e.mods = [
    { t: "FOR", v: Y.bonus, on: true },
    { t: "DES", v: Y.bonus, on: true },
    { t: "VIG", v: Y.bonus, on: true },
    { t: "desloc", v: Y.desloc, on: true },
    ...(cc ? [{ t: "CC" as const, v: -cc, on: true }] : []),
    { t: "dureza", v: lvl, on: true },
  ];
  e.hint = [
    `Ação de movimento, contínua. Tamanho ${Y.size}: alcance CC ${Y.alcance}m, Furtividade ${sg(Y.furt)}, Intimidar ${sg(Y.intim)} (soma na Dif do Infligir Medo). Dureza de Corpo ${lvl} enquanto estiver na forma.`,
    "Só usa armas e técnicas do Hebi Ninpou, que saem sem selos de mão e sem penalidade por combate próximo.",
    cc ? `CC ${sg(-cc)} desfaz o que a Força de tamanho somaria (Livro Básico, pág. 271: Força de tamanho não entra no CC).` : "",
    c?.acuidade && hasApt(c, "acuidade") ? `Com Acuidade, a Destreza +${Y.bonus} do Yamata (que não é de tamanho) conta no CC.` : "",
    `Regra da mesa: o Vigor +${Y.bonus} aumenta a Vitalidade (+${e.gainVit} no máximo e na vida atual ao ativar). Ao desativar, a vida volta a caber no máximo normal.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export const makeYamata = (c?: Character): PlayEffect => {
  const e: PlayEffect = { ...blankEffect(), name: "Yamata no Jutsu", src: "Hebinomichi" };
  applyYamata(e, c);
  return e;
};

const findJuuinka = (p: PlayState, id: "juuinka-ichi" | "juuinka-ni") =>
  p.effects.find((e) => e.auto === id) ?? p.effects.find((e) => !e.auto && e.name === (id === "juuinka-ichi" ? "Juuinka · Ichi" : "Juuinka · Ni"));

/**
 * Mantém os estados automáticos em dia com a ficha: cria os que faltam (aptidão comprada depois
 * da primeira abertura da mesa) e remonta os bônus do Juuinka quando as escolhas mudam.
 * Retorna true se algo mudou.
 */
export function syncPlay(c: Character, p: PlayState): boolean {
  let changed = false;
  const seen = new Set(p.autoSeen ?? []);
  const markSeen = (k: string) => {
    if (seen.has(k)) return;
    seen.add(k);
    p.autoSeen = [...seen];
    changed = true;
  };
  for (const id of ["juuinka-ichi", "juuinka-ni"] as const) {
    if (!hasApt(c, id)) continue;
    const e = findJuuinka(p, id);
    if (e) markSeen(id);
    if (!e) {
      if (seen.has(id)) continue;
      p.effects.push(id === "juuinka-ichi" ? makeJuuinkaIchi(c) : makeJuuinkaNi(c));
      markSeen(id);
    } else if (e.auto !== id || e.sig !== juuinkaSig(c, id)) {
      applyJuuinka(e, c, id);
      changed = true;
    }
  }
  if (hasApt(c, "yamata")) {
    const e = p.effects.find((x) => x.auto === "yamata") ?? p.effects.find((x) => !x.auto && x.name === "Yamata no Jutsu");
    if (e) {
      markSeen("yamata");
      if (e.auto !== "yamata" || e.sig !== yamataSig(c)) {
        applyYamata(e, c);
        changed = true;
      }
    } else if (!seen.has("yamata")) {
      p.effects.push(makeYamata(c));
      markSeen("yamata");
    }
  }
  const hachi = powerLevel(c, "hachimon");
  if (hachi > 0) {
    if (p.effects.some((e) => e.gate !== undefined)) markSeen("hachimon");
    else if (!seen.has("hachimon")) {
      p.effects.push(makeHachimon(hachi));
      markSeen("hachimon");
    }
  }
  // Estados do catálogo: remonta os que já estão na mesa e cria os que a ficha tem.
  for (const e of p.effects) {
    const def = e.auto ? ESTADO_BY_ID[e.auto] : undefined;
    if (def && e.sig !== def.sig(c)) {
      refreshEstado(e, def, c);
      changed = true;
    }
  }
  for (const def of ESTADOS) {
    if (def.auto === false || !def.has(c)) continue;
    if (p.effects.some((e) => e.auto === def.id)) markSeen(def.id);
    else if (!seen.has(def.id)) {
      p.effects.push(makeEstado(def, c));
      markSeen(def.id);
    }
  }
  // Kawarimi: a Possessão da Serpente Branca troca a pele (ação parcial) e, no nível 2, dá um uso a mais.
  const kw = p.counters.find((k) => k.auto === "kawarimi") ?? p.counters.find((k) => !k.auto && k.n === "Kawarimi no Jutsu");
  if (kw) {
    const pos = aptLevel(c, "possessao-serpente");
    const max = pos >= 2 ? 2 : 1;
    const note = pos
      ? `Troca de pele: ação parcial (sem se deslocar; para se mover, use a ação de movimento)${pos >= 2 ? " · +1 uso pela Possessão da Serpente Branca Nv 2" : ""}`
      : undefined;
    if (kw.auto !== "kawarimi" || kw.max !== max || kw.note !== note) {
      kw.cur = Math.max(0, Math.min(max, kw.cur + max - kw.max));
      kw.max = max;
      kw.note = note;
      kw.auto = "kawarimi";
      changed = true;
    }
  }
  // Mangekyou: 10 pontos de visão que não se recuperam. O Mangekyou Eterno cura a cegueira e libera o Sharingan.
  if (hasApt(c, "mangekyou") && !p.visao) {
    p.visao = { pts: VISAO_MAX, zeros: 0 };
    changed = true;
  }
  if (hasApt(c, "eien-mangekyou") && (p.visao?.lock || p.olhos || p.conds.some((x) => x.note === VISAO_PERM || x.note === OLHO_PERM))) {
    if (p.visao) p.visao.lock = false;
    p.olhos = undefined;
    p.conds = p.conds.filter((x) => x.note !== VISAO_PERM && x.note !== OLHO_PERM);
    changed = true;
  }
  for (const k of CONTADORES) {
    if (!k.has(c)) continue;
    const key = `contador:${k.id}`;
    const cur = p.counters.find((x) => x.n === k.n);
    // Contador que acompanha a ficha (absorção da Montaria pela Arte): o máximo segue o valor atual.
    if (cur && k.refresh && cur.max !== k.max(c)) {
      cur.max = k.max(c);
      cur.cur = Math.min(cur.cur, cur.max);
      changed = true;
    }
    if (cur) markSeen(key);
    else if (!seen.has(key)) {
      const max = k.max(c);
      p.counters.push({ id: uid(), n: k.n, cur: max, max, reset: k.reset });
      markSeen(key);
    }
  }
  return changed;
}

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
  const counters: PlayCounter[] = [{ id: uid(), n: "Kawarimi no Jutsu", cur: 1, max: 1, reset: "cena", auto: "kawarimi" }];
  for (const it of c.items) {
    if (!it.name.trim()) continue;
    const pill = /p[ií]lula/i.test(it.name);
    const max = pill && /10/.test(it.name) ? it.qty * 10 : it.qty;
    counters.push({ id: uid(), n: it.name, cur: max, max, reset: "nunca", pill });
  }
  const p: PlayState = { vit: d.vit, chk: d.chakra, round: 0, conds: [], effects, counters, log: [], notes: "" };
  syncPlay(c, p);
  return p;
}

/* ---------------- números com estados aplicados ---------------- */

export function playView(c: Character, p: PlayState) {
  const add: Partial<Record<ModTarget, number>> = {};
  for (const e of p.effects) {
    if (!e.active) continue;
    // Acelerado não soma entre estados: vale o maior (2 = super acelerado).
    for (const m of e.mods) if (m.on) add[m.t] = m.t === "acel" ? Math.max(add.acel ?? 0, m.v) : (add[m.t] ?? 0) + m.v;
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
  // Perda de visão do Mangekyou: ofuscado permanente, fora do limite de penalidade e somado a outro ofuscado.
  const visaoPen = visaoOfuscado(c, p);
  atk = Math.max(-3, atk) - visaoPen;
  def = Math.max(-3, def);

  // Corpulência: estados que deixam acelerado não dão os benefícios da condição (Livro Básico, clã Akimichi).
  const acelBloqueado = g("acel") > 0 && hasApt(c, "corpulencia");
  const acel = acelBloqueado ? 0 : g("acel");
  const ini = d.ini + (acel >= 2 ? 4 : acel >= 1 ? 2 : 0) + iniPen;
  let desloc = d.desloc;
  // Acelerado dobra a Agilidade no deslocamento; com Velocista (que já dobra), soma +10m no lugar.
  if (acel) desloc += hasApt(c, "velocista") ? 10 : Math.ceil(attrs.AGI) - Math.ceil(attrs.AGI / 2);
  const lento = hasCond(p, "lento") || hasCond(p, "fatigado") || exausto;
  if (lento) desloc = Math.floor(desloc / 2);

  // Desprevenido ou sem poder se mover: perde todos os bônus de Esquiva (Livro Básico, pág. 251).
  const semEsquiva = ESQ_LOST.some((k) => hasCond(p, k));
  const esqEstados = p.effects.filter((e) => e.active).reduce((t, e) => t + e.mods.filter((m) => m.on && m.t === "ESQ" && m.v > 0).reduce((s, m) => s + m.v, 0), 0);
  const esqPerdida = semEsquiva ? esqBonus(c) + esqEstados : 0;

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
    // eff/base: nível da perícia (parâmetros de poder); test/baseTest: com o Perito, para os testes.
    skills: SKILLS.map((s) => ({ key: s.key, name: s.name, eff: skillTotal(c2, s.key), base: skillTotal(c, s.key), test: skillTest(c2, s.key), baseTest: skillTest(c, s.key) })),
    social: socialTests(c2),
    reacao: combatTotal(c2, "ESQ") + 9 - esqPerdida,
    baseReacao: base.reacaoEsquiva,
    esqPerdida,
    acel,
    acelBloqueado,
    velocista: hasApt(c, "velocista"),
    lento,
    atk,
    def,
    iniPen,
    visaoPen,
    precAtk: g("precAtk") + atk,
    precDef: g("precDef") + def,
    dano: g("dano"),
    dif: g("dif"),
    // Dureza de corpo da ficha (Resiliência, pelo Vigor sem tamanho) + a dos estados.
    dureza: base.dureza + g("dureza"),
    baseDureza: base.dureza,
    extraComps: base.extraComps,
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
  // Chakra não fica negativo: em 0 a pessoa fica exausta (Livro Básico, Chakra: Gasto e Recuperação).
  if (p.chk < 0) p.chk = 0;
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

/** `c` é usado para devolver a vida ao máximo normal quando um estado com `gainVit` é desligado. */
export function toggleEffect(p: PlayState, id: string, log: Logger, c?: Character) {
  const e = p.effects.find((x) => x.id === id);
  if (!e) return;
  const isIchi = e.auto === "juuinka-ichi" || (!e.auto && e.name === "Juuinka · Ichi");
  const isNi = e.auto === "juuinka-ni" || (!e.auto && e.name === "Juuinka · Ni");
  if (e.active) {
    // Fechar o 1º estágio fecha o 2º junto.
    const ni = isIchi ? findJuuinka(p, "juuinka-ni") : undefined;
    if (ni?.active) deactivate(p, ni, log, "1º estágio desativado");
    deactivate(p, e, log);
    if (e.gainVit && c) {
      const max = playView(c, p).vitMax;
      if (p.vit > max) {
        log(`${e.name}: Vitalidade volta ao máximo (${p.vit} → ${max})`, "n");
        p.vit = max;
      }
    }
    return;
  }
  const trava = sharinganTravado(p);
  if (e.auto && ESTADOS_SHARINGAN.includes(e.auto) && trava) return log(`${e.name}: ${trava}`, "bad");
  if (e.auto === "susanoo" && p.olhos?.perdidos) return log("Susanoo: perdido junto com o olho (Izanagi/Izanami)", "bad");
  if (e.costChk > p.chk) return log(`${e.name}: chakra insuficiente (tem ${Math.max(0, p.chk)}, precisa ${e.costChk})`, "bad");
  // O 2º estágio exige o 1º liberado antes.
  const ichi = isNi ? findJuuinka(p, "juuinka-ichi") : undefined;
  if (ichi && !ichi.active) toggleEffect(p, ichi.id, log, c);
  e.active = true;
  e.left = e.turns || 0;
  const parts: string[] = [];
  if (e.costVit) {
    p.vit -= e.costVit;
    parts.push(`−${e.costVit} Vit`);
  }
  if (e.gainVit) {
    p.vit += e.gainVit;
    parts.push(`+${e.gainVit} Vit`);
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
  if (e.pick) parts.push(onLabels(e) || "nenhum bônus escolhido");
  log(`${e.name} ativado${parts.length ? `: ${parts.join(", ")}` : ""}`, "ok");
  if (e.costVis) spendVisao(p, e.costVis, log);
  checkChakra(p, log);
  checkGates(p, log);
}

const onLabels = (e: PlayEffect) =>
  e.mods
    .filter((m) => m.on)
    .map(modLabel)
    .join(" e ");

/**
 * Liga/desliga um bônus do estado. Em estados de escolha limitada (Juuinka · Ichi),
 * ligar além do limite desliga o bônus escolhido há mais tempo.
 */
export function toggleMod(e: PlayEffect, i: number, log: Logger) {
  const m = e.mods[i];
  if (!m) return;
  m.on = !m.on;
  if (!e.pick) return;
  const valid = (e.picked ?? []).filter((j) => j !== i && e.mods[j]?.on);
  const rest = e.mods.flatMap((x, j) => (x.on && j !== i && !valid.includes(j) ? [j] : []));
  const order = [...valid, ...rest, ...(m.on ? [i] : [])];
  while (order.length > e.pick) e.mods[order.shift()!].on = false;
  e.picked = order;
  if (e.active) log(`${e.name}: bônus agora ${onLabels(e) || "nenhum"}`, "n");
}

/** Troca a forma de um estado do catálogo; com ele ligado, paga os custos da forma nova. */
export function setEstadoStage(p: PlayState, id: string, stage: number, c: Character, log: Logger) {
  const e = p.effects.find((x) => x.id === id);
  const def = e?.auto ? ESTADO_BY_ID[e.auto] : undefined;
  if (!e || !def) return;
  const from = e.stage ?? 0;
  if (from === stage) return;
  e.stage = stage;
  refreshEstado(e, def, c);
  if (!e.active) return;
  const cost = def.switchCost ? def.switchCost(e, from, stage, c) : { vit: e.costVit, chk: e.costChk, gain: e.gainChk };
  if (cost.chk > p.chk + (cost.gain ?? 0)) {
    e.stage = from;
    refreshEstado(e, def, c);
    return log(`${e.name}: chakra insuficiente para a nova forma (tem ${Math.max(0, p.chk)}, precisa ${cost.chk})`, "bad");
  }
  const parts: string[] = [];
  if (cost.vit) {
    p.vit -= cost.vit;
    parts.push(`−${cost.vit} Vit`);
  }
  if (cost.chk) {
    p.chk -= cost.chk;
    parts.push(`−${cost.chk} Chakra`);
  }
  if (cost.gain) {
    p.chk += cost.gain;
    parts.push(`+${cost.gain} Chakra`);
  }
  log(`${e.name}: ${def.stages?.(c)[stage]?.label ?? "nova forma"}${parts.length ? ` (${parts.join(", ")})` : ""}`, "n");
  checkChakra(p, log);
}

/** Liga/desliga a opção de um estado do catálogo (Controle Total, pílula…). */
export function toggleEstadoOpt(p: PlayState, id: string, c: Character, log: Logger) {
  const e = p.effects.find((x) => x.id === id);
  const def = e?.auto ? ESTADO_BY_ID[e.auto] : undefined;
  if (!e || !def?.opt) return;
  e.opt = !e.opt;
  refreshEstado(e, def, c);
  log(`${e.name}: ${def.opt} ${e.opt ? "ligado" : "desligado"}`, "n");
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
      if (e.perChk > p.chk) {
        deactivate(p, e, log, `chakra insuficiente para manter (tem ${Math.max(0, p.chk)}, precisa ${e.perChk})`);
        continue;
      }
      p.chk -= e.perChk;
      log(`${e.name}: −${e.perChk} Chakra`, "chk");
    }
    if (e.perVis) spendVisao(p, e.perVis, log);
    if (e.turns && e.active) {
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

/**
 * Leva a ficha à rodada da sala (quem inicia, passa e encerra o combate é o mestre).
 * Rodadas perdidas (aba fechada) são aplicadas em ordem; quem entra no meio do combate só entra.
 */
export function followRound(p: PlayState, round: number, log: Logger) {
  if (p.round === round) return;
  if (round === 0) return endCombat(p, log);
  if (p.round > round) endCombat(p, log); // o combate anterior acabou e outro começou
  if (p.round === 0) {
    p.round = round;
    log(round === 1 ? "Combate iniciado" : `Entrou no combate na rodada ${round}`, "n");
    return;
  }
  while (p.round < round) nextTurn(p, log);
}

/** Roda fn com um Logger que grava no histórico da ficha (o mais novo primeiro). */
export function withLog(p: PlayState, fn: (log: Logger) => void) {
  const out: PlayLog[] = [];
  fn((txt, tone = "n") => out.push({ id: uid(), r: p.round ? `R${p.round}` : "—", txt, tone }));
  p.log = [...out.reverse(), ...p.log].slice(0, 150);
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

/** Gasto manual: para no 0 (não existe chakra negativo). */
export function spend(p: PlayState, n: number, log: Logger) {
  const pago = Math.min(n, Math.max(0, p.chk));
  p.chk -= pago;
  log(pago < n ? `Chakra gasto: −${pago} (só havia ${pago} de ${n})` : `Chakra gasto: −${n}`, "chk");
  checkChakra(p, log);
}

/** Paga o custo de uma técnica. Sem chakra suficiente, a técnica não sai e nada é gasto. */
export function payChakra(p: PlayState, n: number, what: string, log: Logger): boolean {
  if (n > p.chk) {
    log(`${what}: chakra insuficiente (tem ${Math.max(0, p.chk)}, precisa ${n})`, "bad");
    return false;
  }
  p.chk -= n;
  return true;
}

export function recover(p: PlayState, max: number, n: number, log: Logger) {
  const next = Math.max(p.chk, Math.min(max, p.chk + n));
  log(`Chakra recuperado: +${next - p.chk}`, "chk");
  p.chk = next;
  checkChakra(p, log);
}

export function setChk(p: PlayState, n: number, log: Logger) {
  p.chk = Math.max(0, n);
  log(`Chakra definido em ${p.chk}`, "chk");
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
  if (pillGain !== undefined) takePill(p, k.n, pillGain, log);
  else log(`${k.n} ${delta < 0 ? "usado" : "reposto"}: ${k.cur}/${k.max}`, "n");
}

/** Efeito colateral após 1 hora conforme as pílulas tomadas desde o descanso (Livro Básico, Chakra: Gasto e Recuperação). */
const PILL_AFTER = ["fatigado", "exausto", "inconsciente"];

/**
 * Pílula do Soldado: ½ Espírito de chakra. O efeito colateral acumula (fatigado, exausto, inconsciente);
 * a 4ª pílula não dá chakra e intoxica: inconsciente por 1 hora, depois exausto por 20 dias.
 */
function takePill(p: PlayState, name: string, gain: number, log: Logger) {
  const n = (p.pills ?? 0) + 1;
  p.pills = n;
  if (n > 3) {
    log(`${name}: ${n}ª pílula sem descanso, intoxicação (sem chakra)`, "bad");
    addCond(p, "inconsciente", { note: "intoxicação · 1 hora; depois exausto por 20 dias" }, log);
    return;
  }
  p.chk += gain;
  log(`${name}: +${gain} Chakra (${n}ª pílula · ${PILL_AFTER[n - 1]} após 1 hora, até descansar)`, "chk");
  checkChakra(p, log);
}

/* ---------------- Mangekyou Sharingan: pontos de visão (Livro Básico, pág. 183–184) ---------------- */

export const VISAO_MAX = 10;
/** Estados que dependem do Sharingan: desligam quando a visão zera e não ligam até o descanso. */
const ESTADOS_SHARINGAN = ["sharingan", "susanoo", "kamui"];
/** Nota das condições que a perda de visão deixa para sempre (a mesa não as apaga). */
export const VISAO_PERM = "permanente · Mangekyou";

/** Por que o Sharingan não pode ser usado agora (ou "" se pode): cego, ou desligado até o Descanso do Sharingan. */
export function sharinganTravado(p: PlayState): string {
  if ((p.olhos?.perdidos ?? 0) >= 2) return "cego pelos olhos perdidos, o Sharingan não pode mais ser usado";
  if (!p.visao?.lock) return "";
  return p.visao.zeros >= 2 ? "cego, o Sharingan não pode mais ser usado" : "Sharingan indisponível até o Descanso do Sharingan";
}

/** Ofuscado pelos pontos perdidos: 1 a cada 3 (7, 4 e 1 ponto); depois do 1º zero fica em 3 mesmo com o descanso. */
const ofuscadoDe = (vz: NonNullable<PlayState["visao"]>) => (vz.zeros ? 3 : Math.min(3, Math.floor((VISAO_MAX - vz.pts) / 3)));

/** Ofuscado permanente pela perda de visão e pelo olho perdido no Izanagi/Izanami (o Mangekyou Eterno não sofre). */
export function visaoOfuscado(c: Character, p: PlayState): number {
  if (hasApt(c, "eien-mangekyou")) return 0;
  return (p.visao ? ofuscadoDe(p.visao) : 0) + (p.olhos?.perdidos === 1 ? 1 : 0);
}

/**
 * Gasta pontos de visão. Não há como recuperá-los, só o Descanso do Sharingan depois do 1º zero.
 * 1º zero: Desativação Forçada (atordoado e desprevenido por 1 turno, Sharingan desligado até o descanso).
 * 2º zero: cego e sem os benefícios do Sharingan.
 */
export function spendVisao(p: PlayState, n: number, log: Logger) {
  const vz = p.visao;
  if (!vz || n <= 0) return;
  // Com o Sharingan travado não há técnica a usar: nada é gasto (senão um 2º zero cegaria sem uso nenhum).
  if (vz.lock) return log(`Pontos de visão: ${sharinganTravado(p)}`, "bad");
  const before = ofuscadoDe(vz);
  vz.pts = Math.max(0, vz.pts - n);
  log(`Pontos de visão −${n}: ${vz.pts}/${VISAO_MAX}`, "bad");
  if (vz.pts > 0) {
    const after = ofuscadoDe(vz);
    if (after > before) log(`Visão: ofuscado ${after} permanente (ataque −${after})`, "bad");
    return;
  }
  vz.zeros += 1;
  vz.lock = true;
  p.effects.forEach((e) => e.active && e.auto && ESTADOS_SHARINGAN.includes(e.auto) && deactivate(p, e, log, "pontos de visão zerados"));
  if (vz.zeros === 1) {
    log("Desativação Forçada: dor nos olhos, Sharingan desligado até o Descanso do Sharingan", "bad");
    addCond(p, "atordoado", { turns: 1, note: "Desativação Forçada" }, log);
    addCond(p, "desprevenido", { turns: 1, note: "Desativação Forçada" }, log);
  } else {
    log("Pontos de visão zerados pela 2ª vez: cego, sem os benefícios do Sharingan", "bad");
    addCond(p, "cego", { note: VISAO_PERM }, log);
  }
}

/** Descanso do Sharingan: depois do 1º zero, 24 horas sem usar o Sharingan devolvem a visão até 5. O ofuscado 3 fica. */
export function restSharingan(p: PlayState, log: Logger) {
  const vz = p.visao;
  if (!vz || vz.zeros !== 1) return;
  vz.lock = false;
  vz.pts = Math.max(vz.pts, 5);
  log(`Descanso do Sharingan (24h sem usar): visão ${vz.pts}/${VISAO_MAX}, ofuscado 3 mantido`, "ok");
}

/* ---------------- Izanagi e Izanami: olhos perdidos (Livro de Hijutsus vol. 2, somente PdM) ---------------- */

export const OLHO_PERM = "permanente · olhos perdidos";
export const IZANAGI = "Izanagi";

/** Técnicas do Mangekyou que ficam num olho só. */
const TEC_OLHO: Record<string, string> = {
  amaterasu: "Amaterasu",
  tsukuyomi: "Tsukuyomi",
  kagutsuchi: "Kagutsuchi",
  "kamui-curto": "Kamui de curto alcance",
  "kamui-longo": "Kamui de longo alcance",
};

/** Marca que um kinjutsu acabou: falta escolher o olho perdido. */
export function olhoPendente(p: PlayState, tec: string, log: Logger) {
  if ((p.olhos?.perdidos ?? 0) >= 2) return;
  p.olhos = { perdidos: p.olhos?.perdidos ?? 0, tecs: p.olhos?.tecs ?? [], pendente: tec };
  log(`${tec} terminou: perde a visão de um olho (escolha no painel Olhos)`, "bad");
}

/** O Izanagi termina com o fim dos usos ou da cena: se foi usado e ainda sobra uso, a cena fecha a técnica. */
function fimIzanagi(p: PlayState, log: Logger) {
  const k = p.counters.find((x) => x.n === IZANAGI);
  if (k && k.cur > 0 && k.cur < k.max && !p.olhos?.pendente) olhoPendente(p, IZANAGI, log);
}

/**
 * Técnicas do Mangekyou que podem ir com o olho perdido (a escolha é do jogador). No Kamui, o Teletransporte
 * e a dimensão são dos dois olhos; curto e longo alcance ficam um em cada.
 */
export function olhoTecOpcoes(c: Character, p: PlayState): { id: string; name: string }[] {
  const par = mangekyou(c)?.par;
  if (!par) return [];
  const ids: string[] = par.k === "kamui" ? ["kamui-curto", "kamui-longo"] : [...par.tecs];
  return ids.filter((id) => !p.olhos?.tecs.includes(id)).map((id) => ({ id, name: TEC_OLHO[id] }));
}

/**
 * Perde a visão de um olho: ofuscado −1 permanente; com o Mangekyou, a técnica desse olho (`tec`) e o Susanoo.
 * Sem o outro olho, fica cego e perde todas as técnicas do Sharingan.
 */
export function perderOlho(p: PlayState, tec: string | null, log: Logger) {
  const o = { perdidos: p.olhos?.perdidos ?? 0, tecs: [...(p.olhos?.tecs ?? [])] };
  if (o.perdidos >= 2) return;
  o.perdidos += 1;
  if (tec) o.tecs.push(tec);
  p.olhos = o;
  if (o.perdidos === 1) {
    log(`Perdeu a visão de um olho: ofuscado 1 permanente${tec ? `; perdeu ${TEC_OLHO[tec] ?? tec} e o Susanoo` : ""}`, "bad");
    p.effects.forEach((e) => e.active && e.auto === "susanoo" && deactivate(p, e, log, "olho perdido"));
    return;
  }
  log("Perdeu a visão do outro olho: cego, sem as técnicas do Sharingan", "bad");
  p.effects.forEach((e) => e.active && e.auto && ESTADOS_SHARINGAN.includes(e.auto) && deactivate(p, e, log, "cego"));
  addCond(p, "cego", { note: OLHO_PERM }, log);
}

/** Transplante ocular (ou células de Hashirama, com aprovação do mestre): cura os olhos perdidos no Izanagi/Izanami. */
export function curarOlhos(p: PlayState, log: Logger) {
  if (!p.olhos) return;
  p.olhos = undefined;
  p.conds = p.conds.filter((x) => x.note !== OLHO_PERM);
  log("Transplante ocular: olhos perdidos no Izanagi/Izanami curados", "ok");
}

export function restNight(p: PlayState, c: Character, v: PlayView, log: Logger) {
  const gv = 10 + 2 * c.attrs.VIG;
  const gc = 5 + 2 * c.attrs.ESP;
  const nv = Math.max(p.vit, Math.min(v.vitMax, p.vit + gv));
  const nc = Math.max(p.chk, Math.min(v.chkMax, p.chk + gc));
  log(`Noite de descanso: +${nv - p.vit} Vit, +${nc - p.chk} Chakra`, "ok");
  p.vit = nv;
  p.chk = nc;
  p.conds = p.conds.filter((x) => x.k !== "fatigado" && x.k !== "exausto");
  p.pills = 0;
  fimIzanagi(p, log);
  p.counters.forEach((k) => k.reset !== "nunca" && (k.cur = k.max));
  p.effects.forEach((e) => (e.usedScene = false));
}

export function endScene(p: PlayState, log: Logger) {
  fimIzanagi(p, log);
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
  // A perda de visão do Mangekyou e os olhos perdidos são permanentes: “restaurar tudo” não os desfaz.
  p.conds = p.conds.filter((x) => x.note === VISAO_PERM || x.note === OLHO_PERM);
  p.pills = 0;
  const d = derived(c);
  p.vit = d.vit;
  p.chk = d.chakra;
  log("Tudo restaurado", "ok");
}
