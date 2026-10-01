import type { Source } from "../types";

/*
 * Tabela de Armas (Livro Básico, pág. 130–137) com as revisões e armas novas do Guia Avançado (pág. 56–72).
 * Armas marcadas com * no Guia usam os valores revisados.
 */

export type ArmaCat = "desarmado" | "leve" | "mediana" | "longa" | "pesada" | "arremesso" | "disparo" | "fogo" | "explosivo";

export interface Arma {
  id: string;
  name: string;
  cat: ArmaCat;
  grupo: "simples" | "marcial" | "especial";
  /** Dano de arma com uma arma (ou uma ponta da arma dupla). */
  dano: number;
  /** Dano de arma usando o par ou as duas pontas, com Ambidestria. */
  par?: number;
  /** Arremesso: unidades lançadas com uma mão para causar o dano. */
  qtd?: number;
  /** Arma de arremesso que também luta corpo-a-corpo como arma leve (kunai, senbon). */
  cc?: boolean;
  /** Arma corpo-a-corpo que também pode ser arremessada. `cc`: o arremesso usa CC e Força (lança). */
  arremesso?: { dano: number; alcance: string; cc?: boolean };
  /** Menor resultado do 2d8 que é crítico (15 = 15-16). */
  crit: number;
  tipo: string;
  alcance?: string;
  /** Atributo mínimo para empunhar; sem isto vale o da categoria. null = sem requisito. */
  req?: { attr: "FOR" | "DES" | "FOR/DES"; v: number } | null;
  /** A aptidão Acuidade se aplica (toda arma leve já se aplica). */
  acuidade?: boolean;
  /** Conta como espada (Sabre Samurai, Lâmina da Lua, Iaido). */
  espada?: boolean;
  price: number;
  perComp: string;
  note?: string;
  source: Source;
}

const S = "simples" as const;
const M = "marcial" as const;

