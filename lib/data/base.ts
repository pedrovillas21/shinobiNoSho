import type { AttrKey, CombatKey, ItemPreset, SkillKey } from "../types";

export const ATTRS: { key: AttrKey; name: string; desc: string }[] = [
  { key: "FOR", name: "Força", desc: "Capacidade muscular. Carga de 10 kg por nível, golpes corporais e Atletismo." },
  { key: "DES", name: "Destreza", desc: "Uso das mãos: arremessos, selos de mão e ataques à distância." },
  { key: "AGI", name: "Agilidade", desc: "Reflexos, esquiva, velocidade e furtividade. Aumenta o deslocamento." },
  { key: "PER", name: "Percepção", desc: "Sentidos e intuição. Base de Ler Movimento e das perícias de busca." },
  { key: "INT", name: "Inteligência", desc: "Raciocínio e conhecimento. Genjutsus, Ninjutsus e perícias de estudo." },
  { key: "VIG", name: "Vigor", desc: "Resistência física ao dano, cansaço e doenças. Define a Vitalidade." },
  { key: "ESP", name: "Espírito", desc: "Controle e extração de chakra. Define o Chakra e o dano de técnicas." },
];

export const COMBAT: { key: CombatKey; name: string; short: string; attr: AttrKey; desc: string }[] = [
  { key: "CC", name: "Combate Corporal", short: "CC", attr: "FOR", desc: "Acertar ou bloquear ataques corporais, rebater projéteis e técnicas de toque." },
  { key: "CD", name: "Combate à Distância", short: "CD", attr: "DES", desc: "Acertar alvos à distância com projéteis ou técnicas de longo alcance." },
  { key: "ESQ", name: "Esquiva", short: "ESQ", attr: "AGI", desc: "Evitar golpes e perigos como avalanches." },
  { key: "LM", name: "Ler Movimento", short: "LM", attr: "PER", desc: "Prever movimentos e reagir com poderes defensivos (manobras de previsão)." },
];

export interface SkillDef {
  key: SkillKey;
  name: string;
  attr: AttrKey;
  trained?: boolean;
  armor?: boolean;
  /** Só pode ser comprada com a aptidão Químico. */
  needsQuimico?: boolean;
  desc: string;
}

export const SKILLS: SkillDef[] = [
  { key: "acrobacia", name: "Acrobacia", attr: "AGI", armor: true, desc: "Equilíbrio, cambalhotas, amortecer quedas, levantar-se rápido." },
  { key: "arte", name: "Arte", attr: "INT", desc: "Criar obras, avaliar itens e se sustentar da arte. Um estilo a cada 4 níveis." },
  { key: "atletismo", name: "Atletismo", attr: "FOR", armor: true, desc: "Correr, escalar, nadar e saltar." },
  { key: "ciencias", name: "Ciências Naturais", attr: "INT", desc: "Biologia, herbalismo e geografia." },
  { key: "concentracao", name: "Concentração", attr: "INT", desc: "Manter técnicas sob distração e usar técnicas à distância em combate próximo." },
  { key: "cultura", name: "Cultura", attr: "INT", desc: "História, nobreza, vilas e jutsus conhecidos. Identificar técnicas." },
  { key: "disfarces", name: "Disfarces", attr: "PER", desc: "Mudar a aparência com maquiagem e truques." },
  { key: "escapar", name: "Escapar", attr: "DES", desc: "Livrar-se de cordas, redes e algemas." },
  { key: "furtividade", name: "Furtividade", attr: "AGI", armor: true, desc: "Esconder-se, mover-se sem ruído, seguir alguém." },
  { key: "animais", name: "Lidar com Animais", attr: "PER", trained: true, desc: "Conduzir, treinar e domesticar animais." },
  { key: "mecanismos", name: "Mecanismos", attr: "INT", trained: true, desc: "Desarmar armadilhas e fechaduras, sabotar dispositivos." },
  { key: "medicina", name: "Medicina", attr: "INT", trained: true, desc: "Primeiros socorros; demais usos exigem Ninja Médico." },
  { key: "ocultismo", name: "Ocultismo", attr: "INT", trained: true, desc: "Segredos, técnicas proibidas e lendas obscuras." },
  { key: "prestidigitacao", name: "Prestidigitação", attr: "DES", desc: "Surrupiar ou plantar objetos sem ser notado." },
  { key: "procurar", name: "Procurar", attr: "PER", desc: "Perceber coisas buscando ativamente." },
  { key: "prontidao", name: "Prontidão", attr: "PER", desc: "Perceber coisas sem procurar. Soma na Iniciativa." },
  { key: "rastrear", name: "Rastrear", attr: "PER", desc: "Seguir rastros e sobreviver nos ermos." },
  { key: "venef", name: "Venefício", attr: "INT", trained: true, needsQuimico: true, desc: "Preparar e reconhecer venenos. Só com a aptidão Químico." },
];

