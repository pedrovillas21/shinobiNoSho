import { ARMAS, ARMA_BY_ID, armaDoItem, armaReq, norm, type Arma } from "./data/armas";
import { combatTotal, espParam, hasApt, powerLevel } from "./rules";
import type { AttrKey, Character, CombatKey } from "./types";

/*
 * Dano de ataques corporais e com armas (Livro Básico, pág. 257): ½ Força + dano de arma no corpo-a-corpo,
 * ½ Destreza + dano de arma à distância. Por cima entram as aptidões (Punho de Ferro, Dano Extra, Atirador…)
 * e as regras de clã e hijutsu que trocam o atributo ou o dano de arma (Juuken, Shikakyu, Potência da Besta…).
 */

export interface DanoCtx {
  /** Atributos usados no dano (da ficha ou já com os estados da mesa). */
  attrs: Record<AttrKey, number>;
  combat: Record<CombatKey, number>;
  /** Bônus de dano base dos estados ligados. */
  dano?: number;
  /** Hachimon aberto: a Força do dano (bônus do portão dobrado) e o portão. Anula os outros bônus de dano e de Força. */
  hachimon?: { gate: number; forDano: number };
  /** Arma ou punho energizado: Espírito no lugar de Força/Destreza. */
  energizar?: boolean;
  /** Ataque Poderoso declarado: +1 de dano corpo-a-corpo. */
  poderoso?: boolean;
  /** Modo Kurama ligado: Potência da Besta +4. */
  kurama?: boolean;
  /** Armadura de Raios ligada: ataques corporais contam como Energizar Raiton. */
  armaduraRaios?: boolean;
}

export interface AtaqueBasico {
  key: string;
  name: string;
  /** Clã, hijutsu ou aptidão de onde vem o ataque. */
  tag?: string;
  test: "CC" | "CD";
  corpo: boolean;
  base: number;
  parts: string[];
  /** true, false ou "escolha" (Punho de Ferro). */
  letal: boolean | "escolha";
  crit: number;
  tipo: string;
  alcance: string;
  note: string;
  /** Requisito de atributo ou de proficiência que a ficha não cumpre. */
  warn: string[];
  /** Chakra por uso. */
  cost: number;
  /** Alcance sem penalidade de uma arma à distância, em metros (até o dobro −1, até o quádruplo −3). */
  faixa?: number;
  /** Ajuste do teste de acerto (Especialista +1, sem Usar Arma −3) e de onde ele vem. */
  prec?: { v: number; why: string[] };
  /** Nível variável (Bisturi de Chakra): o dano é recalculado pelo nível usado. */
  lvl?: { min: number; max: number; calc: (l: number) => { base: number; parts: string[] } };
}

const half = (n: number) => Math.ceil(n / 2);

/** Dano de arma das técnicas que crescem com o poder (Juuken, Shikakyu, Potência da Besta): 1, 2 no 4, 3 no 5, 4 no 6. */
export const armaPorNivel = (lvl: number) => (lvl >= 6 ? 4 : lvl === 5 ? 3 : lvl === 4 ? 2 : 1);

/** Punho de Ferro: dano de arma pela Força original (sem bônus): 1, 2 com Força 8, 3 com 10, 4 com 12. */
export const punhoDeFerro = (c: Character) => (!hasApt(c, "punho-ferro") ? 0 : c.attrs.FOR >= 12 ? 4 : c.attrs.FOR >= 10 ? 3 : c.attrs.FOR >= 8 ? 2 : 1);

/** Escolha da aptidão Atirador (Livro Básico, aptidões de combate), guardada em `variant`. */
export const ATIRADOR: Record<string, string> = { arcos: "arcos, +1 de dano", arremesso: "armas simples de arremesso, +3 de dano" };

export const critText = (n: number) => (n >= 15 ? "15-16" : Array.from({ length: 17 - n }, (_, i) => n + i).join("-"));

export function fichaCtx(c: Character): DanoCtx {
  return { attrs: c.attrs, combat: { CC: combatTotal(c, "CC"), CD: combatTotal(c, "CD"), ESQ: combatTotal(c, "ESQ"), LM: combatTotal(c, "LM") } };
}

