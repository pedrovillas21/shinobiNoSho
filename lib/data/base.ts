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

export const RANKS = [
  { min: 4, name: "Genin", ryos: 100 },
  { min: 8, name: "Chuunin", ryos: 1000 },
  { min: 10, name: "Jounin Especial", ryos: 5000 },
  { min: 12, name: "Jounin", ryos: 13000 },
  { min: 16, name: "Jounin Elite", ryos: 36000 },
  { min: 20, name: "Sannin / Kage", ryos: 88000 },
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

export const ITEM_PRESETS: ItemPreset[] = [
  { name: "Kunai", price: 2, perComp: "10 por comp." },
  { name: "Shuriken", price: 3, perComp: "18 por comp." },
  { name: "Senbon", price: 3, perComp: "15 por comp." },
  { name: "Tarja Explosiva", price: 10, perComp: "6 por comp." },
  { name: "Bomba de Fumaça", price: 10, perComp: "6 por comp." },
  { name: "Bomba Luminosa", price: 10, perComp: "6 por comp." },
  { name: "Coldre / Bolsa com cinto", price: 1, perComp: "+1 comp." },
  { name: "Corda (15m)", price: 1, perComp: "1 por comp." },
  { name: "Kit de Medicamentos (5 usos)", price: 50, perComp: "1 por comp." },
  { name: "Kit de Ferramentas (5 usos)", price: 30, perComp: "1 por comp." },
  { name: "Kit de Artesão (5 usos)", price: 30, perComp: "1 por comp." },
  { name: "Kit de Laboratório (5 usos)", price: 50, perComp: "1 por comp." },
  { name: "Pílulas do Soldado (frasco c/ 10)", price: 50, perComp: "1 por comp." },
  { name: "Ração de Viagem (dia)", price: 1, perComp: "6 por comp." },
  { name: "Pergaminho (escrita)", price: 1, perComp: "6 por comp." },
  { name: "Colete Ninja", price: 100, perComp: "armadura leve" },
  { name: "Colete Ninja Resistente", price: 150, perComp: "armadura leve, +10 abs." },
];

/** Custo de itens é gratuito quando fornecido pela vila. */
export const VILLAGE_ITEMS_NOTE =
  "Kunais, senbons, shurikens, tarjas explosivas e bombas de fumaça costumam ser cedidos pela Vila sem custo. Limite sem penalidade: 3 compartimentos.";
