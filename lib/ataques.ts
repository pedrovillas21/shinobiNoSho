import { EFEITO_BY_ID, EXCLUSIVOS, PODER_BY_ID } from "./data/poderes";
import type { PlayView } from "./play";
import { evolutionIndex, hasApt, hasChakraExpandido, powerLevel, talentoNatural, tecIndex, versatileName, versatilePicks } from "./rules";
import type { Character, PlayState, SkillKey } from "./types";

/* ---------------- regras de dano (Livro Básico pág. 91–113 e 257; Guia Avançado pág. 48–55) ---------------- */

/** Como cada efeito calcula o dano base. */
type DmgKind =
  | { k: "comum" } // nível usado + ½ do atributo chave
  | { k: "porNivel"; x: number } // x por nível usado
  | { k: "flechas" } // 2 por projétil, 1 projétil por nível
  | { k: "metade" } // metade do dano comum
  | { k: "valor"; v: number } // valor fixo de dano base
  | { k: "laminas" } // 1 por lâmina + bônus do elemento em cada
  | { k: "canhao2" } // dano do Canhão +2
  | { k: "fixo"; mult: number; txt: string } // dano fixo por nível, sem grau
  | { k: "arma"; arma: number }; // ataque corporal: ½ da maior entre Força e Destreza + dano de arma

interface DmgSpec {
  kind: DmgKind;
  note: string;
  /** Custo de chakra por nível usado (padrão 1). */
  costX?: number;
  /** Custo de chakra fixo, que não depende do nível usado. */
  costFixed?: number;
  /** Não aceita meta-aptidões. */
  noMeta?: boolean;
  /** Canhão: a partir do nível 2 pode ser usado sem chakra, com metade do dano. */
  free?: boolean;
}

export const DANO_EFEITO: Record<string, DmgSpec> = {
  canhao: { kind: { k: "porNivel", x: 2 }, note: "Nv 2+: pode ser usado sem chakra, com metade do dano.", free: true },
  orbe: { kind: { k: "comum" }, note: "Projétil de 0,5m." },
  raio: { kind: { k: "porNivel", x: 2 }, note: "Não pode ser bloqueado." },
  "dano-continuo": { kind: { k: "fixo", mult: 1, txt: "por turno, até 3 turnos" }, note: "Vigor (Dif −3, ação completa) apaga." },
  projetar: { kind: { k: "comum" }, note: "Vigor (Dif −2) ou é deslocado." },
  flechas: { kind: { k: "flechas" }, note: "1 projétil por nível. Bônus de dano entra 1× por alvo." },
  lanca: { kind: { k: "comum" }, note: "Ignora 3 de dureza e 1 de dureza de corpo. Vários alvos dividem o dano." },
  ricochete: { kind: { k: "comum" }, note: "Salta para +1 alvo a cada 2 níveis, até alguém defender." },
  coluna: { kind: { k: "porNivel", x: 2 }, note: "Explosão vertical na área escolhida." },
  nuvem: { kind: { k: "fixo", mult: 1, txt: "por turno em quem falhar no Vigor (Dif −2)" }, note: "Concentração. Também deixa lento." },
  sopro: { kind: { k: "comum" }, note: "Atinge todos no cone." },
  correnteza: { kind: { k: "comum" }, note: "Vigor (Dif −2) ou é empurrado; +1 de dano se colidir." },
  missil: { kind: { k: "comum" }, note: "Role o ataque de novo: se acertar, +1 de dano base." },
  "onda-explosiva": { kind: { k: "comum" }, note: "Vigor (Dif −2) ou é empurrado." },
  cegante: { kind: { k: "comum" }, note: "Alvo com camuflagem parcial por 3 turnos." },
  desastre: { kind: { k: "porNivel", x: 3 }, note: "1× por cena. Ataque de CD no turno de cada um na área.", costX: 3, noMeta: true },
  meteoros: { kind: { k: "fixo", mult: 1, txt: "por meteoro · 6 meteoros" }, note: "Sem bônus de dano. Mirar em alguém: −3 de precisão.", noMeta: true },
  inflamavel: { kind: { k: "canhao2" }, note: "Combustão com o Canhão Katon ou Raiton, na área do efeito.", noMeta: true },
  "lamina-raios": { kind: { k: "comum" }, note: "Ataque de CC. Ignora 1 de dureza e quebra armas no bloqueio." },
  descarga: { kind: { k: "metade" }, note: "Vigor (Dif −3) ou atordoado." },
  "lamina-vento": { kind: { k: "laminas" }, note: "Ação completa. Prontidão ou fica fintado. Só o bônus do elemento." },
  "bracos-serpente": { kind: { k: "arma", arma: 3 }, note: "Arma longa de 6m; bloqueia ataques armados. Contínua depois de criada.", costFixed: 4, noMeta: true },
  "colisao-ondas": { kind: { k: "valor", v: 10 }, note: "Construções sofrem o dobro. Evolução Nv 8: base 14; Nv 10: 18." },
};

