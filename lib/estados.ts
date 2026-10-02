import { armaPorNivel } from "./dano";
import { BIJUUS } from "./data/poderes";
import { aptLevel, custoVisao, espParam, hasApt, hasMangekyouTec, peritoEm, powerLevel, skillTotal, uid } from "./rules";
import type { Character, ModTarget, PlayCounter, PlayEffect, PlayMod } from "./types";

/* Catálogo dos poderes e aptidões ativáveis dos livros que viram estados na Mesa.
   Juuinka, Yamata e Hachimon têm regras próprias e continuam em play.ts. */

export const sg = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0");

export const blankEffect = (): PlayEffect => ({
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

const on = (t: ModTarget, v: number): PlayMod => ({ t, v, on: true });
const off = (t: ModTarget, v: number): PlayMod => ({ t, v, on: false });
const half = (n: number) => Math.ceil(n / 2);
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const text = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(" ");

/** Quantas vezes o efeito foi escolhido nos poderes (2 = já evoluiu uma vez). */
const effectCount = (c: Character, id: string) => c.poderes.reduce((n, p) => n + p.effects.slice(0, p.level).filter((x) => x === id).length, 0);

/* ---------------- tamanho (Livro Básico, pág. 271) ---------------- */

const SIZE = {
  Grande: { b: 1, d: 3, alc: 2, furt: -1, intim: 1 },
  Enorme: { b: 3, d: 6, alc: 3, furt: -2, intim: 1 },
  Imenso: { b: 5, d: 9, alc: 4, furt: -3, intim: 2 },
  Colossal: { b: 7, d: 12, alc: 5, furt: -5, intim: 2 },
} as const;
type Size = keyof typeof SIZE;

/**
 * Quanto o CC subiria com +b de Força de tamanho. Com Acuidade vale o maior entre Força e Destreza,
 * então a Destreza (com `extraDes`, bônus que não são de tamanho) pode continuar valendo.
 */
export function ccFromFor(c: Character, b: number, extraFor = 0, extraDes = 0) {
  const acu = c.acuidade && hasApt(c, "acuidade");
  const f = c.attrs.FOR + extraFor;
  const cc = (x: number) => (acu ? Math.max(x, c.attrs.DES + extraDes) : x);
  return cc(f + b) - cc(f);
}

const vitPerVig = (c: Character) => (hasApt(c, "corpulencia") ? 6 : 3);

/**
 * Bônus de tamanho temporário: o bônus de Força não entra no CC e o de Vigor não aumenta a Vitalidade,
 * então os dois são desfeitos com CC e Vit. máx. negativos.
 */
function sizeMods(c: Character, size: Size, o: { vig?: boolean; extraFor?: number } = {}): PlayMod[] {
  const s = SIZE[size];
  const vig = o.vig !== false;
  const mods = [on("FOR", s.b)];
  if (vig) mods.push(on("VIG", s.b));
  mods.push(on("desloc", s.d));
  const cc = ccFromFor(c, s.b, o.extraFor);
  if (cc) mods.push(on("CC", -cc));
  if (vig) mods.push(on("vit", -vitPerVig(c) * s.b));
  return mods;
}

const sizeHint = (size: Size) => {
  const s = SIZE[size];
  return `Tamanho ${size}: alcance CC ${s.alc}m, Furtividade ${sg(s.furt)}, Intimidar ${sg(s.intim)}. O CC e a Vit. máx. negativos desfazem o que o tamanho somaria: Força de tamanho não entra no CC e tamanho temporário não aumenta a Vitalidade.`;
};

/** Os 6 bônus que o Juuinka, o Senninka e o Modo Eremita compartilham (Força +4 não acumula com Dano Base +2). */
const SELO_BONUS = (): PlayMod[] => [off("FOR", 4), off("dano", 2), off("precAtk", 1), off("precDef", 1), off("dif", 1), off("dureza", 1)];

/* ---------------- catálogo ---------------- */

export interface Cost {
  vit: number;
  chk: number;
  gain: number;
}

export interface EstadoDef {
  id: string;
  name: string;
  /** A ficha tem o poder ou aptidão. */
  has: (c: Character) => boolean;
  /** false: não é criado sozinho (a ficha não diz se o efeito foi escolhido); fica só como botão. */
  auto?: boolean;
  /** Assinatura da ficha: quando muda, a mesa remonta o estado. */
  sig: (c: Character) => string;
  /** Formas do estado (tamanho, modo, nível…). `faint` = acima do que a ficha permite hoje. */
  stages?: (c: Character) => { label: string; faint?: boolean }[];
  defaultStage?: (c: Character) => number;
  /** Rótulo de uma opção liga/desliga (Controle Total, pílula…). */
  opt?: string;
  /** O que se paga ao trocar de forma com o estado ligado. Padrão: os custos de ativação da forma nova. */
  switchCost?: (e: PlayEffect, from: number, to: number, c: Character) => Cost;
  build: (e: PlayEffect, c: Character) => void;
}

const stageOf = (e: PlayEffect) => e.stage ?? 0;
const NO_COST: Cost = { vit: 0, chk: 0, gain: 0 };

const BIJUU_FOR = [1, 3, 3, 3, 4, 5, 6, 7, 8];

function bijuu(c: Character) {
  const i = c.bijuu ? BIJUUS.indexOf(c.bijuu) : -1;
  return { tails: i >= 0 ? i + 1 : 9, kyuubi: i === 8, nibi: i === 1, name: i >= 0 ? BIJUUS[i] : "Bijuu" };
}

const rastrear = (c: Character) => skillTotal(c, "rastrear") ?? 0;

/** Nível de Arte, chave do Kibaku Nendo (sem o Perito, que é só precisão). */
const arteNivel = (c: Character) => skillTotal(c, "arte") ?? 0;

/** Contadores da mesa do Kibaku Nendo: o uso das técnicas gasta as bombas e a Montaria enche a absorção. */
export const BOMBAS_ARGILA = "Bombas de argila";
export const ABSORCAO_MONTARIA = "Absorção da montaria";

/** Sensor Limitado (Livro Básico, aptidão Sensor): custo de chakra 3. */
export const SENSOR_LIMITES: Record<string, string> = { solo: "detecção pelo solo", olfato: "olfato" };
const sensorVariant = (c: Character) => {
  const v = c.aptidoes.find((a) => a.id === "sensor")?.variant ?? "";
  return SENSOR_LIMITES[v] ? v : "";
};

export const ESTADOS: EstadoDef[] = [
  /* ---------- Livro Básico ---------- */
  {
    id: "sharingan",
    name: "Sharingan",
    has: (c) => hasApt(c, "sharingan"),
    sig: (c) => ["nidan-sharingan", "sandan-sharingan", "intuicao"].map((a) => (hasApt(c, a) ? 1 : 0)).join(""),
    build(e, c) {
      const nidan = hasApt(c, "nidan-sharingan");
      const sandan = hasApt(c, "sandan-sharingan");
      const intuicao = hasApt(c, "intuicao");
      e.src = `Uchiha · ${sandan ? "Sandan" : nidan ? "Nidan" : "1 vírgula"}`;
      e.costChk = 1;
      e.mods = nidan && !intuicao ? [on("LM", 1)] : [];
      e.hint = text(
        "Ação parcial (pode ativar na defesa), dura a cena. Visão de chakra, mede o poder e distingue assinaturas.",
        "Esquiva Perceptiva: pode se defender com Ler Movimento no lugar da Esquiva (Dif 9 + LM); bônus de Esquiva valem, bônus de LM não.",
        nidan && `Nidan: Intuição${intuicao ? " (você já tem, não acumula)" : " (LM +1)"}, Prontidão +2 contra finta, não pode ser flanqueado, Olhar Hipnótico a 9m (Fascinar com +1 de Dif), +2 para resistir a genjutsu ocular e Mímica Sharingan.`,
        sandan && "Sandan: imune à finta acelerada, ataque oportuno contra acelerados, manobras de previsão mesmo desprevenido, Superar Técnica sem penalidade e Reverter Ilusão.",
      );
    },
  },
  {
    id: "susanoo",
    name: "Susanoo",
    has: (c) => hasMangekyouTec(c, "susanoo"),
    sig: (c) => `${espParam(c).val}|${c.attrs.ESP}|${c.attrs.INT}|${c.attrs.FOR}|${c.attrs.DES}|${c.acuidade}|${custoVisao(c, 1)}`,
    stages: (c) => [{ label: "Incompleto" }, { label: "Completo" }, { label: "Perfeito", faint: Math.max(c.attrs.INT, c.attrs.ESP) < 18 }],
    switchCost: () => NO_COST,
    build(e, c) {
      const s = stageOf(e);
      const size: Size = s === 2 ? "Colossal" : "Imenso";
      const { label: espLbl, val: esp } = espParam(c);
      e.src = `Mangekyou · ${["incompleto", "completo", "forma perfeita"][s]}`;
      e.costChk = 10;
      e.costVis = custoVisao(c, 2);
      e.perVis = custoVisao(c, 1);
      e.mods = sizeMods(c, size, { vig: false });
      e.hint = text(
        custoVisao(c, 1) ? "Sustentado; 2 pontos de visão ao ativar e 1 por turno (a mesa desconta). Evoluir de forma é ação parcial, regredir é livre." : "Sustentado; Mangekyou Eterno: sem custo de visão. Evoluir de forma é ação parcial, regredir é livre.",
        `Barreira de dureza 0 e absorção ${(s === 0 ? 2 : 3) * esp} (${s === 0 ? "2" : "3"}× ${espLbl === "Int" ? "Inteligência" : "Espírito"}); com 10 ou menos, restaura tudo com ação de movimento.`,
        s === 0 ? "Incompleto: usa técnicas à distância normalmente." : `Armas de chakra pesadas: dano base ${esp} (${espLbl === "Int" ? "Inteligência" : "Espírito"}), 1 ataque por ação padrão; só técnicas que não partem de você.`,
        s === 2 && "Forma Perfeita: pernas e asas, Voo 18.",
        sizeHint(size).replace(" e tamanho temporário não aumenta a Vitalidade", " (o Susanoo não dá Vigor)"),
      );
    },
  },
  {
    id: "kamui",
    name: "Kamui",
    auto: false,
    has: (c) => hasMangekyouTec(c, "kamui"),
    sig: () => "",
    build(e) {
      e.src = "Mangekyou · ativação";
      e.costChk = 10;
      e.hint = text(
        "Ação livre com selos, contínua; depois as técnicas não pedem selos.",
        "Ativar não gasta visão; cada técnica do Kamui (em Técnicas e ataques) desconta a própria visão ao usar.",
        "Intangibilidade: na defesa é sucesso automático (menos contra crítico), até 5 minutos seguidos; desativar é ação parcial e não gasta visão.",
      );
    },
  },
  {
    id: "byakugan",
    name: "Byakugan",
    has: (c) => hasApt(c, "byakugan"),
    sig: (c) => `${hasApt(c, "tenketsu-byakugan")}|${rastrear(c)}`,
    build(e, c) {
      const alc = 10 + 2 * rastrear(c);
      e.src = "Hyuuga · doujutsu";
      e.costChk = 1;
      e.hint = text(
        `Ação parcial (pode ativar na defesa), dura a cena. Visão de raio-X em 360° até ${alc}m (dobra por concentração com Rastrear 5); ignora camuflagem do ambiente, vê e enxerga através do chakra.`,
        "Não sofre ataque surpresa nem flanqueio. 1×/cena: simular 2 dados em Percepção, Procurar, Prontidão ou Rastrear visuais.",
        hasApt(c, "tenketsu-byakugan") && "Tenketsu: ataque básico de Juuken que acerta pede Vigor (Dif 7 + 2× Juuken) ou o alvo perde 2 de chakra.",
      );
    },
  },
  {
    id: "baika",
    name: "Baika no Jutsu",
    has: (c) => powerLevel(c, "baika") >= 4,
    sig: (c) => `${powerLevel(c, "baika")}|${hasApt(c, "corpulencia")}|${c.attrs.FOR}|${c.attrs.DES}|${c.acuidade}`,
    stages: (c) => ["Grande", "Enorme", "Imenso"].map((label, i) => ({ label, faint: powerLevel(c, "baika") < 4 + i })),
    defaultStage: (c) => clamp(powerLevel(c, "baika") - 4, 0, 2),
    build(e, c) {
      const size = (["Grande", "Enorme", "Imenso"] as const)[stageOf(e)];
      e.src = `Akimichi · ${size}`;
      e.costChk = [3, 4, 5][stageOf(e)];
      e.mods = sizeMods(c, size);
      e.hint = text("Ação de movimento, contínua. Itens e armas crescem junto (o dano das armas não muda). Não pode usar Clone.", sizeHint(size));
    },
  },
  {
    id: "controle-caloria",
    name: "Controle de Caloria",
    has: (c) => hasApt(c, "controle-caloria"),
    sig: (c) => `${powerLevel(c, "baika")}|${hasApt(c, "resiliencia")}`,
    stages: () => [{ label: "Verde" }, { label: "Amarelo" }, { label: "Vermelho" }],
    opt: "Com pílula",
    switchCost: (e, from, to) => (to > from ? { vit: e.costVit, chk: 0, gain: e.gainChk } : NO_COST),
    build(e, c) {
      const s = stageOf(e);
      const L = [
        { vit: 3, chk: 6, f: 2, pen: "fatigado", t: 1 },
        { vit: 5, chk: 10, f: 4, pen: "exausto", t: 2 },
        { vit: 7, chk: 14, f: 6, pen: "inconsciente", t: 0 },
      ][s];
      e.src = `Akimichi · nível ${s + 1} (${["verde", "amarelo", "vermelho"][s]})`;
      e.costVit = L.vit;
      e.gainChk = L.chk;
      // Modo Chou: sem as penalidades da Resiliência (os −3 em Acrobacia e Furtividade ficam no texto).
      e.mods = s === 2 && hasApt(c, "resiliencia") ? [on("FOR", L.f), on("desloc", 5), on("ESQ", 3)] : [on("FOR", L.f)];
      e.turns = e.opt ? 3 : 0;
      e.after = e.opt ? L.pen : "";
      e.afterTurns = e.opt ? L.t : 0;
      e.afterNote = e.opt && s === 2 ? "24 h; Vigor 23 fica só exausto; risco de morte" : "";
      e.hint = text(
        "Ação parcial, sustentada. Cada nível 1×/cena e não dá para voltar a um nível mais baixo depois. O chakra dura a cena e não passa do máximo.",
        s === 2 && `Modo Chou: asas de chakra e sem as penalidades da Resiliência; fora do Baika, usa ${2 * powerLevel(c, "baika")} (2× Baika) como Agilidade no deslocamento e na Finta.`,
        e.opt ? "Pela pílula: dura 3 turnos e a penalidade entra no fim." : "Sem Vigor 14, use a opção “Com pílula”.",
      );
    },
  },
  {
    id: "shikakyu",
    name: "Shikakyu no Jutsu",
    has: (c) => powerLevel(c, "shikakyu") >= 1,
    sig: (c) => `${powerLevel(c, "shikakyu")}`,
    build(e, c) {
      e.src = "Inuzuka · técnica quadrúpede";
      e.costChk = 1;
      e.mods = [on("ini", 2)];
      e.hint = `Ação parcial, contínua. Garras e mordida com dano letal: ½ Força + ${armaPorNivel(powerLevel(c, "shikakyu"))} de dano de arma. Intimidação +1. O Companheiro Animal também pode usar.`;
    },
  },
  {
    id: "hakken",
    name: "Hakken no Jutsu",
    has: (c) => hasApt(c, "hakken"),
    sig: (c) => `${rastrear(c)}`,
    build(e, c) {
      e.src = "Inuzuka · olfato";
      e.costChk = 2;
      e.hint = `Ação livre para ativar ou desativar, contínua. Olfato até ${10 + 2 * rastrear(c)}m (10m + 2× Rastrear): detecta inimigos se aproximando e localiza adversários escondidos pelo cheiro. Teste de Rastrear para notar ataque surpresa.`;
    },
  },
  {
    id: "sensor",
    name: "Sensor",
    has: (c) => hasApt(c, "sensor"),
    sig: (c) => `${rastrear(c)}|${sensorVariant(c)}`,
    opt: "Manter (concentração)",
    build(e, c) {
      const v = sensorVariant(c);
      const alc = 10 + 2 * rastrear(c);
      e.src = v ? `Sensor limitado · ${SENSOR_LIMITES[v]}` : "Sensor de chakra";
      e.costChk = v ? 3 : 5;
      e.turns = e.opt ? 0 : 1;
      e.hint = text(
        `Localiza a posição exata de criaturas com chakra até ${alc}m (10m + 2× Rastrear), sem distinguir assinaturas nem medir o chakra.`,
        e.opt ? "Mantido: ação padrão para usar e concentração para manter." : "Ação de movimento; dura até o início do seu próximo turno. Para manter, ligue “Manter (concentração)”.",
        v === "solo" && "Só com a mão no solo, e só detecta quem está em contato com o solo.",
        v === "olfato" && "Detecta o cheiro, não o chakra: Rastrear Dif 20 (30 com vento, chuva ou cheiros fortes).",
      );
    },
  },
  {
    id: "kagura-shingan",
    name: "Kagura Shingan",
    has: (c) => hasApt(c, "kagura-shingan"),
    sig: (c) => `${rastrear(c)}|${hasApt(c, "ryoushitsu-kagura")}`,
    opt: "Alcance estendido",
    build(e, c) {
      const r = rastrear(c);
      const ryou = hasApt(c, "ryoushitsu-kagura");
      const alc = (20 + 4 * r) * (ryou ? 2 : 1) * (e.opt && r >= 4 ? 2 : 1);
      e.src = ryou ? "Ryoushitsu Kagura Shingan" : "Sensor de chakra";
      e.hint = text(
        `Ativo (procurando): ${alc}m${ryou ? " (dobrado pelo Ryoushitsu)" : ""}; passivo: ${Math.ceil(alc / 2)}m. Distingue as assinaturas, mede o poder, lê emoções e identifica genjutsu no alcance (reação). Não sofre ataque surpresa.`,
        e.opt ? (r >= 4 ? "Alcance estendido: dobrado enquanto mantém concentração (começa com selos, vale a partir do turno seguinte)." : "Alcance estendido pede Rastrear 4.") : "Alcance estendido (Rastrear 4): concentração com selos, dobra o alcance.",
        ryou && `Alcance progressivo: imóvel e concentrado por 2 minutos, ${100 * r}m (100m por Rastrear). Supressão de chakra: para ser detectado, Rastrear Dif ${9 + r}.`,
      );
    },
  },
  {
    id: "jinchuuriki",
    name: "Jinchuuriki",
    has: (c) => powerLevel(c, "jinchuuriki") >= 2,
    sig: (c) => `${powerLevel(c, "jinchuuriki")}|${c.bijuu ?? ""}|${hasApt(c, "corpulencia")}|${c.attrs.FOR}|${c.attrs.DES}|${c.acuidade}`,
    stages: (c) => {
      const lvl = powerLevel(c, "jinchuuriki");
      const out = [{ label: "Presença" }, { label: "Manto", faint: lvl < 3 }, { label: "Modo Bijuu", faint: lvl < 3 }, { label: "Forma Bijuu", faint: lvl < 3 }];
      return bijuu(c).kyuubi ? [...out, { label: "Modo Kurama", faint: lvl < 10 }] : out;
    },
    defaultStage: (c) => (powerLevel(c, "jinchuuriki") >= 3 ? 1 : 0),
    opt: "Controle Total",
    switchCost: (e, _from, to) => (to === 4 ? { vit: 0, chk: 10, gain: 0 } : e.opt ? NO_COST : { vit: e.costVit, chk: 0, gain: 0 }),
    build(e, c) {
      const lvl = powerLevel(c, "jinchuuriki");
      const B = bijuu(c);
      const s = stageOf(e);
      const f = BIJUU_FOR[clamp(lvl - 1, 1, B.tails) - 1];
      const ct = !!e.opt;
      const dmg = (s === 1 || s === 2) && !ct ? (B.kyuubi ? half(lvl) : lvl) : 0;
      const size: Size = lvl >= 10 ? "Colossal" : lvl >= 8 ? "Imenso" : "Enorme";
      let mods: PlayMod[] = [];
      if (s === 0) mods = [on("FOR", 1)];
      if (s === 1) mods = [on("FOR", f), on("dureza", 1), on("acel", 1)];
      if (s === 2) mods = [on("FOR", f), on("AGI", 2), on("dureza", 2), on("acel", 1)];
      if (s === 3) mods = [on("FOR", f), ...(B.nibi ? [on("AGI", 2), on("acel", 1)] : []), on("dureza", 3), ...sizeMods(c, size, { extraFor: f })];
      if (s === 4) mods = [on("FOR", f), on("AGI", 2), on("dureza", 3), on("acel", 1)];
      e.mods = mods;
      e.src = `${B.name} · ${["Presença Bijuu", "Manto Bijuu", "Modo Bijuu", "Forma Bijuu", "Modo Kurama"][s]}${ct ? " · controle total" : ""}`;
      e.costVit = dmg;
      e.perVit = dmg;
      e.costChk = s === 4 ? 10 : ct ? lvl : 0;
      e.hint = text(
        "Presença é ação livre; Manto e Modo são ação parcial com o modo anterior ativo; voltar é livre. Ataques desarmados letais.",
        `Potência da Besta: dano de corpo com ½ Espírito + ${armaPorNivel(lvl)} de arma.`,
        ct
          ? "Controle Total: chakra igual ao nível pago uma vez, troca de modo sem custo e sem limite de duração."
          : `Duração segura: ${1 + lvl} turnos; depois o dano na Vitalidade dobra e até a Presença machuca. Vitalidade em 0: teste de domínio (2 dados contra 9).`,
        B.kyuubi && !ct && "Cura em Frenesi: dano do poder pela metade, mas fica exausto no fim da cena se usou o Manto ou acima.",
        s === 1 && `Manto: ${B.tails < 9 ? `Força limitada a ${B.tails} cauda(s); ` : ""}bloqueia técnicas do tipo projétil.`,
        s === 2 && "Modo Bijuu: sem selos de mão; só técnicas gerais do poder.",
        s === 3 && "Forma Bijuu: sem Braço de Chakra; Onda, Disparo e Bijuudama com +2 de dano e Técnica Poderosa; só técnicas gerais e as da própria bijuu.",
        s === 3 && (B.nibi ? "Matatabi mantém Acelerado e a Agilidade na Forma." : "Perde a Agilidade e o Acelerado do Modo."),
        s === 3 && sizeHint(size),
        s === 4 && "Modo Kurama: Potência da Besta +4 de dano, sensor de emoções negativas, imune à finta super acelerada; Forma Kurama com ação parcial.",
      );
    },
  },
  {
    id: "kyoudo-kyouka",
    name: "Kyoudo Kyouka",
    has: (c) => hasApt(c, "kyoudo-kyouka"),
    sig: (c) => `${espParam(c).val}|${powerLevel(c, "iryou")}`,
    build(e, c) {
      const { label: espLbl, val: esp } = espParam(c);
      e.src = "Chakra acumulado na mão ou no pé";
      e.costChk = half(esp);
      e.hint = `Ação parcial, sem selos, contínua até o golpe. Libera com ação livre num ataque desarmado: dano ${half(esp) + powerLevel(c, "iryou")} (½ ${espLbl === "Int" ? "Inteligência" : "Espírito"} + Iryou), sem Força nem arma; o alvo testa Acrobacia (Dif ${9 + esp}) ou fica caído. Não pode ser bloqueado desarmado nem com arma comum. Desligue depois do golpe.`;
    },
  },
  {
    id: "trabalho-duro",
    name: "Trabalho Duro",
    has: (c) => hasApt(c, "trabalho-duro"),
    sig: () => "",
    build(e) {
      e.src = "Um bônus por turno";
      e.mods = [off("desloc", 5), off("precAtk", 1), off("precDef", 1), off("dano", 1), off("dif", 1)];
      e.pick = 1;
      e.hint = "A cada turno escolha 1 bônus, que vale até o início do seu próximo turno e acumula com outras aptidões. Com Hachimon: só as três primeiras opções e nunca junto com os portões.";
    },
  },
  {
    id: "combate-defensivo",
    name: "Combate Defensivo",
    has: (c) => hasApt(c, "combate-defensivo"),
    sig: () => "",
    build(e) {
      e.src = "Declare antes do ataque";
      e.mods = [on("precAtk", -2), on("ESQ", 3)];
      e.turns = 1;
      e.hint = "Antes de um ataque corpo-a-corpo ou técnica de toque: ataque −2 e Esquiva +3 até o seu próximo turno. Não vale com manobras que dão bônus de precisão (Rasteira, Investida).";
    },
  },
  {
    id: "pele-pedra",
    name: "Pele de Pedra",
    has: (c) => effectCount(c, "pele-pedra") > 0,
    sig: (c) => `${effectCount(c, "pele-pedra")}`,
    build(e, c) {
      const ev = effectCount(c, "pele-pedra") > 1;
      e.src = `Doton · sustentada${ev ? " · Nv 9" : ""}`;
      e.costChk = ev ? 9 : 6;
      e.mods = [on("dureza", ev ? 2 : 1)];
      e.hint = text(
        "Ação de movimento, sem selos. No turno de uso a dureza é a padrão do poder +2 (Doton); sustentada fica a deste estado (a maior dureza vale, não acumula).",
        "Pode ser técnica defensiva com LM (ação de movimento). Com Energizar Doton sustentado: Soco de Pedra, dano letal com 4 de arma.",
      );
    },
  },
  /* ---------- Livro de Hijutsus ---------- */
  {
    id: "senninka",
    name: "Senninka",
    has: (c) => powerLevel(c, "senninka") >= 1,
    sig: (c) => `${powerLevel(c, "senninka")}`,
    stages: (c) => [{ label: "1º estágio" }, { label: "2º estágio", faint: powerLevel(c, "senninka") < 5 }],
    switchCost: (e, from, to, c) => (to > from ? { vit: 0, chk: 2, gain: 3 * powerLevel(c, "senninka") } : NO_COST),
    build(e, c) {
      const lvl = powerLevel(c, "senninka");
      const n = clamp(lvl, 1, 4);
      const s2 = stageOf(e) === 1;
      e.src = `Transformação Eremita · ${s2 ? "2º estágio" : `1º estágio (${n * 25}%)`}`;
      e.costChk = n + (s2 ? 2 : 0);
      e.gainChk = s2 ? 3 * lvl : 0;
      e.mods = s2 ? [...SELO_BONUS(), off("acel", 1)] : SELO_BONUS();
      e.pick = s2 ? 5 : n;
      e.hint = s2
        ? `2º estágio: ação parcial com o 1º completo (+2 chakra). Um bônus fica contínuo (já pago) e mais 4 por turno a 1 chakra cada; entram Acelerado e Chakra +${3 * lvl} 1×/cena. Efeitos do poder: dano 2× nível usado. Força +4 não acumula com Dano Base +2.`
        : `Liberar até ${half(lvl)} nível(is) é ação parcial; acima disso, ação de movimento. 1 chakra por nível liberado; cada bônus custa +1 chakra e dura até o início do seu próximo turno (até ${n} bônus). Dano, precisão e dificuldade valem para o Senninka/CC. Força +4 não acumula com Dano Base +2.`;
    },
  },
  {
    id: "armadura-raios",
    name: "Armadura de Raios",
    has: (c) => hasApt(c, "armadura-raios"),
    sig: (c) => `${aptLevel(c, "armadura-raios")}|${espParam(c).val}`,
    build(e, c) {
      const L = clamp(aptLevel(c, "armadura-raios"), 1, 3);
      const d = [
        { chk: 4, m: 5 },
        { chk: 6, m: 10 },
        { chk: 8, m: 15 },
      ][L - 1];
      e.src = `Nintaijutsu · nível ${L}`;
      e.costChk = d.chk;
      e.mods = [on("dureza", L), on("desloc", d.m), on("acel", 1)];
      e.hint = text(
        `Ação parcial, ${L > 1 ? "contínua" : "sustentada"}. Ataques corporais contam como Energizar Raiton; a dureza é do elemento Raiton.`,
        L > 1 && `Efeitos do Nintaijutsu +${L - 1} de dano.`,
        `Defesa Ativa: ${L >= 3 ? "ação livre" : "ação de movimento"} e 2 chakra; defende com CC e ganha dureza extra igual ao ${espParam(c).label === "Int" ? "Inteligência" : "Espírito"} (${espParam(c).val}) até o fim do turno do atacante.`,
      );
    },
  },
  {
    id: "armadura-areia",
    name: "Armadura de Areia",
    auto: false,
    has: (c) => powerLevel(c, "sabaku") >= 3,
    sig: (c) => `${powerLevel(c, "sabaku")}`,
    build(e, c) {
      const lvl = powerLevel(c, "sabaku");
      e.src = "Sabaku Hijutsu · efeito Nv 3";
      e.costChk = 3;
      e.mods = [on("dureza", clamp(Math.floor(lvl / 2), 1, 3)), on("desloc", -5), on("ESQ", -3)];
      e.hint = "Ação padrão, contínua, sem selos. Quebra com acerto crítico ou ataque que ignore dureza (use o efeito de novo). −3 também em testes de Agilidade, Acrobacia e Furtividade.";
    },
  },

  /* ---------- Livro de Hijutsus Vol. 2 ---------- */
  {
    id: "montaria-argila",
    name: "Montaria de Argila",
    has: (c) => effectCount(c, "montaria") > 0,
    sig: (c) => `${arteNivel(c)}|${peritoEm(c, "arte")}|${effectCount(c, "montaria")}|${powerLevel(c, "kibaku-nendo")}`,
    stages: (c) => [{ label: "Grande" }, { label: "Enorme · Voo", faint: effectCount(c, "montaria") < 2 || powerLevel(c, "kibaku-nendo") < 5 }],
    switchCost: () => NO_COST,
    build(e, c) {
      const enorme = stageOf(e) === 1;
      const size: Size = enorme ? "Enorme" : "Grande";
      const arte = arteNivel(c);
      const s = SIZE[size];
      e.src = `Kibaku Nendo · efeito Nv ${enorme ? 5 : 2}`;
      // O chakra (5) e as bombas saem pelo efeito Montaria em Técnicas e ataques.
      e.mods = [];
      e.hint = text(
        `Montaria Especial ${size}, até ${enorme ? 5 : 2} pessoas. Dureza 0, absorção ${8 * arte} (8 × Arte ${arte}): contador “${ABSORCAO_MONTARIA}”.`,
        `Deslocamento ${10 + Math.floor(arte / 2) + s.d}m (10 + ½ Arte + ${size} ${s.d}m). Precisões iguais às suas, com o tamanho: Furtividade ${sg(s.furt)}${enorme ? "; atacantes médios ganham +1 contra ela" : ""}.`,
        enorme && `Voo ${arte + 2 * peritoEm(c, "arte")} (Arte${peritoEm(c, "arte") ? " + Perito" : ""}; Perícia Inata: Arte também soma). Queda segue a Perturbação do Voo.`,
        "Subir é ação de movimento. Esquiva, Bloqueio e Antecipar são dela: uma defesa por ataque. Grau de dano 3: Acrobacia (Dif 4 + precisão do atacante) ou fica caído.",
        "Não ataca e não tem mente (imune a efeitos mentais). Explodir: use um efeito Kibaku Nendo de nível igual ou menor com as bombas dela; ela some.",
      );
    },
  },
  {
    id: "manto-areia-ferro",
    name: "Manto de Areia de Ferro",
    auto: false,
    has: (c) => powerLevel(c, "jiton") >= 3,
    sig: () => "",
    build(e) {
      e.src = "Jiton (Satetsu) · efeito Nv 3";
      e.costChk = 1;
      e.perChk = 1;
      e.mods = [on("dureza", 1)];
      e.hint = "Ação padrão, contínua, 1 chakra por turno. Não quebra (ataques que ignoram dureza passam, mas o manto fica) e não atrapalha o movimento. Os Membros de Ferro somem com ele.";
    },
  },
  {
    id: "armadura-po-ouro",
    name: "Armadura de Pó de Ouro",
    auto: false,
    has: (c) => powerLevel(c, "jiton") >= 3,
    sig: (c) => `${powerLevel(c, "jiton")}`,
    build(e, c) {
      const lvl = powerLevel(c, "jiton");
      e.src = "Jiton (Sakin) · efeito Nv 3";
      e.costChk = 3;
      e.mods = [on("dureza", clamp(2 + [5, 7, 9].filter((x) => lvl >= x).length, 2, 4)), on("desloc", -10), on("ESQ", -3)];
      e.hint = "Ação padrão, contínua, sem selos. Só quebra se metade ou mais da dureza for ignorada (refaz com ação de movimento e 1 compartimento de pó). Falha automática em Agilidade, Acrobacia e Furtividade; dispensar é ação de movimento.";
    },
  },
  {
    id: "kujaku-voo",
    name: "Voo (Kujaku Myoho)",
    auto: false,
    has: (c) => powerLevel(c, "kujaku") >= 4,
    sig: (c) => `${espParam(c).val}`,
    build(e, c) {
      e.src = "Kujaku Myoho · efeito Nv 4";
      e.costChk = 4;
      e.mods = [on("desloc", 10)];
      e.hint = `Ação padrão, sustentada. Asas de chakra: Voo ${espParam(c).val} (${espParam(c).label === "Int" ? "Inteligência" : "Espírito"}) e condição Alado. Nv 7: leva um 2º alvo por +4 chakra.`;
    },
  },
  {
    id: "olho-aranha",
    name: "Olho de Aranha",
    has: (c) => hasApt(c, "olho-aranha"),
    sig: () => "",
    build(e) {
      e.src = "Gorudogumo · terceiro olho";
      e.costChk = 1;
      e.hint = "Ação parcial para ativar e manter. Perito (+2) em testes de Percepção visuais, pagando 1 chakra por teste. Mira Apurada (se cumprir os requisitos) com grau de dano mínimo 2 ao acertar.";
    },
  },
  {
    id: "rakanken",
    name: "Rakanken",
    has: (c) => hasApt(c, "rakanken"),
    sig: (c) => `${c.attrs.FOR}`,
    build(e, c) {
      e.src = "Daikiga · Punho Arhat";
      e.costChk = half(c.attrs.FOR);
      e.mods = [on("FOR", 4)];
      e.turns = 3;
      e.hint = "Ação livre; Força +4 até o fim do 3º turno. Vale com aptidões de manobra.";
    },
  },

  /* ---------- Guia Avançado ---------- */
  {
    id: "senjutsu",
    name: "Modo Eremita",
    has: (c) => aptLevel(c, "senjutsu") >= 1,
    sig: (c) => `${aptLevel(c, "senjutsu")}|${c.attrs.VIG}|${c.attrs.ESP}|${espParam(c).val}`,
    build(e, c) {
      const lvl = aptLevel(c, "senjutsu");
      const esp = espParam(c).val;
      e.src = `Senjutsu · ${senjutsuPoints(c)} pontos de Chakra Senjutsu`;
      e.gainChk = lvl >= 2 ? 20 : 0;
      e.mods = [off("FOR", 4), off("dano", 2), off("precAtk", 1), off("precDef", 1), off("acel", 1), off("dif", 1), off("dureza", 1)];
      e.hint = text(
        `Ação padrão de concentração (dano ou defesa quebram); ativa no início do seu próximo turno com ${senjutsuPoints(c)} pontos (contador “Chakra Senjutsu”).`,
        "Cada bônus custa 1 ponto e dura até o início do seu próximo turno (Força +4 não acumula com Dano Base +2). Dura enquanto houver pontos, até 10 minutos por dia.",
        `Sensor de chakra ${lvl >= 2 ? 10 + 2 * esp : 5 + esp}m.`,
        lvl >= 2 && "Nível 2: Chakra +20 e Vitalidade +30, 1×/cena cada; o modo passa de uma cena para outra.",
        lvl >= 3 && "Nível 3: Surto de Chakra Natural (ação padrão, 1× por descanso) entra no modo na hora.",
      );
    },
  },
  {
    id: "zui-quan",
    name: "Estilo Zui Quan",
    has: (c) => hasApt(c, "zui-quan"),
    sig: (c) => `${aptLevel(c, "zui-quan")}`,
    build(e, c) {
      const L2 = aptLevel(c, "zui-quan") >= 2;
      e.src = L2 ? "Punhos Bêbados · nível 2" : "Punhos Bêbados";
      e.turns = L2 ? 0 : 5;
      e.hint = text(
        L2 ? "Ação livre, sem bebida e sem a confusão; contínuo." : "Ação parcial bebendo algo forte (1/6 de compartimento), 5 turnos. No início de cada turno role 1d8: 1–2 não faz nada, 3–4 ataca o mais próximo, 5–8 age normalmente.",
        "Sem técnicas (pode sustentar Energizar); golpear desarmado dá uma finta livre; quem te ataca tem 25% de chance de falha. Depois são 2 turnos para entrar de novo.",
      );
    },
  },
  {
    id: "falange",
    name: "Instância de Falange",
    has: (c) => hasApt(c, "falange"),
    sig: () => "",
    build(e) {
      e.src = "Postura com arma longa";
      e.hint = "Ação parcial empunhando arma longa: quem entrar a 1m de você gera um ataque oportuno com ela (não impede a aproximação; Passo Seguro evita). Termina se você se mover, for movido, cair ou soltar a arma.";
    },
  },
];

export const ESTADO_BY_ID: Record<string, EstadoDef> = Object.fromEntries(ESTADOS.map((d) => [d.id, d]));

export const senjutsuPoints = (c: Character) => half(Math.max(c.attrs.VIG, c.attrs.ESP));

/** Remonta o estado a partir da ficha, mantendo a forma escolhida e os bônus ligados/desligados. */
export function refreshEstado(e: PlayEffect, def: EstadoDef, c: Character) {
  const was = new Map(e.mods.map((m) => [`${m.t}:${m.v}`, m.on]));
  const stages = def.stages?.(c);
  if (stages) e.stage = clamp(e.stage ?? def.defaultStage?.(c) ?? 0, 0, stages.length - 1);
  e.costVit = 0;
  e.costChk = 0;
  e.gainChk = 0;
  e.perVit = 0;
  e.perChk = 0;
  e.costVis = 0;
  e.perVis = 0;
  e.turns = 0;
  e.pick = undefined;
  def.build(e, c);
  e.name = def.name;
  e.auto = def.id;
  e.sig = def.sig(c);
  for (const m of e.mods) {
    const k = `${m.t}:${m.v}`;
    if (was.has(k)) m.on = was.get(k)!;
  }
  if (e.pick) {
    const lit = e.mods.flatMap((m, i) => (m.on ? [i] : []));
    lit.slice(e.pick).forEach((i) => (e.mods[i].on = false));
    e.picked = lit.slice(0, e.pick);
  } else e.picked = undefined;
}

export function makeEstado(def: EstadoDef, c: Character): PlayEffect {
  const e = blankEffect();
  if (def.stages) e.stage = def.defaultStage?.(c) ?? 0;
  refreshEstado(e, def, c);
  return e;
}

/* ---------------- contadores de recursos ---------------- */

export const CONTADORES: { id: string; n: string; has: (c: Character) => boolean; max: (c: Character) => number; reset: PlayCounter["reset"]; refresh?: boolean }[] = [
  { id: "senjutsu", n: "Chakra Senjutsu", has: (c) => aptLevel(c, "senjutsu") >= 1, max: senjutsuPoints, reset: "cena" },
  { id: "suika", n: "Pontos Suika", has: (c) => hasApt(c, "suika"), max: (c) => 3 * c.attrs.VIG, reset: "descanso" },
  { id: "shikigami", n: "Pontos Kami", has: (c) => hasApt(c, "shikigami-no-mai"), max: (c) => 3 * c.attrs.ESP, reset: "descanso" },
  // Izanagi (Livro de Hijutsus vol. 2): usos por cena iguais à metade do Espírito ou da Inteligência.
  { id: "izanagi", n: "Izanagi", has: (c) => hasApt(c, "izanagi"), max: (c) => Math.ceil(Math.max(c.attrs.ESP, c.attrs.INT) / 2), reset: "cena" },
  // Kibaku Nendo (Livro de Hijutsus vol. 2): bombas feitas na preparação diária, 30 por compartimento.
  { id: "bombas-argila", n: BOMBAS_ARGILA, has: (c) => powerLevel(c, "kibaku-nendo") > 0, max: () => 30, reset: "descanso" },
  { id: "montaria-absorcao", n: ABSORCAO_MONTARIA, has: (c) => effectCount(c, "montaria") > 0, max: (c) => 8 * arteNivel(c), reset: "cena", refresh: true },
];
