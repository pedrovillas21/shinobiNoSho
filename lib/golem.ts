import { ELEMENTO } from "./ataques";
import { COMBAT } from "./data/base";
import { combatTotal, espParam, evolucaoDe, powerLevel } from "./rules";
import type { AttrKey, Character, CombatKey } from "./types";

/* Golem do Mokuton (Livro Básico, Mokuton, efeito de nível 7; Mokujin no Jutsu usa as mesmas regras). */

const half = (n: number) => Math.ceil(n / 2);

/** Tabela de Tamanho (Livro Básico, pág. 271): só as duas formas do golem. */
const TAMANHO = {
  Imenso: { b: 5, d: 9, alc: 4, furt: -3, intim: 2 },
  Colossal: { b: 7, d: 12, alc: 5, furt: -5, intim: 2 },
} as const;

export interface GolemFicha {
  /** O efeito Golem foi escolhido no Mokuton (senão, a ficha é só uma prévia). */
  escolhido: boolean;
  /** Golem Nv 10 (evolução): colossal e Selar Chakra nos ataques corporais. */
  nv10: boolean;
  /** Nível do Mokuton (nível usado padrão para dano e custo). */
  nivel: number;
  tamanho: keyof typeof TAMANHO;
  attrs: Record<AttrKey, number>;
  /** Atributos que mudaram em relação aos seus, com o motivo. */
  attrNota: Partial<Record<AttrKey, string>>;
  vit: number;
  combat: Record<CombatKey, number>;
  reacaoEsquiva: number;
  desloc: number;
  alcanceCC: number;
  furtividade: number;
  intimidar: number;
  /** Dano base do ataque corporal: dano comum do Mokuton no nível dele. */
  dano: number;
  danoParts: string[];
  /** Chakra para criar (nível usado) e para curar (metade). */
  custo: number;
  custoCura: number;
  /** Chakra que o Selar Chakra tira do alvo (½ do nível usado), no Nv 10. */
  selar: number;
}

/** Ficha do golem a partir da ficha do personagem, ou null sem Mokuton. */
export function golemMokuton(c: Character): GolemFicha | null {
  const nivel = powerLevel(c, "mokuton");
  if (!c.poderes.some((p) => p.id === "mokuton")) return null;
  let escolhido = false;
  let ev = 0;
  c.poderes.forEach((p, idx) => {
    if (p.id !== "mokuton") return;
    p.effects.slice(0, p.level).forEach((eff, i) => {
      if (eff !== "golem-mokuton") return;
      escolhido = true;
      ev = Math.max(ev, evolucaoDe(c, idx, i));
    });
  });
  const nv10 = ev >= 1 && nivel >= 10;
  const tamanho = nv10 ? "Colossal" : "Imenso";
  const T = TAMANHO[tamanho];
  // Mesmos atributos, com a Força trocada pelo Espírito; o tamanho soma Força e Vigor normalmente.
  const attrs = { ...c.attrs, FOR: c.attrs.ESP + T.b, VIG: c.attrs.VIG + T.b };
  const attrNota: Partial<Record<AttrKey, string>> = {
    FOR: `Espírito ${c.attrs.ESP} + ${T.b} (${tamanho.toLowerCase()})`,
    VIG: `Vigor ${c.attrs.VIG} + ${T.b} (${tamanho.toLowerCase()})`,
  };
  // Metade da Vitalidade, contando o Vigor do tamanho (como nas invocações, que também têm o tamanho fixo).
  const vit = Math.floor((10 + 3 * attrs.VIG + 5 * c.nc) / 2);
  // Habilidades de combate iguais às suas (com Especialista, Maestria, Reflexos, Intuição e Acuidade).
  const combat = Object.fromEntries(COMBAT.map((k) => [k.key, combatTotal(c, k.key)])) as Record<CombatKey, number>;
  const key = espParam(c);
  const lvl = Math.max(7, nivel);
  const elem = ELEMENTO.mokuton ?? 0;
  const dano = lvl + half(key.val) + elem;
  return {
    escolhido,
    nv10,
    nivel: lvl,
    tamanho,
    attrs,
    attrNota,
    vit,
    combat,
    reacaoEsquiva: combat.ESQ + 9,
    desloc: 10 + half(attrs.AGI) + T.d,
    alcanceCC: T.alc,
    furtividade: T.furt,
    intimidar: T.intim,
    dano,
    danoParts: [`Mokuton ${lvl}`, `½ ${key.label} ${half(key.val)}`, ...(elem ? [`Mokuton +${elem}`] : [])],
    custo: lvl,
    custoCura: half(lvl),
    selar: half(lvl),
  };
}

/** Regras do golem, em frases curtas para a ficha e a mesa. */
export function golemRegras(g: GolemFicha): string[] {
  return [
    `Criar: ação padrão e ${g.custo} de chakra (1 por nível usado). Duração contínua; 1 golem por cena.`,
    "Controle por concentração, sem precisar dar instruções. Sem ela, o golem fica imóvel e vira um objeto inanimado.",
    "Age como um personagem (ação padrão, movimento, ataque oportuno) e pode lançar qualquer técnica do seu Mokuton com as ações dele; não usa outras técnicas nem aptidões.",
    "Parceiro: o dano dos ataques seus e dele é dividido pelo número de ações padrão usadas na rodada (a sua concentração não conta).",
    `Curar: ação de movimento e ${g.custoCura} de chakra (metade do custo) para recuperar até ${Math.floor(g.vit / 2)} de Vitalidade (metade do total).`,
    "Sem mente: não pode ser alvo de genjutsu. Dureza 0. Perícias todas em 0.",
    `Tamanho ${g.tamanho.toLowerCase()}: contra todos os inimigos no alcance CC que sejam 3+ categorias menores (Médios inclusive), pode atacar todos com um único teste de CC (sem aptidões de manobra).`,
    "Senjutsu: recebe os bônus de Senjutsu, menos os de energia, desde que não acumulem com bônus de tamanho.",
    ...(g.nv10 ? [`Nv 10: os ataques corporais comuns têm Selar Chakra de graça (o alvo perde ${g.selar} de chakra).`] : []),
  ];
}