/** O que mostrar nos efeitos que não causam dano: dureza da criação, dificuldade do teste do alvo ou só o texto. */
interface UtilSpec {
  show: "dureza" | "dif" | "texto";
  /** Rótulo do número (ex.: "Força ou Escapar"). */
  label?: string;
  txt: string | ((x: { meia: number }) => string);
  difAdj?: number;
  /** Metade da dureza comum (ex.: Prisão de Água). */
  durezaHalf?: boolean;
  costFixed?: number;
}

export const EFEITO_UTIL: Record<string, UtilSpec> = {
  "criar-arma": { show: "texto", txt: "Cria armas simples ou marciais (leves, longas, medianas, de arremesso) ou munição de 1 compartimento. Bloqueiam projéteis.", costFixed: 1 },
  restringente: { show: "dif", label: "Força ou Escapar", txt: "Área no chão: quem está nela fica lento (Nv 6: impedido). Quem já estava tem direito a defesa." },
  barreira: { show: "dureza", txt: "Defesa com LM +2 de precisão (ação de movimento). Muro de metade do tamanho comum; o excedente passa." },
  energizar: { show: "texto", txt: "Punho, arma ou compartimento: pode usar Espírito no lugar de Força/Destreza no dano e bloquear projéteis. Sustentado.", costFixed: 3 },
  algemar: { show: "dureza", txt: "Alvo fica impedido. Sai com ação padrão: Força ou Escapar (Dif comum) ou quebrando as algemas." },
  "deslocamento-vacuo": { show: "texto", txt: ({ meia }) => `+${meia}m de deslocamento (½ Espírito) para um alvo até o seu próximo turno. Ação parcial.`, costFixed: 2 },
  purificar: { show: "texto", txt: "Limpa venenos e substâncias da área. Contra efeito de poder, precisa de nível maior; contra veneno, nível × 2 acima do Venefício." },
  repelir: { show: "dureza", txt: "Reação a projétil, toque ou golpe: LM +1. Se absorver, empurra os adjacentes 1m; se quebrar, o excedente passa." },
  imergir: { show: "texto", txt: "Funde-se ao chão ou à criação: Perito em Furtividade, parado, visão de 10m (Nv 4: move com metade do deslocamento). Ação completa." },
  tremor: { show: "dif", label: "Acrobacia", txt: "Círculo de 2m (Nv 4: tamanho comum): quem falha na defesa fica caído; pode gastar movimento para testar Acrobacia." },
  "pele-pedra": { show: "dureza", label: "Dureza de corpo", txt: "Até o fim do turno (sustentada: 1). Pode ser técnica defensiva com LM. Com Energizar Doton: soco letal, dano de arma 4." },
  venenoso: { show: "texto", txt: "Cone que injeta um veneno seu (até nível II) sem causar dano. O veneno é consumido." },
  afiar: { show: "texto", txt: "Arma real de corte ou perfuração: benefícios do Energizar, ignora 1 de dureza, +1 na margem de crítico e lâmina estendida." },
  flutuar: { show: "texto", txt: "Voa sobre o Leque Gigante (Voo = Espírito, condição Alado). Também amortece quedas.", costFixed: 5 },
  "arma-eletrica": { show: "texto", txt: "Energizar armas de corte/perfuração (3), criar projéteis elétricos (1) ou lâmina que ignora 1 de dureza (4)." },
  nevoa: { show: "dureza", label: "Dureza imaginária", txt: "Círculo de 30m + 3m por Espírito: além de 1m, camuflagem parcial (Nv 5: total). Sustentada." },
  "prisao-agua": { show: "dureza", durezaHalf: true, txt: "Alvo a 1m fica paralisado (Força com Dif comum para se soltar). Concentração." },
  "infligir-medo": { show: "dif", label: "Inteligência", difAdj: -2, txt: "Alvo assustado por 2 rodadas (Nv 5: amedrontado; Nv 7: aterrorizado). −1 na Dif por alvo extra." },
};

/* ---------------- alcance e área ---------------- */