/** O efeito foi escolhido em algum poder (inclui Versatilidade e Hibon). */
const hasEffect = (c: Character, id: string) => c.poderes.some((p) => p.effects.slice(0, p.level).includes(id));

/** A ficha tem algum jeito de energizar golpes (Energizar, Afiar, Arma Elétrica, Lâmina de Chakra, Armadura de Raios). */
export const podeEnergizar = (c: Character) =>
  hasEffect(c, "energizar") || hasEffect(c, "afiar") || hasEffect(c, "arma-eletrica") || hasApt(c, "sabre-samurai") || hasApt(c, "armadura-raios");

const temAcuidade = (c: Character, a?: Arma) => hasApt(c, "acuidade") || hasApt(c, "lamina-lua") || hasApt(c, "acuidade-perfeita") || (!!a?.espada && hasApt(c, "iaido"));

/* ---------------- categorias de Especialista, Usar Arma, Dano Extra e Crítico Aprimorado ---------------- */

const CAT_RX: [RegExp, string][] = [
  [/desarmad|punho|taijutsu/, "desarmado"],
  [/natura/, "natural"],
  [/arremess/, "arremesso"],
  [/disparo|arco|besta/, "disparo"],
  [/fogo|polvora/, "fogo"],
  [/espada/, "espada"],
  [/\bleve/, "leve"],
  [/median/, "mediana"],
  [/longa/, "longa"],
  [/pesad/, "pesada"],
  [/especia/, "especial"],
];

const nameHit = (d: string, name: string) => {
  const n = norm(name).replace(/ \(par\)$/, "");
  return d.length >= 3 && (n.includes(d) || d.includes(n));
};

/** A categoria escrita na aptidão (ex.: "Kunai", "Armas de Arremesso", "Desarmado") vale para este ataque. */
export function detalheCasa(detail: string | undefined, cats: string[], names: string[]): boolean {
  const d = norm(detail ?? "");
  if (!d) return false;
  if (names.some((n) => nameHit(d, n))) return true;
  // O detalhe nomeia outra arma: não é uma categoria.
  if (ARMAS.some((a) => a.cat !== "desarmado" && nameHit(d, a.name))) return false;
  return CAT_RX.some(([rx, cat]) => rx.test(d) && cats.includes(cat));
}

const catsDe = (a: Arma) => [a.cat, ...(a.espada ? ["espada"] : []), ...(a.grupo === "especial" ? ["especial"] : []), ...(a.cat === "fogo" ? ["disparo"] : [])];

const aptDetails = (c: Character, id: string) => c.aptidoes.filter((e) => e.id === id).map((e) => e.detail);

/** Sabe usar a arma: simples, Usar Arma na categoria ou uma origem que dá a proficiência. */
function proficiente(c: Character, a: Arma): boolean {
  if (a.grupo === "simples") return true;
  if (a.cat === "fogo") return hasApt(c, "usar-polvora");
  if (hasApt(c, "usar-arma-arsenal")) return true;
  if (a.espada && a.cat !== "pesada" && hasApt(c, "sabre-samurai")) return true;
  if (a.espada && a.grupo === "marcial" && hasApt(c, "lamina-lua")) return true;
  if (a.id.startsWith("fuuma") && hasApt(c, "demonio-vento")) return true;
  if (a.id === "espada-chakra-branco" && hasApt(c, "presa-prata")) return true;
  const usar = aptDetails(c, "usar-arma");
  // Daisho: Usar Arma: Katana também vale para a Wakizashi.
  if (a.id === "wakizashi" && usar.some((d) => detalheCasa(d, [], ["Katana"]))) return true;
  return usar.some((d) => detalheCasa(d, catsDe(a), [a.name]));
}

function reqWarn(a: Arma, attrs: Record<AttrKey, number>): string | null {
  const r = armaReq(a);
  if (!r) return null;
  const v = r.attr === "FOR" ? attrs.FOR : r.attr === "DES" ? attrs.DES : Math.max(attrs.FOR, attrs.DES);
  if (v >= r.v) return null;
  return `Pede ${r.attr === "FOR/DES" ? "Força ou Destreza" : r.attr === "FOR" ? "Força" : "Destreza"} ${r.v} para empunhar.`;
}