export const ARMAS: Arma[] = [
  { id: "desarmado", name: "Ataque Desarmado", cat: "desarmado", grupo: S, dano: 0, crit: 15, tipo: "esmagamento", price: 0, perComp: "—", source: "Básico" },

  // Simples · leves
  { id: "espada-curta", name: "Espada Curta", cat: "leve", grupo: S, dano: 2, crit: 15, tipo: "corte", espada: true, price: 8, perComp: "1 por comp.", source: "Básico" },
  { id: "tanto", name: "Tantō", cat: "leve", grupo: S, dano: 2, crit: 15, tipo: "corte", espada: true, req: null, price: 10, perComp: "1 por comp.", note: "Sem Força ou Destreza 8: dano base −1.", source: "Básico" },
  { id: "tonfa", name: "Tonfa (par)", cat: "leve", grupo: S, dano: 1, par: 2, crit: 15, tipo: "esmagamento", price: 8, perComp: "1 par por comp.", source: "Básico" },
  { id: "clava", name: "Clava", cat: "leve", grupo: S, dano: 2, crit: 15, tipo: "esmagamento", price: 0, perComp: "1 por comp.", source: "Guia Avançado" },
  { id: "gladio", name: "Gládio", cat: "leve", grupo: S, dano: 2, crit: 15, tipo: "perfuração", espada: true, price: 8, perComp: "1 por comp.", source: "Guia Avançado" },
  // Simples · medianas
  { id: "lanca", name: "Lança", cat: "mediana", grupo: S, dano: 3, arremesso: { dano: 3, alcance: "10m", cc: true }, crit: 15, tipo: "perfuração", price: 2, perComp: "1 por comp.", source: "Básico" },
  { id: "maca", name: "Maça", cat: "mediana", grupo: S, dano: 3, crit: 15, tipo: "esmagamento", price: 12, perComp: "1 por comp.", source: "Básico" },
  // Simples · longas
  { id: "bastao", name: "Bastão", cat: "longa", grupo: S, dano: 2, par: 4, crit: 15, tipo: "esmagamento", acuidade: true, price: 0, perComp: "1 por comp.", note: "Arma dupla: as duas pontas pedem Ambidestria.", source: "Básico" },
  { id: "pique", name: "Pique", cat: "longa", grupo: S, dano: 3, crit: 15, tipo: "perfuração", price: 2, perComp: "1 por comp.", source: "Básico" },
  // Simples · pesadas
  { id: "tacape", name: "Tacape", cat: "pesada", grupo: S, dano: 4, crit: 15, tipo: "esmagamento", price: 0, perComp: "1 por comp.", source: "Básico" },
  // Simples · arremesso
  { id: "kunai", name: "Kunai", cat: "arremesso", grupo: S, dano: 1, qtd: 3, cc: true, crit: 15, tipo: "perfuração", alcance: "15m", price: 2, perComp: "10 por comp.", source: "Básico" },
  { id: "shuriken", name: "Shuriken", cat: "arremesso", grupo: S, dano: 1, qtd: 3, crit: 15, tipo: "perfuração", alcance: "20m", price: 3, perComp: "18 por comp.", source: "Básico" },
  { id: "senbon", name: "Senbon", cat: "arremesso", grupo: S, dano: 1, qtd: 3, cc: true, crit: 15, tipo: "perfuração", alcance: "20m", price: 3, perComp: "15 por comp.", source: "Básico" },
  // Simples · disparo
  { id: "arco-curto", name: "Arco Curto", cat: "disparo", grupo: S, dano: 1, crit: 15, tipo: "perfuração", alcance: "25m", price: 30, perComp: "1 por comp.", source: "Básico" },
  { id: "besta-leve", name: "Besta Leve", cat: "disparo", grupo: S, dano: 2, crit: 15, tipo: "perfuração", alcance: "25m", price: 35, perComp: "1 por comp.", note: "Recarregar: ação de movimento.", source: "Básico" },
  // Explosivos
  { id: "tarja", name: "Tarja Explosiva", cat: "explosivo", grupo: S, dano: 4, crit: 15, tipo: "fogo", alcance: "esfera de 5m", price: 10, perComp: "6 por comp.", source: "Básico" },

  // Marciais · leves
  { id: "aian-nakkuru", name: "Aian Nakkuru (par)", cat: "leve", grupo: M, dano: 1, par: 2, arremesso: { dano: 1, alcance: "15m" }, crit: 15, tipo: "corte", req: { attr: "FOR/DES", v: 10 }, price: 100, perComp: "1 par por comp.", note: "Em par: Energizar dá +1 de dano base e Afiar dá +2.", source: "Básico" },
  { id: "nunchaku", name: "Nunchaku", cat: "leve", grupo: M, dano: 2, crit: 15, tipo: "esmagamento", price: 2, perComp: "1 por comp.", note: "Conta como ataque desarmado (Lutador, manobras). Com Punho de Ferro, pode usar o dano dele até +3.", source: "Guia Avançado" },
  { id: "sai", name: "Sai (par)", cat: "leve", grupo: M, dano: 1, par: 2, arremesso: { dano: 1, alcance: "20m" }, crit: 15, tipo: "perfuração", price: 5, perComp: "1 par por comp.", note: "Desarmar sem penalidade.", source: "Básico" },
  { id: "wakizashi", name: "Wakizashi", cat: "leve", grupo: M, dano: 2, crit: 15, tipo: "corte", espada: true, price: 15, perComp: "1 por comp.", source: "Básico" },
  { id: "ninja-to", name: "Ninja-tō", cat: "leve", grupo: M, dano: 1, crit: 14, tipo: "corte", espada: true, price: 20, perComp: "1 por comp.", source: "Guia Avançado" },
  { id: "tachi", name: "Tachi", cat: "leve", grupo: M, dano: 2, crit: 15, tipo: "corte", espada: true, req: { attr: "FOR", v: 6 }, price: 100, perComp: "1 por 2 comp.", note: "Duas mãos.", source: "Guia Avançado" },
  // Marciais · medianas
  { id: "chicote", name: "Chicote", cat: "mediana", grupo: M, dano: 1, crit: 15, tipo: "corte", alcance: "6m", acuidade: true, price: 1, perComp: "1 por comp.", note: "Agarrar, desarmar e derrubar sem penalidade.", source: "Guia Avançado" },
  { id: "chokuto", name: "Chokutō", cat: "mediana", grupo: M, dano: 4, crit: 15, tipo: "corte", espada: true, acuidade: true, price: 20, perComp: "1 por comp.", source: "Básico" },
  { id: "cimitarra", name: "Cimitarra", cat: "mediana", grupo: M, dano: 2, crit: 14, tipo: "corte", espada: true, price: 20, perComp: "1 por comp.", note: "Crítico: 1 nível de sangramento a cada 3 de dano base.", source: "Guia Avançado" },
  { id: "corrente-cravos", name: "Corrente com Cravos", cat: "mediana", grupo: M, dano: 2, crit: 15, tipo: "perfuração", alcance: "6m", price: 25, perComp: "1 por comp.", note: "Agarrar, desarmar e derrubar sem penalidade.", source: "Guia Avançado" },
  { id: "espada-longa", name: "Espada Longa", cat: "mediana", grupo: M, dano: 4, crit: 15, tipo: "corte/perfuração", espada: true, price: 15, perComp: "1 por comp.", source: "Guia Avançado" },
  { id: "florete", name: "Florete", cat: "mediana", grupo: M, dano: 2, crit: 14, tipo: "perfuração", espada: true, acuidade: true, price: 20, perComp: "1 por comp.", note: "Sem Acuidade: dano base −1.", source: "Guia Avançado" },
  { id: "katana", name: "Katana", cat: "mediana", grupo: M, dano: 3, crit: 15, tipo: "corte", espada: true, acuidade: true, price: 20, perComp: "1 por comp.", note: "Usar Arma: Katana também vale para a Wakizashi.", source: "Básico" },
  { id: "machado", name: "Machado", cat: "mediana", grupo: M, dano: 4, crit: 15, tipo: "corte", price: 10, perComp: "1 por comp.", note: "Ataque brutal (movimento + padrão): +2 de dano de arma, sem manobras.", source: "Guia Avançado" },
  { id: "martelo-guerra", name: "Martelo de Guerra", cat: "mediana", grupo: M, dano: 3, crit: 15, tipo: "esmagamento", price: 12, perComp: "1 por comp.", note: "Ignora 2 de dureza de objetos e corpos.", source: "Guia Avançado" },
  { id: "chakram", name: "Chakram", cat: "mediana", grupo: M, dano: 3, par: 4, arremesso: { dano: 5, alcance: "20m" }, crit: 15, tipo: "corte", acuidade: true, price: 10, perComp: "2 por comp.", note: "Usado com uma mão.", source: "Guia Avançado" },
  { id: "kusarigama", name: "Kusarigama", cat: "mediana", grupo: M, dano: 1, par: 3, crit: 15, tipo: "corte/esmagamento", alcance: "6m", acuidade: true, price: 20, perComp: "1 por comp.", note: "Desarmar, agarrar e derrubar sem penalidade. O +3 é só sem manobras.", source: "Guia Avançado" },
  { id: "lamina-oculta", name: "Lâmina Oculta", cat: "mediana", grupo: M, dano: 3, par: 4, crit: 15, tipo: "perfuração", acuidade: true, price: 10, perComp: "2 por comp.", note: "Prestidigitação +2 para esconder. Não bloqueia.", source: "Guia Avançado" },
  { id: "pa-monge", name: "Pá de Monge", cat: "mediana", grupo: M, dano: 2, par: 4, crit: 15, tipo: "esmagamento/corte/perfuração", acuidade: true, price: 15, perComp: "1 por comp.", note: "Arma dupla. Desarmar e derrubar sem penalidade.", source: "Guia Avançado" },
  { id: "shuang-gou", name: "Shuang Gou (par)", cat: "mediana", grupo: M, dano: 1, par: 3, crit: 15, tipo: "corte/perfuração", acuidade: true, price: 10, perComp: "2 por comp.", note: "Desarmar, agarrar e derrubar.", source: "Guia Avançado" },
  { id: "tekko-kagi", name: "Tekko-Kagi", cat: "mediana", grupo: M, dano: 3, par: 4, crit: 15, tipo: "corte/perfuração", acuidade: true, price: 15, perComp: "2 por comp.", note: "Não pode ser desarmada. Desarmar e agarrar sem penalidade.", source: "Guia Avançado" },
  // Marciais · longas
  { id: "foice", name: "Foice", cat: "longa", grupo: M, dano: 4, crit: 15, tipo: "corte", price: 18, perComp: "1 por 2 comp.", note: "Bloquear desarmado contra ela: −1.", source: "Básico" },
  { id: "leque-gigante", name: "Leque Gigante", cat: "longa", grupo: M, dano: 2, crit: 15, tipo: "esmagamento", req: { attr: "DES", v: 8 }, acuidade: true, price: 100, perComp: "1 por 2 comp.", note: "+4 de dano de arma se afiado ou energizado com Fuuton. Fuuton sem selos.", source: "Guia Avançado" },
  { id: "otsuchi", name: "Ōtsuchi", cat: "longa", grupo: M, dano: 4, crit: 15, tipo: "esmagamento", alcance: "2m", price: 50, perComp: "1 por 2 comp.", source: "Guia Avançado" },
  { id: "yari", name: "Yari", cat: "longa", grupo: M, dano: 4, crit: 15, tipo: "perfuração", alcance: "2m", price: 50, perComp: "1 por 2 comp.", note: "Ignora 1 de dureza de corpo.", source: "Guia Avançado" },
  // Marciais · pesadas
  { id: "espada-duas-laminas", name: "Espada de Duas Lâminas", cat: "pesada", grupo: M, dano: 2, par: 5, crit: 15, tipo: "corte", espada: true, price: 100, perComp: "1 por 2 comp.", note: "Arma dupla.", source: "Guia Avançado" },
  { id: "espada-grande", name: "Espada Grande", cat: "pesada", grupo: M, dano: 5, crit: 15, tipo: "corte", espada: true, price: 20, perComp: "1 por 2 comp.", source: "Básico" },
  { id: "machado-grande", name: "Machado Grande", cat: "pesada", grupo: M, dano: 5, crit: 15, tipo: "corte", price: 50, perComp: "1 por 2 comp.", note: "Ação completa: +1 de dano de arma, sem manobras.", source: "Básico" },
  // Marciais · arremesso
  { id: "fuuma-gigante", name: "Fuuma Shuriken: Gigante", cat: "arremesso", grupo: M, dano: 5, crit: 15, tipo: "perfuração", alcance: "20m", req: { attr: "FOR/DES", v: 12 }, price: 10, perComp: "1 por comp.", note: "Uma por ação. O alvo testa Vigor (Dif 7 + sua Destreza) ou cai.", source: "Básico" },
  { id: "fuuma-reta", name: "Fuuma Shuriken: Lâmina Reta", cat: "arremesso", grupo: M, dano: 3, crit: 15, tipo: "perfuração", alcance: "20m", req: { attr: "FOR/DES", v: 10 }, price: 15, perComp: "2 por comp.", note: "Uma por ação. Com kousen, finta no arremesso (Ponto Cego).", source: "Básico" },
  { id: "fuuma-kage", name: "Fuuma Shuriken: Kage Fushä", cat: "arremesso", grupo: M, dano: 2, crit: 14, tipo: "perfuração", alcance: "20m", req: { attr: "FOR/DES", v: 8 }, price: 20, perComp: "2 por comp.", note: "Uma por ação. Não recebe Crítico Aprimorado.", source: "Básico" },
  // Marciais · disparo
  { id: "arco-composto", name: "Arco Composto", cat: "disparo", grupo: M, dano: 3, crit: 15, tipo: "perfuração", alcance: "10m + 2× Destreza", price: 100, perComp: "1 por comp.", source: "Básico" },
  { id: "arco-longo", name: "Arco Longo", cat: "disparo", grupo: M, dano: 2, crit: 15, tipo: "perfuração", alcance: "15m + 3× Destreza", price: 100, perComp: "1 por comp.", source: "Guia Avançado" },
  { id: "besta-pesada", name: "Besta Pesada", cat: "disparo", grupo: M, dano: 5, crit: 15, tipo: "perfuração", alcance: "35m", price: 50, perComp: "1 por comp.", note: "Recarregar: ação padrão.", source: "Guia Avançado" },
  { id: "disparador-oculto", name: "Disparador Oculto", cat: "disparo", grupo: M, dano: 4, crit: 15, tipo: "perfuração", alcance: "15m", req: null, price: 15, perComp: "2 por comp.", note: "Armar 3 senbons: ação parcial (livre com Saque Rápido).", source: "Guia Avançado" },
  // Armas de fogo (Guia Avançado; pedem Usar Pólvora)
  { id: "pistola-pequena", name: "Pistola de Pederneira Pequena", cat: "fogo", grupo: M, dano: 1, crit: 15, tipo: "perfuração", alcance: "20m", req: null, price: 100, perComp: "2 por comp.", note: "Manuseio 10.", source: "Guia Avançado" },
  { id: "pistola", name: "Pistola de Pederneira", cat: "fogo", grupo: M, dano: 2, crit: 15, tipo: "perfuração", alcance: "25m", req: { attr: "DES", v: 8 }, price: 200, perComp: "2 por comp.", note: "Manuseio 14.", source: "Guia Avançado" },
  { id: "bacamarte", name: "Bacamarte", cat: "fogo", grupo: M, dano: 4, crit: 15, tipo: "perfuração", alcance: "20m", req: { attr: "DES", v: 10 }, price: 250, perComp: "1 por comp.", note: "Até 10m: +1 de dano de arma (+2 com Destreza 12). Manuseio 18.", source: "Guia Avançado" },
  { id: "arcabuz", name: "Arcabuz", cat: "fogo", grupo: M, dano: 4, crit: 15, tipo: "perfuração", alcance: "10m + 2× Destreza", req: { attr: "DES", v: 10 }, price: 250, perComp: "1 por comp.", note: "Manuseio 16.", source: "Guia Avançado" },
  { id: "mosquete", name: "Mosquete", cat: "fogo", grupo: M, dano: 5, crit: 15, tipo: "perfuração", alcance: "15m + 3× Destreza", req: { attr: "DES", v: 12 }, price: 500, perComp: "1 por comp.", note: "Manuseio 22.", source: "Guia Avançado" },

  // Especiais
  { id: "espada-chakra-branco", name: "Espada de Chakra Branco", cat: "leve", grupo: "especial", dano: 2, crit: 15, tipo: "corte", espada: true, req: { attr: "DES", v: 8 }, price: 0, perComp: "1 por comp.", note: "Clã Hatake. Energizável.", source: "Básico" },
];