/**
 * Alcance e tamanho comum de cada poder (Livro Básico pág. 93–111; Livros de Hijutsus).
 * Curto = 5m + 1m, Médio = 10m + 2m, Longo = 15m + 3m por nível do atributo chave;
 * tamanho = metros por nível do atributo chave. O resto segue o Ninpou (Médio, 1m).
 */
const PARAMS: Record<string, { alc: "curto" | "medio" | "longo"; tam: number }> = {
  doton: { alc: "curto", tam: 1 },
  katon: { alc: "medio", tam: 2 },
  raiton: { alc: "longo", tam: 0.5 },
  "hebi-ninpou": { alc: "curto", tam: 1 },
  ototon: { alc: "curto", tam: 1 },
  sabaku: { alc: "medio", tam: 2 },
  kujaku: { alc: "medio", tam: 2 },
  "kumo-ninpou": { alc: "longo", tam: 1 },
  "kibaku-nendo": { alc: "longo", tam: 2 },
  youton: { alc: "longo", tam: 2 },
  futton: { alc: "medio", tam: 2 },
};

export function alcanceTamanho(powerId: string, key: number) {
  const pr = PARAMS[powerId] ?? { alc: "medio", tam: 1 };
  const alcance = pr.alc === "curto" ? 5 + key : pr.alc === "longo" ? 15 + 3 * key : 10 + 2 * key;
  return { alcance, tamanho: Math.ceil(pr.tam * key), alcLabel: pr.alc === "curto" ? "curto" : pr.alc === "longo" ? "longo" : "médio" };
}

export interface Geo {
  alcance: string;
  area?: string;
}

const m = (n: number) => `${n}m`;

/** Alcance e área de cada efeito, com o alcance (A) e o tamanho (T) comuns do poder. */
function geo(eff: string, x: { A: number; T: number; lvl: number; ev: number; key: number }): Geo {
  const { A, T, lvl, ev, key } = x;
  const halfA = Math.ceil(A / 2);
  switch (eff) {
    case "canhao":
    case "orbe":
    case "dano-continuo":
    case "deslocamento-vacuo":
      return { alcance: m(A), area: "1 criatura" };
    case "raio":
      return { alcance: m(A), area: ev >= 1 ? `${Math.max(1, Math.floor(lvl / 2))} alvos, até 4m entre si` : "1 criatura" };
    case "projetar":
    case "cegante":
      return { alcance: `${m(halfA)} (½)`, area: "1 criatura" };
    case "flechas":
      return { alcance: m(A), area: `${lvl} projéteis, 1 ou mais alvos` };
    case "lanca":
      return { alcance: m(A), area: "1 ou mais alvos (divide o dano)" };
    case "ricochete":
      return { alcance: m(A), area: `+${Math.floor(lvl / 2)} alvos a até 10m do primeiro` };
    case "coluna":
      return { alcance: m(A), area: `cilindro de ${m(T)} de diâmetro e altura` };
    case "nuvem":
      return { alcance: m(A), area: `círculo de ${m(2 * T)} de diâmetro` };
    case "sopro":
      return { alcance: m(A), area: `cone de ${m(T)}` };
    case "venenoso":
      return { alcance: m(A), area: `cone de ${m(T)}` };
    case "correnteza":
      return { alcance: m(A), area: `onda de ${m(T)} de largura e altura` };
    case "colisao-ondas":
      return { alcance: m(A), area: `onda de ${m(T)}` };
    case "missil":
      return { alcance: m(A), area: `linha até ${m(A)}` };
    case "onda-explosiva":
      return { alcance: "ao seu redor", area: `meia-esfera de ${m(T)} ou círculo de ${m(2 * T)} de diâmetro` };
    case "descarga":
      return { alcance: `${m(A)} ou toque`, area: `meia-esfera ou círculo de ${m(T)}` };
    case "desastre":
      return { alcance: `epicentro até ${m(2 * A)}`, area: `área de ${m(3 * T)}` };
    case "meteoros":
      return { alcance: m(A), area: "6 esferas de 5m de diâmetro" };
    case "inflamavel":
    case "restringente":
    case "purificar":
      return { alcance: m(A), area: `círculo de ${m(T)} de diâmetro` };
    case "tremor":
      return { alcance: m(A), area: ev >= 1 ? `círculo de ${m(T)}` : "círculo de 2m" };
    case "barreira":
      return { alcance: m(A), area: ev >= 1 ? `redoma de até ${m(Math.ceil(T / 2))}` : `muro de até ${m(Math.ceil(T / 2))}` };
    case "algemar":
      return { alcance: m(A), area: ev >= 2 ? "até 3 alvos a 5m entre si" : "1 criatura" };
    case "repelir":
      return { alcance: m(A), area: "você ou alguém no alcance" };
    case "infligir-medo":
      return { alcance: m(A), area: "1 ou mais criaturas" };
    case "lamina-raios":
      return { alcance: "toque", area: "1 criatura" };
    case "lamina-vento":
      return { alcance: "5m", area: "1 criatura" };
    case "bracos-serpente":
      return { alcance: "pessoal · braços de 6m" };
    case "nevoa":
      return { alcance: "1m", area: `círculo de ${m(30 + 3 * key)} de diâmetro` };
    case "prisao-agua":
      return { alcance: "1m", area: "1 criatura" };
    case "arma-eletrica":
      return { alcance: "pessoal · lâmina estende até 5m" };
    default:
      // Energizar, Criar Arma, Afiar, Pele de Pedra, Imergir, Flutuar…
      return { alcance: "pessoal" };
  }
}