/* ---------------- montagem de um golpe ---------------- */

interface Cand {
  label: string;
  v: number;
  why?: string;
}

interface Golpe {
  key: string;
  name: string;
  tag?: string;
  test: "CC" | "CD";
  corpo: boolean;
  /** Atributos que podem entrar no dano; vale o maior. */
  cands: Cand[];
  arma: number;
  armaLabel?: string;
  /** Categorias e nomes para Dano Extra e Crítico Aprimorado. */
  cats: string[];
  names: string[];
  letal: AtaqueBasico["letal"];
  crit: number;
  tipo: string;
  alcance: string;
  note?: string;
  warn?: (string | null)[];
  cost?: number;
  bonus?: { label: string; v: number }[];
  /** Não recebe Crítico Aprimorado (Kage Fushä). */
  semCritAprimorado?: boolean;
  /** Arma marcial ou especial sem Usar Arma: −3 no teste de acerto. */
  semProficiencia?: boolean;
}

/**
 * Especialista (Livro Básico, aptidões de combate): +1 de precisão com o tipo de arma ou desarmado escolhido.
 * O Demônio do Vento (clã Fuuma) dá Especialista em armas de arremesso.
 */
function especialista(c: Character, g: Pick<Golpe, "cats" | "names">): boolean {
  if (hasApt(c, "demonio-vento") && g.cats.includes("arremesso")) return true;
  return aptDetails(c, "especialista").some((d) => detalheCasa(d, g.cats, g.names));
}

/** Dano Extra (Livro Básico, aptidões de combate): +1, e +1 a cada 2 níveis de CC ou CD acima de 18. Regra opcional do Guia: automático no 18. */
function danoExtra(c: Character, x: DanoCtx, g: Golpe): number {
  const lvl = x.combat[g.test];
  const v = 1 + Math.max(0, Math.floor((lvl - 18) / 2));
  if (aptDetails(c, "dano-extra").some((d) => detalheCasa(d, g.cats, g.names))) return v;
  return c.optionals.danoExtraAuto && lvl >= 18 ? v : 0;
}

function golpe(c: Character, x: DanoCtx, g: Golpe): AtaqueBasico {
  const best = g.cands.reduce((m, a) => (a.v > m.v ? a : m));
  const parts = [`½${best.label}${best.why ? ` (${best.why})` : ""} ${half(best.v)}`];
  let base = half(best.v);
  if (g.arma) {
    base += g.arma;
    parts.push(`${g.armaLabel ?? "arma"} ${g.arma}`);
  }
  for (const b of g.bonus ?? []) {
    if (!b.v) continue;
    base += b.v;
    parts.push(`${b.label} ${b.v}`);
  }
  const de = danoExtra(c, x, g);
  if (de) {
    base += de;
    parts.push(`Dano Extra ${de}`);
  }
  if (x.poderoso && g.corpo) {
    base += 1;
    parts.push("Ataque Poderoso 1");
  }
  // Hachimon anula os outros bônus de dano (os de tamanho e dano de arma continuam).
  if (x.dano && !x.hachimon) {
    base += x.dano;
    parts.push(`estado ${x.dano}`);
  }
  const critAp = !g.semCritAprimorado && aptDetails(c, "critico-aprimorado").some((d) => detalheCasa(d, g.cats, g.names));
  const prec = { v: 0, why: [] as string[] };
  if (especialista(c, g)) {
    prec.v += 1;
    prec.why.push("Especialista +1");
  }
  if (g.semProficiencia) {
    prec.v -= 3;
    prec.why.push("sem Usar Arma −3");
  }
  return {
    prec,
    key: g.key,
    name: g.name,
    tag: g.tag,
    test: g.test,
    corpo: g.corpo,
    base: Math.max(0, base),
    parts,
    letal: g.letal,
    crit: g.crit - (critAp ? 1 : 0),
    tipo: g.tipo,
    alcance: g.alcance,
    note: g.note ?? "",
    warn: (g.warn ?? []).filter((w): w is string => !!w),
    cost: g.cost ?? 0,
  };
}