export const ARMA_BY_ID: Record<string, Arma> = Object.fromEntries(ARMAS.map((a) => [a.id, a]));

export const ARMA_CAT_LABEL: Record<ArmaCat, string> = {
  desarmado: "Desarmado",
  leve: "Leve",
  mediana: "Mediana",
  longa: "Longa",
  pesada: "Pesada",
  arremesso: "Arremesso",
  disparo: "Disparo",
  fogo: "Arma de fogo",
  explosivo: "Explosivo",
};

/** Requisito de atributo para empunhar, pela categoria (Livro Básico, pág. 130). */
export function armaReq(a: Arma): Arma["req"] {
  if (a.req !== undefined) return a.req;
  if (a.cat === "leve") return { attr: "FOR/DES", v: 8 };
  if (a.cat === "mediana" || a.cat === "longa") return { attr: "FOR/DES", v: 10 };
  if (a.cat === "pesada") return { attr: "FOR", v: 12 };
  if (a.cat === "disparo") return { attr: "DES", v: a.grupo === "simples" ? 8 : 10 };
  return null;
}

export const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/** Arma do catálogo pelo id escolhido no item ou, em itens antigos, pelo nome. */
export function armaDoItem(i: { arma?: string; name: string }): Arma | null {
  if (i.arma) return ARMA_BY_ID[i.arma] ?? null;
  const n = norm(i.name).replace(/s$/, "");
  if (!n) return null;
  return ARMAS.find((a) => a.cat !== "desarmado" && norm(a.name).replace(/ \(par\)$/, "") === n) ?? null;
}