/** Dureza extra das criações do elemento. */
const DUREZA: Record<string, number> = {
  doton: 2,
};

/** Bônus de dano do elemento (“Dano Adicional”). */
const ELEMENTO: Record<string, number> = {
  fuuton: 2,
  katon: 2,
  raiton: 1,
  mokuton: 1,
  "kami-ninpou": 1,
  kujaku: 1,
  "kibaku-nendo": 2,
  youton: 1,
  futton: 2,
  ranton: 1,
};

/** “Dificuldade de Resistência Aumentada” de alguns poderes. */
const DIF_PODER: Record<string, number> = {
  "hebi-ninpou": 1,
};

/** Poderes que contam como “Ninpou e elementos” para a aptidão Capacidade. */
const NINPOU_E_ELEMENTOS = ["ninpou", "doton", "fuuton", "katon", "raiton", "suiton", "versatilidade", "hibon"];

/** Poderes cujos parâmetros usam uma perícia no lugar do Espírito. */
const CHAVE_PERICIA: Record<string, { k: SkillKey; label: string; optional?: boolean }> = {
  "kikai-ninpou": { k: "animais", label: "Lidar c/ Animais" },
  dokujutsu: { k: "venef", label: "Venefício" },
  "kibaku-nendo": { k: "arte", label: "Arte" },
  "kami-ninpou": { k: "arte", label: "Arte", optional: true },
};

/* ---------------- montagem ---------------- */

export interface Calc {
  base: number;
  cost: number;
  dif: number;
  /** Partes do dano base, para mostrar de onde vem o número. */
  parts: string[];
  /** Dano fixo (não multiplica pelo grau). */
  fixed?: { v: number; txt: string };
  /** Ataque sem teste de resistência (ex.: arma criada). */
  noDif?: boolean;
  /** Efeito sem dano: número principal (dureza ou Dif) e o que ele faz. */
  info?: { v?: number; label?: string; txt: string };
  /** Alcance e área de efeito. */
  geo?: Geo;
}

export interface AtkRow {
  key: string;
  name: string;
  sub: string;
  note: string;
  min: number;
  max: number;
  meta: boolean;
  free: boolean;
  /** Grau mínimo garantido (ex.: Rasengan Elemental). */
  minGrau?: number;
  /** Técnica Poderosa embutida (ex.: Oodama Rasengan). */
  plusHalf?: boolean;
  /** Efeito que não causa dano. */
  util?: boolean;
  calc: (lvl: number, o: { free?: boolean; pot?: PotMode }) => Calc;
}

/** Melhoramento escolhido no Potencializar (Livro Básico, aptidões de técnica). */
export type PotMode = "dano" | "alcance" | "area";

export interface AtkGroup {
  id: string;
  title: string;
  level: number;
  keyLabel: string;
  keyVal: number;
  /** Alcance e tamanho comum do poder, em metros. */
  alcance?: number;
  tamanho?: number;
  /** Bônus que entram em todo efeito do poder. */
  bonus: { label: string; v: number }[];
  extra: number;
  rows: AtkRow[];
}

/** Poderes de técnicas prontas ou livres: só a lista do que foi liberado. */
export interface OutroPoder {
  id: string;
  title: string;
  level: number;
  items: string[];
  note: string;
}

const half = (n: number) => Math.ceil(n / 2);