/** Nível shinobi pelo NC, como na Tabela de Evolução (Livro Básico, pág. 30). */
export const RANKS = [
  { min: 4, name: "Genin", ryos: 100 },
  { min: 7, name: "Chuunin", ryos: 1000 },
  { min: 10, name: "Jounin Especial", ryos: 5000 },
  { min: 12, name: "Jounin", ryos: 13000 },
  { min: 15, name: "Jounin Elite", ryos: 36000 },
  { min: 18, name: "Sannin / Kage", ryos: 88000 },
] as const;

export const ALIGNMENTS = [
  "Leal e Bom",
  "Neutro e Bom",
  "Caótico e Bom",
  "Leal e Neutro",
  "Neutro",
  "Caótico e Neutro",
  "Leal e Mau",
  "Neutro e Mau",
  "Caótico e Mau",
];

export const VILLAGES = [
  "Konoha (Folha)",
  "Suna (Areia)",
  "Kiri (Névoa)",
  "Kumo (Nuvem)",
  "Iwa (Pedra)",
  "Ame (Chuva)",
  "Oto (Som)",
  "Kusa (Grama)",
  "Taki (Cachoeira)",
  "Hoshi (Estrela)",
  "Nukenin",
];

export const JUTSUS_BASICOS = [
  { name: "Bunshin no Jutsu", rank: "E", desc: "Um ou dois clones ilusórios. 1 PC." },
  { name: "Henge no Jutsu", rank: "E", desc: "Transforma-se em outra pessoa, animal ou objeto. 1 PC." },
  { name: "Kai", rank: "D", desc: "Liberta a si ou outro de um Genjutsu." },
  { name: "Kawarimi no Jutsu", rank: "E", desc: "Troca de lugar com um objeto; uma vez por cena evita um ataque. 1 PC." },
  { name: "Kinobori", rank: "E", desc: "Anda por paredes e árvores com chakra nos pés. 1 PC." },
  { name: "Shunshin no Jutsu", rank: "D", desc: "Movimentação instantânea até o deslocamento máximo. 1 PC." },
  { name: "Tadayou", rank: "D", desc: "Caminha sobre a água. 1 PC." },
];

const FERRAMENTA = "Ferramentas Shinobi Utilitárias";
const MUNICAO = "Munição";
const ARMADURA = "Armaduras e roupas";
const GERAL = "Itens gerais";

/**
 * Itens da Tabela de Itens Gerais e de Armaduras (Livro Básico, pág. 137–139) e as Ferramentas Shinobi Utilitárias do
 * Guia Avançado (pág. 59–70). As armas ficam em armas.ts.
 */