/** Ataque com dano próprio, sem atributo nem arma (Kyoudo Kyouka, Teshi Sendan, Tarja…). */
function fixo(x: DanoCtx, a: Omit<AtaqueBasico, "base" | "parts" | "warn"> & { v: number; parts: string[] }): AtaqueBasico {
  const { v, ...rest } = a;
  const parts = [...a.parts];
  let base = v;
  if (x.dano && !x.hachimon) {
    base += x.dano;
    parts.push(`estado ${x.dano}`);
  }
  return { ...rest, base: Math.max(0, base), parts, warn: [] };
}

/* ---------------- lista de ataques ---------------- */

export function ataquesBasicos(c: Character, x: DanoCtx): AtaqueBasico[] {
  const out: AtaqueBasico[] = [];
  const A = x.attrs;
  const forC: Cand = { label: "For", v: x.hachimon ? x.hachimon.forDano : A.FOR, why: x.hachimon ? `Hachimon ${x.hachimon.gate}` : undefined };
  const desC: Cand = { label: "Des", v: A.DES };
  const esp = espParam(c, A);
  const espC = (why: string): Cand => ({ label: esp.label, v: esp.val, why });
  // Golpe energizado (Energizar, Lâmina de Chakra) ou Armadura de Raios: Espírito no lugar de Força/Destreza.
  const energ = (base: Cand[], ok = true): Cand[] => (!ok ? base : x.energizar ? [...base, espC("Energizar")] : x.armaduraRaios ? [...base, espC("Armadura de Raios")] : base);
  const ambi = hasApt(c, "ambidestria");
  const atirador = c.aptidoes.find((e) => e.id === "atirador")?.variant;

  // Desarmado (Livro Básico, Descrição das Armas): não-letal; Punho de Ferro dá dano de arma e deixa escolher.
  const pdf = punhoDeFerro(c);
  out.push(
    golpe(c, x, {
      key: "desarmado",
      name: "Ataque desarmado",
      tag: pdf ? "Punho de Ferro" : undefined,
      test: "CC",
      corpo: true,
      cands: energ([forC]),
      arma: pdf,
      armaLabel: "Punho de Ferro",
      cats: ["desarmado"],
      names: ["Ataque Desarmado"],
      letal: pdf ? "escolha" : false,
      crit: 15,
      tipo: "esmagamento",
      alcance: "corpo-a-corpo",
      note: pdf ? "Dano de arma pela Força original, sem bônus. Não soma com outro dano de arma de socos (Juuken, Pele de Pedra…)." : "Só dano não-letal.",
    }),
  );

  // Juuken (clã Hyuuga): ½ Destreza + dano de arma do poder.
  const juuken = powerLevel(c, "juuken");
  if (juuken)
    out.push(
      golpe(c, x, {
        key: "juuken",
        name: "Juuken",
        tag: "Clã Hyuuga",
        test: "CC",
        corpo: true,
        cands: [desC],
        arma: armaPorNivel(juuken),
        armaLabel: `Juuken ${juuken}`,
        cats: ["desarmado"],
        names: ["Juuken"],
        letal: true,
        crit: 15,
        tipo: "esmagamento",
        alcance: "corpo-a-corpo",
        note: "Postura (ação livre). Golpes com as mãos; ignora metade da dureza de corpo passiva (até 2). Não soma Punho de Ferro nem Energizar.",
      }),
    );

  // Shikakyu (clã Inuzuka): garras e mordida, ½ Força + dano de arma do poder.
  const shikakyu = powerLevel(c, "shikakyu");
  if (shikakyu)
    out.push(
      golpe(c, x, {
        key: "shikakyu",
        name: "Garras e mordida",
        tag: "Shikakyu",
        test: "CC",
        corpo: true,
        cands: energ([forC]),
        arma: armaPorNivel(shikakyu),
        armaLabel: `Shikakyu ${shikakyu}`,
        cats: ["natural"],
        names: ["Shikakyu"],
        letal: true,
        crit: 15,
        tipo: "corte/perfuração",
        alcance: "corpo-a-corpo",
        note: "Com o Shikakyu no Jutsu ligado (ação parcial, 1 chakra). O Companheiro Animal também pode usar.",
      }),
    );

  // Potência da Besta (Jinchuuriki 2): obrigatoriamente ½ Espírito + dano de arma do poder.
  const jin = powerLevel(c, "jinchuuriki");
  if (jin >= 2)
    out.push(
      golpe(c, x, {
        key: "potencia-besta",
        name: "Potência da Besta",
        tag: "Jinchuuriki",
        test: "CC",
        corpo: true,
        cands: [{ label: "Esp", v: A.ESP }],
        arma: armaPorNivel(jin),
        armaLabel: `Jinchuuriki ${jin}`,
        bonus: x.kurama ? [{ label: "Modo Kurama", v: 4 }] : [],
        cats: ["desarmado"],
        names: ["Potência da Besta"],
        letal: true,
        crit: 15,
        tipo: "esmagamento",
        alcance: "corpo-a-corpo",
        note: "Chakra bijuu nos golpes, sempre com Espírito. Vale com manobras, Especialista e Maestria.",
      }),
    );

  // Soco de Pedra: Pele de Pedra + Energizar Doton sustentados.
  if (hasEffect(c, "pele-pedra") && hasEffect(c, "energizar"))
    out.push(
      golpe(c, x, {
        key: "soco-pedra",
        name: "Soco de Pedra",
        tag: "Doton",
        test: "CC",
        corpo: true,
        cands: [forC, espC("Energizar")],
        arma: 4,
        armaLabel: "Pele de Pedra",
        cats: ["desarmado"],
        names: ["Soco de Pedra"],
        letal: true,
        crit: 15,
        tipo: "esmagamento",
        alcance: "corpo-a-corpo",
        note: "Pele de Pedra com Energizar Doton (ação livre): socos letais com 4 de dano de arma.",
      }),
    );

  // Kyoudo Kyouka: ½ Espírito + Iryou Ninjutsu, sem Força nem arma.
  if (hasApt(c, "kyoudo-kyouka")) {
    const iryou = powerLevel(c, "iryou");
    out.push(
      fixo(x, {
        key: "kyoudo-kyouka",
        name: "Kyoudo Kyouka",
        tag: "Aptidão shinobi",
        test: "CC",
        corpo: true,
        v: half(esp.val) + iryou,
        parts: [`½${esp.label} ${half(esp.val)}`, `Iryou ${iryou}`],
        letal: true,
        crit: 15,
        tipo: "esmagamento",
        alcance: "corpo-a-corpo",
        note: `Prepare em Estados (${half(esp.val)} de chakra). Sem Força nem dano de arma. O alvo testa Acrobacia (Dif ${9 + esp.val}) ou cai.`,
        cost: 0,
      }),
    );
  }

  // Bisturi de Chakra (Iryou Ninjutsu): técnica de toque, 2 por nível usado.
  const iryou = powerLevel(c, "iryou");
  if (iryou) {
    const calc = (l: number) => {
      const r = fixo(x, { key: "", name: "", test: "CC", corpo: true, v: 2 * l, parts: [`2 × Nv ${l}`], letal: true, crit: 15, tipo: "", alcance: "", note: "", cost: 0 });
      return { base: r.base, parts: r.parts };
    };
    const r = calc(iryou);
    out.push({
      key: "bisturi",
      name: "Bisturi de Chakra",
      tag: "Iryou Ninjutsu",
      test: "CC",
      corpo: true,
      base: r.base,
      parts: r.parts,
      letal: true,
      crit: 15,
      tipo: "corte",
      alcance: "toque",
      note: "Técnica de toque; não dá para bloquear desarmado. 3 acertos: Vigor (Dif 7 + nível + ½ Medicina) ou lento e debilitado. Não soma com Energizar.",
      warn: [],
      cost: 0,
      lvl: { min: 1, max: iryou, calc },
    });
  }

  // Kaguya (Artesão de Ossos): armas de osso com +1 de dano de arma; Yanagi no Mai deixa usar Destreza nas leves.
  if (hasApt(c, "shikotsumyaku")) {
    const yanagi = hasApt(c, "yanagi-no-mai");
    const osso = (key: string, name: string, cat: string, arma: number, alcance: string, note: string, leve = false): AtaqueBasico =>
      golpe(c, x, {
        key,
        name,
        tag: "Clã Kaguya",
        test: "CC",
        corpo: true,
        cands: leve && yanagi ? [forC, { ...desC, why: "Yanagi no Mai" }] : [forC],
        arma,
        armaLabel: "osso",
        cats: [cat, "especial"],
        names: [name, "Shikotsumyaku"],
        letal: true,
        crit: 15,
        tipo: cat === "pesada" && name.startsWith("Tsuru") ? "corte" : "perfuração",
        alcance,
        note,
      });
    out.push(
      osso("arma-presa", "Arma-Presa", "leve", 3, "corpo-a-corpo", "Ossos das palmas com o dano de uma arma leve (+2) e o +1 do Artesão de Ossos. Não pode ser desarmada. Outras armas de osso: dano da comum +1 e dureza +2.", true),
      fixo(x, {
        key: "teshi-sendan",
        name: "Teshi Sendan",
        tag: "Clã Kaguya",
        test: "CD",
        corpo: false,
        v: A.DES,
        parts: [`Des ${A.DES}`],
        letal: true,
        crit: 15,
        tipo: "perfuração",
        alcance: "20m",
        note: "Projéteis dos ossos dos dedos: ação padrão e 1 ponto de Vitalidade. Dano base igual à Destreza.",
        cost: 0,
      }),
    );
    if (hasApt(c, "tessenka-no-mai"))
      out.push(
        osso("tsuru", "Tsuru (Vinha de Ossos)", "pesada", 4, "4m", "Arma pesada; derrubar, desarmar e agarrar sem penalidade. Acuidade se aplica."),
        osso("hana", "Hana (Flor de Ossos)", "pesada", 6, "2m", "Arma-presa pesada. Agarrando com a Tsuru: ataque extra só com a Hana. Sem manobras."),
      );
  }

  // Armas do equipamento (uma linha por arma diferente) e a Espada de Chakra Branco da Presa de Prata.
  const armas: Arma[] = [];
  for (const it of c.items) {
    const a = armaDoItem(it);
    if (a && !armas.includes(a)) armas.push(a);
  }
  if (hasApt(c, "presa-prata") && !armas.some((a) => a.id === "espada-chakra-branco")) armas.push(ARMA_BY_ID["espada-chakra-branco"]);
  for (const a of armas) out.push(...linhasArma(c, x, a, { forC, desC, espC, energ, ambi, atirador }));

  // Corte de Chakra (Sabre Samurai): projétil da Lâmina de Chakra com a melhor espada do equipamento.
  if (hasApt(c, "sabre-samurai")) {
    const espada = armas.filter((a) => a.espada && a.cat !== "pesada").sort((a, b) => b.dano - a.dano)[0];
    if (espada)
      out.push(
        golpe(c, x, {
          key: "corte-chakra",
          name: "Corte de Chakra",
          tag: "Samurai",
          test: "CC",
          corpo: false,
          cands: [forC, espC("Lâmina de Chakra")],
          arma: espada.dano,
          armaLabel: espada.name,
          cats: catsDe(espada),
          names: [espada.name],
          letal: true,
          crit: espada.crit,
          tipo: espada.tipo,
          alcance: `${5 + esp.val}m`,
          note: `Com a Lâmina de Chakra ligada (ação parcial, 3 chakra, sustentada). Teste de CC; sem manobras.${hasApt(c, "issen") ? " Issen: com duas espadas, dobre o dano de arma." : ""}`,
          cost: half(A.ESP),
        }),
      );
  }

  return out;
}