function chave(c: Character, v: PlayView, powerId: string) {
  const sk = CHAVE_PERICIA[powerId];
  let label = "Esp";
  let val = v.attrs.ESP;
  if (hasApt(c, "controle-perfeito") && v.attrs.INT > val) {
    label = "Int";
    val = v.attrs.INT;
  }
  if (sk) {
    const s = v.skills.find((x) => x.key === sk.k)?.eff ?? 0;
    if (!sk.optional || s > val) {
      label = sk.label;
      val = s;
    }
  }
  return { label, val };
}

/** Efeito escolhido num poder: nome da técnica e evolução alcançada. */
interface EffPick {
  eff: string;
  tech: string;
  ev: number;
  /** Ganho pelo Talento Natural. */
  talento?: boolean;
}

/** Junta a mesma escolha feita em compras diferentes, guardando a evolução mais alta. */
function addPick(picks: EffPick[], x: EffPick) {
  const cur = picks.find((y) => y.eff === x.eff);
  if (!cur) picks.push(x);
  else {
    cur.ev = Math.max(cur.ev, x.ev);
    if (!cur.tech) cur.tech = x.tech;
  }
}

/** Talento Natural: o efeito vem com todas as evoluções que o nível do poder já permite (Livro Básico, pág. 243). */
function addTalento(g: { level: number; picks: EffPick[] }, eff: string) {
  const e = EFEITO_BY_ID[eff];
  if (!e || e.level > g.level) return;
  const ev = (e.evolves ?? []).filter((l) => l <= g.level).length;
  const cur = g.picks.find((y) => y.eff === eff);
  if (cur) {
    cur.ev = Math.max(cur.ev, ev);
    cur.talento = true;
  } else g.picks.push({ eff, tech: "", ev, talento: true });
}