export const ITENS: ItemPreset[] = [
  // Armas de arremesso e explosivos que a vila costuma ceder: atalhos para a tabela de armas.
  { name: "Kunai", price: 2, perComp: "10 por comp.", cat: "Armas", quick: true },
  { name: "Shuriken", price: 3, perComp: "30 por comp.", cat: "Armas", quick: true },
  { name: "Senbon", price: 3, perComp: "15 por comp.", cat: "Armas", quick: true },
  { name: "Tarja Explosiva", price: 10, perComp: "6 por comp.", cat: FERRAMENTA, quick: true },

  { name: "Boleadeira", price: 10, perComp: "6 por comp.", note: "Ataque à distância (6m) que deixa o alvo Caído. Pede Destreza 10.", cat: FERRAMENTA },
  { name: "Bomba de Fumaça", price: 10, perComp: "6 por comp.", note: "Cortina de fumaça de 10m de diâmetro. Até 2 por ação padrão.", cat: FERRAMENTA, quick: true },
  { name: "Bomba de Marcação", price: 10, perComp: "6 por comp.", note: "Tinta e cheiro numa área de 10m: Agilidade ou Prontidão (Dif 9 + Int) ou fica marcado.", cat: FERRAMENTA },
  { name: "Bomba Luminosa", price: 10, perComp: "6 por comp.", note: "Meia-esfera de 10m: Prontidão ou Agilidade (Dif 9 + Int) ou Ofuscado por 3 turnos.", cat: FERRAMENTA, quick: true },
  { name: "Bomba Som de Trovão", price: 10, perComp: "6 por comp.", note: "Esfera de 100m: Vigor Dif 18 ou Surdo por 10 turnos. Ouvida a 1km.", cat: FERRAMENTA },
  { name: "Estrepes", price: 10, perComp: "2 por comp.", note: "Área de 5m a até 6m: Lento e 1 de dano por metro andado.", cat: FERRAMENTA },
  { name: "Kousen (15m)", price: 2, perComp: "1 por comp.", note: "Fio de aço. Arma marcial leve sem dano; ferramenta utilitária só na manobra Amarrar.", cat: FERRAMENTA },
  { name: "Rede", price: 10, perComp: "2 por comp.", note: "Contra alvo desprevenido ou indefeso, CD −2: acertando, o alvo fica Impedido.", cat: FERRAMENTA },
  { name: "Tampões de Ouvido", price: 1, perComp: "—", note: "Protege de efeitos sonoros, mas deixa Surdo. Pôr: ação de movimento.", cat: FERRAMENTA },

  { name: "Flechas para arcos", price: 1, perComp: "20 por comp.", cat: MUNICAO },
  { name: "Virotes para bestas", price: 1, perComp: "20 por comp.", cat: MUNICAO },
  { name: "Munição para arma de fogo", price: 1, perComp: "20 por comp.", cat: MUNICAO },

  { name: "Roupa Comum", price: 10, perComp: "armadura leve, +0 abs.", cat: ARMADURA },
  { name: "Manopla", price: 5, perComp: "armadura leve, +0 abs.", cat: ARMADURA },
  { name: "Colete Ninja", price: 100, perComp: "armadura leve, +1 comp.", cat: ARMADURA, quick: true },
  { name: "Colete Ninja Resistente", price: 150, perComp: "armadura leve, +10 abs., −1 comp.", cat: ARMADURA },
  { name: "Armadura de Batalha", price: 250, perComp: "armadura pesada, +15 abs., −1 comp.", note: "Penalidade de armadura 0 (−2).", cat: ARMADURA },
  { name: "Armadura de Batalha Reforçada", price: 600, perComp: "armadura pesada, +20 abs., −2 comp.", note: "Penalidade de armadura −2 (−4).", cat: ARMADURA },

  { name: "Algemas", price: 15, perComp: "1 por comp.", cat: GERAL },
  { name: "Caneta", price: 1, perComp: "—", cat: GERAL },
  { name: "Coldre / Bolsa com cinto", price: 1, perComp: "+1 comp.", cat: GERAL, quick: true },
  { name: "Corda (15m)", price: 1, perComp: "1 por comp.", cat: GERAL, quick: true },
  { name: "Instrumento Musical", price: 50, perComp: "1 por comp.", cat: GERAL },
  { name: "Kit de Artesão (5 usos)", price: 30, perComp: "1 por comp.", cat: GERAL },
  { name: "Kit de Ferramentas (5 usos)", price: 30, perComp: "1 por comp.", cat: GERAL },
  { name: "Kit de Laboratório (5 usos)", price: 50, perComp: "1 por comp.", cat: GERAL },
  { name: "Kit de Medicamentos (5 usos)", price: 50, perComp: "1 por comp.", cat: GERAL, quick: true },
  { name: "Lanterna", price: 7, perComp: "1 por comp.", cat: GERAL },
  { name: "Mochila", price: 2, perComp: "+4 comp.", cat: GERAL },
  { name: "Pergaminho (escrita)", price: 1, perComp: "6 por comp.", cat: GERAL },
  { name: "Pergaminho (jutsus)", price: 10, perComp: "1 por comp.", cat: GERAL },
  { name: "Pílulas do Soldado (frasco c/ 10)", price: 50, perComp: "1 por comp.", cat: GERAL, quick: true },
  { name: "Ração de Viagem (dia)", price: 1, perComp: "6 por comp.", cat: GERAL, quick: true },
  { name: "Saco de Dormir", price: 1, perComp: "1 por 2 comp.", cat: GERAL },
  { name: "Tarja Especial (selos)", price: 10, perComp: "6 por comp.", cat: GERAL },
];

/** Botões de adicionar rápido: os itens de toda missão. */
export const ITEM_PRESETS = ITENS.filter((i) => i.quick);

/** Seções do seletor de itens, na ordem da lista (as armas têm seletor próprio). */
export const ITEM_GRUPOS: [string, ItemPreset[]][] = [FERRAMENTA, MUNICAO, ARMADURA, GERAL].map((cat) => [cat, ITENS.filter((i) => i.cat === cat)]);

/** Custo de itens é gratuito quando fornecido pela vila. */
export const VILLAGE_ITEMS_NOTE =
  "Kunais, senbons, shurikens, tarjas explosivas e bombas de fumaça costumam ser cedidos pela Vila sem custo. Limite sem penalidade: 3 compartimentos.";