interface Ctx2 {
  forC: Cand;
  desC: Cand;
  espC: (why: string) => Cand;
  energ: (base: Cand[], ok?: boolean) => Cand[];
  ambi: boolean;
  atirador?: string;
}

function linhasArma(c: Character, x: DanoCtx, a: Arma, k: Ctx2): AtaqueBasico[] {
  const out0 = linhasArmaSemFaixa(c, x, a, k);
  // Alcance da arma (Livro Básico, Armas): sem penalidade até ele, −1 até o dobro, −3 até o quádruplo.
  // Tiro Longo dobra o das armas de disparo; Alcance Estendido (Saika Ikki) soma 10m nas de fogo.
  const disparo = a.cat === "disparo" || a.cat === "fogo";
  for (const r of out0) {
    const m = !r.corpo && /^(\d+)m$/.exec(r.alcance);
    if (!m) continue;
    r.faixa = Number(m[1]) * (disparo && hasApt(c, "tiro-longo") ? 2 : 1) + (a.cat === "fogo" && hasApt(c, "alcance-estendido") ? 10 : 0);
    r.alcance = `${r.faixa}m`;
  }
  return out0;
}

function linhasArmaSemFaixa(c: Character, x: DanoCtx, a: Arma, k: Ctx2): AtaqueBasico[] {
  const out: AtaqueBasico[] = [];
  const A = x.attrs;
  const warn = [reqWarn(a, c.attrs), proficiente(c, a) ? null : a.cat === "fogo" ? "Sem Usar Pólvora não dá para usar." : "Sem Usar Arma: −3 de precisão (já no teste)."];
  const cats = catsDe(a);
  const base = { tag: a.grupo === "especial" ? "Arma especial" : undefined, cats, names: [a.name], letal: true as const, crit: a.crit, tipo: a.tipo, semCritAprimorado: a.id === "fuuma-kage", semProficiencia: !proficiente(c, a) && a.cat !== "fogo" };

  if (a.cat === "explosivo") {
    out.push(
      fixo(x, {
        key: `arma:${a.id}`,
        name: a.name,
        test: "CD",
        corpo: false,
        v: a.dano,
        parts: [`${a.dano}`],
        letal: true,
        crit: 15,
        tipo: a.tipo,
        alcance: a.alcance ?? "",
        note: "Explosão de 5m (+1m por tarja extra); da 5ª tarja em diante, 1 de dano base por tarja. Grau pelo acerto (lançada com kunai) ou por 2 dados (ativação remota ou colada).",
        cost: 0,
      }),
    );
    return out;
  }

  if (a.cat === "leve" || a.cat === "mediana" || a.cat === "longa" || a.cat === "pesada") {
    let arma = a.dano;
    let armaLabel = "arma";
    const notes = [a.note];
    const bonus: { label: string; v: number }[] = [];
    if (a.par) {
      if (k.ambi) {
        arma = a.par;
        armaLabel = "par (Ambidestria)";
      } else notes.push(`Com Ambidestria: ${a.par} de dano de arma.`);
    }
    if (a.id === "nunchaku") {
      const pdf = punhoDeFerro(c);
      if (pdf > arma) {
        arma = Math.min(3, pdf);
        armaLabel = "Punho de Ferro";
      }
    }
    if (a.id === "espada-chakra-branco") {
      arma = c.attrs.DES >= 12 ? 4 : c.attrs.DES >= 10 ? 3 : 2;
      notes.push("Dano de arma +3 com Destreza 10 e +4 com 12, menos com Ambidestria.");
    }
    if (a.id === "florete" && !temAcuidade(c, a)) bonus.push({ label: "sem Acuidade", v: -1 });
    if (a.id === "tanto" && Math.max(c.attrs.FOR, c.attrs.DES) < 8) bonus.push({ label: "abaixo do requisito", v: -1 });
    // Iaido: +1 com a katana empunhada sozinha (a linha é sempre de uma arma só).
    if (a.id === "katana" && hasApt(c, "iaido")) bonus.push({ label: "Iaido", v: 1 });
    if (a.espada && hasApt(c, "iaido")) notes.push("Corte Rápido (logo após sacar): Destreza no dano e finta livre.");
    const cands = [k.forC];
    if (a.id === "espada-chakra-branco") cands.push(k.espC("Chakra Branco"));
    out.push(
      golpe(c, x, {
        ...base,
        key: `arma:${a.id}`,
        name: a.name,
        test: "CC",
        corpo: true,
        // Armas especiais só energizam quando o texto deixa (a Espada de Chakra Branco deixa).
        cands: k.energ(cands, a.grupo !== "especial" || a.id === "espada-chakra-branco"),
        arma,
        armaLabel,
        bonus,
        alcance: a.alcance ?? (a.cat === "longa" ? "2m" : "corpo-a-corpo"),
        note: notes.filter(Boolean).join(" "),
        warn,
      }),
    );
    if (a.arremesso) {
      const t = a.arremesso;
      out.push(
        golpe(c, x, {
          ...base,
          key: `arma:${a.id}:arremesso`,
          name: `${a.name.replace(/ \(par\)$/, "")} arremessada`,
          test: t.cc ? "CC" : "CD",
          corpo: false,
          cands: [t.cc ? k.forC : k.desC],
          arma: t.dano,
          cats: [...cats, "arremesso"],
          alcance: t.alcance,
          note: t.cc ? "Arremesso com CC e Força." : a.par ? "Uma por mão; com as duas ao mesmo tempo, some o dano de arma." : "",
          warn,
        }),
      );
    }
    return out;
  }

  if (a.cat === "arremesso") {
    const atir = k.atirador === "arremesso" && a.grupo === "simples" ? [{ label: "Atirador", v: 3 }] : [];
    if (a.qtd) {
      out.push(
        golpe(c, x, { ...base, key: `arma:${a.id}`, name: `${a.name} ×${a.qtd}`, test: "CD", corpo: false, cands: [k.desC], arma: a.dano, bonus: atir, alcance: a.alcance ?? "", note: "Uma mão. O dano é pelo total lançado, não por unidade.", warn }),
        golpe(c, x, { ...base, key: `arma:${a.id}:2`, name: `${a.name} ×${2 * a.qtd}`, test: "CD", corpo: false, cands: [k.desC], arma: 2 * a.dano, bonus: atir, alcance: a.alcance ?? "", note: "As duas mãos ao mesmo tempo: dano de arma dobrado, um só teste.", warn }),
      );
    } else {
      const r = golpe(c, x, { ...base, key: `arma:${a.id}`, name: a.name, test: "CD", corpo: false, cands: [k.desC], arma: a.dano, bonus: atir, alcance: a.alcance ?? "", note: a.note, warn });
      // Demônio do Vento (clã Fuuma): dano base igual à Destreza, sem o cálculo comum nem dano de arma.
      if (a.id.startsWith("fuuma") && hasApt(c, "demonio-vento")) {
        const f = fixo(x, { ...r, v: A.DES, parts: [`Des ${A.DES} (Demônio do Vento)`] });
        out.push(f.base > r.base ? { ...f, warn: r.warn, tag: "Demônio do Vento" } : r);
      } else out.push(r);
    }
    if (a.cc)
      out.push(
        golpe(c, x, {
          ...base,
          key: `arma:${a.id}:cc`,
          name: `${a.name} (corpo-a-corpo)`,
          test: "CC",
          corpo: true,
          cands: k.energ([k.forC]),
          arma: a.dano,
          cats: ["leve", "arremesso"],
          alcance: "corpo-a-corpo",
          note: "Como arma leve: teste de CC e Força.",
          warn,
        }),
      );
    return out;
  }

  // Disparo e armas de fogo
  const atir = k.atirador === "arcos" && a.id.startsWith("arco") ? [{ label: "Atirador", v: 1 }] : [];
  out.push(golpe(c, x, { ...base, key: `arma:${a.id}`, name: a.name, test: "CD", corpo: false, cands: [k.desC], arma: a.dano, bonus: atir, alcance: a.alcance ?? "", note: a.note, warn }));
  return out;
}

export const letalText = (l: AtaqueBasico["letal"]) => (l === "escolha" ? "letal ou não" : l ? "letal" : "não-letal");