export function ataques(c: Character, v: PlayView, p: PlayState): AtkGroup[] {
  const groups: AtkGroup[] = [];
  const estado = v.dano;
  const tn = talentoNatural(c);

  // Poderes com efeitos (Ninpou, elementos e parecidos). Comprar o mesmo poder 2× usa o nível mais alto.
  const byId = new Map<string, { level: number; picks: EffPick[] }>();
  for (const pe of c.poderes) {
    const def = PODER_BY_ID[pe.id];
    if (!def || def.mode !== "efeitos" || pe.id === "versatilidade") continue;
    const g = byId.get(pe.id) ?? { level: 0, picks: [] };
    g.level = Math.max(g.level, pe.level);
    pe.effects.slice(0, pe.level).forEach((eff, i) => {
      if (!eff || !EFEITO_BY_ID[eff]) return;
      // Escolher o efeito de novo = evolução.
      addPick(g.picks, { eff, tech: pe.techniques[i]?.trim() ?? "", ev: evolutionIndex(pe.effects, i) });
    });
    byId.set(pe.id, g);
  }
  for (const [id, g] of byId) {
    if (id === "hibon" && tn?.target === "hibon") addTalento(g, tn.eff);
    if (g.picks.length) groups.push(effectGroup(c, v, p, { key: id, powerId: id, title: PODER_BY_ID[id].name, level: g.level, picks: g.picks }));
  }

  // Versatilidade: cada poder versátil vira um grupo com alcance, tamanho e bônus do próprio elemento.
  // Os parâmetros usam o nível de Versatilidade mais alto entre as compras (como no Ninpou comprado 2×).
  const vLevel = powerLevel(c, "versatilidade");
  const seen = new Set<string>();
  for (const pe of c.poderes) {
    if (pe.id !== "versatilidade") continue;
    (pe.versatile ?? []).forEach((id, k) => {
      if (!id || seen.has(id) || PODER_BY_ID[id]?.mode !== "efeitos") return;
      seen.add(id);
      const g = { level: vLevel, picks: [] as EffPick[] };
      for (const x of versatilePicks(pe, k)) if (x.eff && EFEITO_BY_ID[x.eff]) addPick(g.picks, { eff: x.eff, tech: x.tech.trim(), ev: x.ev });
      if (tn?.target === id) addTalento(g, tn.eff);
      if (g.picks.length) groups.push(effectGroup(c, v, p, { key: `versatilidade:${id}`, powerId: id, title: versatileName(id), level: vLevel, picks: g.picks }));
    });
  }

  // Rasengan (Livro Básico pág. 121–122)
  const ras = c.poderes.filter((x) => x.id === "rasengan").reduce((m, x) => Math.max(m, x.level), 0);
  if (ras) {
    const k = chave(c, v, "rasengan");
    const ce = hasChakraExpandido(c);
    const completo = ras >= 6 && (k.val >= 14 || (ce && k.val >= 12));
    const oodama = ras >= 7 && (k.val >= 16 || (ce && k.val >= 14)) && hasApt(c, "tecnica-poderosa");
    const extra = p.dmgExtra?.rasengan ?? 0;
    const fin = (base: number, parts: string[]): Calc => {
      if (extra) parts.push(`extra ${extra}`);
      if (estado) parts.push(`estado ${estado}`);
      return { base: Math.max(0, base + extra + estado), cost: ras, dif: 7 + ras + half(k.val), parts, geo: { alcance: "toque", area: "1 criatura" } };
    };
    const rows: AtkRow[] = [
      {
        key: "rasengan:basico",
        name: "Rasengan",
        sub: "Básico · ação completa",
        note: "Alvo é jogado a 3m; Vigor para não cair. Quebra armas no bloqueio. Sem meta-aptidões.",
        min: ras,
        max: ras,
        meta: false,
        free: false,
        calc: () => fin(2 + ras + half(k.val), ["2", `Nv ${ras}`, `½${k.label} ${half(k.val)}`]),
      },
    ];
    if (completo)
      rows.push({
        key: "rasengan:completo",
        name: "Rasengan Completo",
        sub: "Ação padrão",
        note: "Mesmo efeito do básico, com o dano cheio do Espírito.",
        min: ras,
        max: ras,
        meta: false,
        free: false,
        calc: () => fin(ras + k.val, [`Nv ${ras}`, `${k.label} ${k.val}`]),
      });
    if (oodama)
      rows.push({
        key: "rasengan:oodama",
        name: "Oodama Rasengan",
        sub: "Ação completa · Técnica Poderosa",
        note: "Grau de dano +0,5 já incluso. Manter-se de pé fica 1 nível mais difícil.",
        min: ras,
        max: ras,
        meta: false,
        free: false,
        plusHalf: true,
        calc: () => fin(ras + k.val, [`Nv ${ras}`, `${k.label} ${k.val}`]),
      });
    if (completo && ras >= 9)
      rows.push({
        key: "rasengan:elemental",
        name: "Rasengan Elemental",
        sub: "Ação completa · explode em 10m",
        note: "Grau mínimo 2 no alvo direto. Você sofre o dano base com grau 1.",
        min: ras,
        max: ras,
        meta: false,
        free: false,
        minGrau: 2,
        calc: () => {
          const r = fin(ras + k.val, [`Nv ${ras}`, `${k.label} ${k.val}`]);
          return { ...r, cost: 2 + ras, geo: { alcance: "toque", area: "explode em 10m ao redor do alvo" } };
        },
      });
    groups.push({ id: "rasengan", title: "Rasengan", level: ras, keyLabel: k.label, keyVal: k.val, bonus: [], extra, rows });
  }

  return groups;
}

/**
 * Grupo de ataques de um poder de efeitos. `key` identifica o grupo (e o bônus extra anotado);
 * `powerId` dá o alcance, o tamanho, o bônus do elemento e o atributo chave (num poder versátil, o do elemento).
 */
function effectGroup(c: Character, v: PlayView, p: PlayState, o: { key: string; powerId: string; title: string; level: number; picks: EffPick[] }): AtkGroup {
  const { key, powerId: id, level } = o;
  const estado = v.dano;
  const k = chave(c, v, id);
  const at = alcanceTamanho(id, k.val);
  const elem = ELEMENTO[id] ?? 0;
  const bonus: AtkGroup["bonus"] = [];
  if (elem) bonus.push({ label: (PODER_BY_ID[id]?.name ?? o.title).split(" (")[0], v: elem });
  if (id === "suiton" && hasApt(c, "elemento-natural-suiton")) bonus.push({ label: "Elemento Natural", v: 2 });
  if (id === "doton" && hasApt(c, "elemento-natural-terra")) bonus.push({ label: "Elemento Natural", v: 1 });
  const capacidade = hasApt(c, "capacidade") && NINPOU_E_ELEMENTOS.includes(id);
  const extra = p.dmgExtra?.[key] ?? 0;
  const elemTotal = bonus.reduce((t, b) => t + b.v, 0);

  const rows: AtkRow[] = o.picks
    .map(({ eff, tech, ev, talento }): AtkRow => {
      const e = EFEITO_BY_ID[eff];
      const spec = DANO_EFEITO[eff];
      const tag = talento ? "Talento Natural" : "";
      if (!spec) return utilRow(key, id, eff, tech, ev, level, k, v, tag);
      const effName = e.name.replace(/ \(.*\)$/, "");
      const evoLvl = ev ? e.evolves?.[ev - 1] : undefined;
      const evoTxt = evoLvl ? `evoluído Nv ${evoLvl}` : "";
      const meta = !spec.noMeta;
      return {
        key: `${key}:${eff}`,
        name: tech || effName,
        sub: [tech ? effName : "", evoTxt, tag].filter(Boolean).join(" · "),
        note: spec.note,
        min: e.level,
        max: spec.costFixed ? e.level : Math.max(e.level, level),
        meta,
        free: !!spec.free,
        calc: (lvl, opt) => ({
          ...dmgCalc(lvl, opt),
          // Potencializar: dobra o alcance ou a área, à escolha.
          geo: geo(eff, { A: at.alcance * (meta && opt.pot === "alcance" ? 2 : 1), T: at.tamanho * (meta && opt.pot === "area" ? 2 : 1), lvl, ev, key: k.val }),
        }),
      };
      function dmgCalc(lvl: number, opt: { free?: boolean; pot?: PotMode }): Calc {
        const comum = lvl + half(k.val);
        const dif = 9 + lvl + half(k.val) + v.dif + (DIF_PODER[id] ?? 0);
        // Orbe Nv 7 (evolução): usado no nível 7 ou mais, custa metade do chakra.
        const cost = spec.costFixed ?? (eff === "orbe" && ev >= 1 && lvl >= 7 ? Math.ceil(lvl / 2) : lvl * (spec.costX ?? 1));
        const kind = spec.kind;
        if (kind.k === "fixo") {
          // Nuvem Nv 10 (evolução): dano fixo dobrado.
          const mult = eff === "nuvem" && ev >= 2 ? 2 * kind.mult : kind.mult;
          return { base: 0, cost, dif, parts: [`${mult} × Nv ${lvl}`], fixed: { v: mult * lvl, txt: kind.txt } };
        }
        const parts: string[] = [];
        let base = 0;
        if (kind.k === "comum") {
          base = comum;
          parts.push(`Nv ${lvl}`, `½${k.label} ${half(k.val)}`);
        } else if (kind.k === "porNivel") {
          base = kind.x * lvl;
          parts.push(`${kind.x} × Nv ${lvl}`);
        } else if (kind.k === "flechas") {
          base = 2 * lvl;
          parts.push(`${lvl} projéteis × 2`);
        } else if (kind.k === "metade") {
          base = half(comum);
          parts.push(`½ comum ${half(comum)}`);
        } else if (kind.k === "valor") {
          // Colisão de Ondas: 10, 14 com a evolução Nv 8 e 18 com a Nv 10.
          base = eff === "colisao-ondas" ? [10, 14, 18][Math.min(ev, 2)] : kind.v;
          parts.push(`${base}`);
        } else if (kind.k === "canhao2") {
          base = 2 * lvl + 2;
          parts.push(`Canhão ${2 * lvl}`, "combustão 2");
        } else if (kind.k === "arma") {
          const forDes = Math.max(v.attrs.FOR, v.attrs.DES);
          const parts2 = [`½${v.attrs.DES > v.attrs.FOR ? "Des" : "For"} ${half(forDes)}`, `arma ${kind.arma}`];
          if (estado) parts2.push(`estado ${estado}`);
          return { base: Math.max(0, half(forDes) + kind.arma + estado), cost, dif, parts: parts2, noDif: true };
        } else if (kind.k === "laminas") {
          const per = 1 + elemTotal;
          return { base: per * lvl, cost, dif, parts: [`${lvl} lâminas × ${per}`] };
        }
        for (const b of bonus) parts.push(`${b.label} ${b.v}`);
        base += elemTotal;
        if (capacidade && !EXCLUSIVOS.includes(eff)) {
          base += 1;
          parts.push("Capacidade 1");
        }
        if (extra) {
          base += extra;
          parts.push(`extra ${extra}`);
        }
        if (estado) {
          base += estado;
          parts.push(`estado ${estado}`);
        }
        if (opt.pot === "dano" && meta) {
          base += 1;
          parts.push("Potencializar 1");
        }
        if (opt.free && spec.free && lvl >= 2) return { base: Math.max(0, half(base)), cost: 0, dif, parts: [`(${partsText(parts)}) ÷ 2`] };
        return { base: Math.max(0, base), cost, dif, parts };
      }
    })
    // Primeiro o que causa dano, depois o resto; cada parte pelo nível do efeito.
    .sort((a, b) => Number(!!a.util) - Number(!!b.util) || a.min - b.min);

  return { id: key, title: o.title, level, keyLabel: k.label, keyVal: k.val, alcance: at.alcance, tamanho: at.tamanho, bonus, extra, rows };
}

function utilRow(groupKey: string, powerId: string, eff: string, tech: string, ev: number, level: number, k: { label: string; val: number }, v: PlayView, tag = ""): AtkRow {
  const e = EFEITO_BY_ID[eff];
  const spec: UtilSpec = EFEITO_UTIL[eff] ?? { show: "texto", txt: e.desc };
  const effName = e.name.replace(/ \(.*\)$/, "");
  const evoLvl = ev ? e.evolves?.[ev - 1] : undefined;
  const txt = typeof spec.txt === "function" ? spec.txt({ meia: half(k.val) }) : spec.txt;
  return {
    key: `${groupKey}:${eff}`,
    name: tech || effName,
    sub: [tech ? effName : "", evoLvl ? `evoluído Nv ${evoLvl}` : "", tag].filter(Boolean).join(" · "),
    note: "",
    min: e.level,
    max: spec.costFixed ? e.level : Math.max(e.level, level),
    meta: false,
    free: false,
    util: true,
    calc: (lvl) => {
      const comum = lvl + half(k.val);
      const dif = 9 + comum + v.dif + (DIF_PODER[powerId] ?? 0);
      const cost = spec.costFixed ?? lvl;
      const { alcance: A, tamanho: T } = alcanceTamanho(powerId, k.val);
      const out: Calc = { base: 0, cost, dif, parts: [], noDif: true, info: { txt }, geo: geo(eff, { A, T, lvl, ev, key: k.val }) };
      if (spec.show === "dureza") {
        // Barreira Nv 9 (evolução): dureza +2.
        const full = comum + (DUREZA[powerId] ?? 0) + (eff === "barreira" && ev >= 2 ? 2 : 0);
        out.info = { v: spec.durezaHalf ? half(full) : full, label: spec.label ?? "Dureza", txt };
      } else if (spec.show === "dif") {
        out.info = { v: dif + (spec.difAdj ?? 0), label: `Dif · ${spec.label ?? "resistência"}`, txt };
      }
      return out;
    },
  };
}

/** Poderes de técnicas prontas (exceto Rasengan, que tem cálculo) e poderes livres ou personalizados. */
export function outrosPoderes(c: Character): OutroPoder[] {
  const out: OutroPoder[] = [];
  c.poderes.forEach((pe, i) => {
    const def = PODER_BY_ID[pe.id];
    if (def?.mode === "efeitos" || pe.id === "rasengan") return;
    const items = def?.mode === "tecnicas" ? (def.techniques ?? []).filter((t) => t.level <= pe.level).map((t) => `Nv ${t.level} · ${t.name}`) : pe.techniques.map((t) => t.trim()).filter(Boolean);
    out.push({ id: `${pe.id}:${i}`, title: def?.name ?? pe.customName ?? "Poder", level: pe.level, items, note: pe.note?.trim() ?? "" });
  });
  // Poder de técnicas usado como versátil (Fuuinjutsu): só as técnicas escolhidas nos níveis dele.
  c.poderes.forEach((pe, i) => {
    if (pe.id !== "versatilidade") return;
    (pe.versatile ?? []).forEach((id, k) => {
      const def = PODER_BY_ID[id];
      if (def?.mode !== "tecnicas") return;
      const items = versatilePicks(pe, k)
        .map((x) => def.techniques?.[tecIndex(x.eff)])
        .filter((t): t is NonNullable<typeof t> => !!t)
        .map((t) => `Nv ${t.level} · ${t.name}`);
      out.push({ id: `versatilidade:${id}:${i}`, title: versatileName(id), level: pe.level, items: [...new Set(items)], note: "" });
    });
  });
  return out;
}

/** Dano final de cada grau (1 a 4). Técnica Poderosa soma 0,5 ao grau e arredonda para cima. */
export function graus(base: number, plusHalf: boolean, minGrau = 1) {
  return [1, 2, 3, 4].map((g) => ({ g, v: g < minGrau ? null : Math.ceil(base * (g + (plusHalf ? 0.5 : 0))) }));
}

export const GRAU_2D8 = ["4–8", "9–11", "12–14", "15–16"];

export const partsText = (parts: string[]) => parts.join(" + ");
