export type AttrKey = "FOR" | "DES" | "AGI" | "PER" | "INT" | "VIG" | "ESP";
export type CombatKey = "CC" | "CD" | "ESQ" | "LM";
export type SkillKey =
  | "acrobacia"
  | "arte"
  | "atletismo"
  | "ciencias"
  | "concentracao"
  | "cultura"
  | "disfarces"
  | "escapar"
  | "furtividade"
  | "animais"
  | "mecanismos"
  | "medicina"
  | "ocultismo"
  | "prestidigitacao"
  | "procurar"
  | "prontidao"
  | "rastrear"
  | "venef";

export type Source = "Básico" | "Hijutsus 1" | "Hijutsus 2" | "Guia Avançado";

/** Pré-requisito estruturado. `any` = basta cumprir um deles. */
export type Req =
  | { t: "attr"; k: AttrKey; min: number }
  | { t: "skill"; k: SkillKey; min: number }
  | { t: "combat"; k: CombatKey; min: number }
  | { t: "apt"; id: string; level?: number }
  | { t: "power"; id: string; min: number }
  | { t: "noOrigin" }
  | { t: "any"; of: Req[] };

export type AptCategory =
  | "combate"
  | "manobra"
  | "tecnica"
  | "geral"
  | "shinobi"
  | "restrita"
  | "especial";

export interface Aptidao {
  id: string;
  name: string;
  cat: AptCategory;
  desc: string;
  /** Texto do pré-requisito como no livro. */
  reqText?: string;
  /** Parte verificável automaticamente (AND). */
  req?: Req[];
  /** Aparece na lista de "opções de escolha gratuita" do livro. */
  free?: boolean;
  /** Genérica: pode ser comprada várias vezes com categorias diferentes. */
  generic?: boolean;
  /** Evolutiva: número máximo de níveis. */
  maxLevel?: number;
  /** Pré-requisito e benefício de cada nível acima do 1º (índice 0 = nível 2). */
  levels?: AptLevel[];
  /** Os níveis vêm de graça ao cumprir o pré-requisito (ex.: Kurohigi); senão cada nível é uma nova compra. */
  levelsFree?: boolean;
  /** Aptidões recebidas de graça na compra (ex.: Técnica Avançada dá 2 de técnica). */
  grants?: { cat: AptCategory; n: number };
  source: Source;
}

export interface AptLevel {
  reqText: string;
  req?: Req[];
  desc: string;
}

export interface Efeito {
  id: string;
  name: string;
  level: number;
  desc: string;
  source: Source;
  /** Níveis do poder em que o efeito pode ser escolhido de novo para evoluir, em ordem (ex.: Raio: [5, 8]). */
  evolves?: number[];
}

export type PowerMode = "efeitos" | "tecnicas" | "livre";

export interface Poder {
  id: string;
  name: string;
  desc: string;
  reqText?: string;
  req?: Req[];
  mode: PowerMode;
  /** Efeitos permitidos (ids), quando mode = efeitos. */
  effects?: string[];
  /** Técnicas prontas por nível, quando mode = tecnicas. */
  techniques?: { level: number; name: string }[];
  /** Poder elemental básico (limite de afinidade). */
  element?: boolean;
  restricted?: boolean;
  source: Source;
}

export interface OriginOption {
  label: string;
  aptidoes: string[];
  poderes: string[];
  note?: string;
}

export interface Origin {
  id: string;
  name: string;
  kind: "cla" | "hijutsu";
  kanji: string;
  source: Source;
  desc: string;
  options: OriginOption[];
  /** Hijutsus que podem ser combinados com clã (ex.: Hachimon). */
  stackable?: boolean;
}

export interface ItemPreset {
  name: string;
  price: number;
  perComp: string;
  note?: string;
}

/* ---------- Ficha ---------- */

export interface PowerEntry {
  id: string; // id do poder no catálogo ou "custom:<uuid>"
  customName?: string;
  level: number;
  /** Efeito escolhido em cada nível (índice 0 = nível 1). */
  effects: (string | null)[];
  /** Nome livre da técnica criada em cada nível. */
  techniques: string[];
  note?: string;
}

export interface AptEntry {
  uid: string;
  id: string; // id do catálogo ou "custom"
  customName?: string;
  /** Categoria escolhida, para aptidões genéricas (ex.: Especialista: Kunai). */
  detail?: string;
  level: number;
  free: boolean;
  /** Escolhas feitas na compra (ex.: os 2 bônus do Juuinka, as 2 aptidões da Técnica Avançada). */
  choices?: string[];
  /** Variante escolhida na compra (ex.: Selo do Céu ou da Terra). */
  variant?: string;
  /** Efeito/observação escrito pela pessoa (aptidões personalizadas). */
  note?: string;
}

export interface ItemEntry {
  uid: string;
  name: string;
  qty: number;
  price: number;
  comps: number;
  note?: string;
}

export interface Optionals {
  /** Guia Avançado: 3 pontos de poder por NC. */
  tresPontosPoder: boolean;
  /** Guia Avançado: sem Especialista, Maestria, Reflexos e Intuição (+4 poderes). */
  aptidoesBanidas: boolean;
  /** Guia Avançado: Dano Extra automático ao atingir CC/CD 18. */
  danoExtraAuto: boolean;
  /** Livro Básico: mais de um clã/hijutsu. */
  multiHijutsu: boolean;
}

/** Clã ou hijutsu criado pelo próprio jogador/mestre. */
export interface CustomOrigin {
  name: string;
  kind: "cla" | "hijutsu";
  kanji: string;
  desc: string;
  /** Aptidões e poderes restritos do catálogo que essa origem libera. */
  aptidoes: string[];
  poderes: string[];
}

export interface CustomSkill {
  uid: string;
  name: string;
  attr: AttrKey;
  trained: boolean;
  pts: number;
  bonus: number;
}

export interface Character {
  id: string;
  createdAt: number;
  updatedAt: number;
  // conceito
  name: string;
  player: string;
  age: string;
  gender: string;
  village: string;
  originVillage: string;
  alignment: string;
  appearance: string;
  personality: string;
  history: string;
  goals: string;
  portrait?: string;
  // mesa
  nc: number;
  optionals: Optionals;
  // origem
  originId: string | null;
  originOption: number;
  extraOrigins: string[];
  customOrigin: CustomOrigin;
  bijuu?: string;
  // números
  attrs: Record<AttrKey, number>;
  combatBase: Record<CombatKey, number>;
  combatBonus: Record<CombatKey, number>;
  acuidade: boolean;
  social: { car: number; man: number };
  skills: Record<SkillKey, number>;
  skillBonus: Record<SkillKey, number>;
  customSkills: CustomSkill[];
  aptidoes: AptEntry[];
  poderes: PowerEntry[];
  items: ItemEntry[];
  extraRyos: number;
  bonus: { vit: number; chakra: number; desloc: number; ini: number };
  notes: string;
  /** Estado da ficha em jogo (Modo Mesa). Criado na primeira vez que a mesa é aberta. */
  play?: PlayState;
}

/* ---------- Modo Mesa ---------- */

export type ModTarget =
  | AttrKey
  | CombatKey
  | "vit"
  | "chk"
  | "ini"
  | "desloc"
  | "dano"
  | "dif"
  | "dureza"
  | "precAtk"
  | "precDef"
  /** 1 = acelerado, 2 = super acelerado. */
  | "acel";

export interface PlayMod {
  t: ModTarget;
  v: number;
  on: boolean;
}

/** Transformação, selo, portão ou bônus temporário que soma modificadores à ficha. */
export interface PlayEffect {
  id: string;
  name: string;
  src: string;
  active: boolean;
  costVit: number;
  costChk: number;
  /** Chakra ganho ao ativar, uma vez por cena (ex.: Juuinka Ni). */
  gainChk: number;
  /** Vitalidade atual ganha ao ativar, por aumento da Vit. máx. (ex.: Yamata pela regra da mesa). Ao desativar, a vida volta ao máximo normal. */
  gainVit?: number;
  usedScene: boolean;
  perVit: number;
  perChk: number;
  /** Duração em turnos; 0 = contínuo. */
  turns: number;
  left: number;
  /** Condição aplicada ao desativar (chave de CONDS) ou "". */
  after: string;
  afterNote: string;
  afterTurns: number;
  hint: string;
  /** Portão do Hachimon, quando o estado é um Hachimon. */
  gate?: number;
  /** Estado criado a partir da ficha (ex.: "juuinka-ichi"); a mesa o mantém em dia com as escolhas da criação. */
  auto?: string;
  /** Assinatura das escolhas usadas para montar os bônus. */
  sig?: string;
  /** Quantos bônus podem ficar ligados ao mesmo tempo (ex.: 2 no Juuinka · Ichi); ligar outro desliga o mais antigo. */
  pick?: number;
  /** Índices dos bônus ligados, na ordem em que foram escolhidos. */
  picked?: number[];
  /** Forma escolhida em estados do catálogo com várias formas (tamanho do Baika, modo da Bijuu…). */
  stage?: number;
  /** Opção liga/desliga do estado do catálogo (Controle Total, pílula…). */
  opt?: boolean;
  mods: PlayMod[];
}

export interface PlayCond {
  id: string;
  /** Chave de CONDS ou "custom:<id>". */
  k: string;
  name: string;
  stacks: number;
  turns: number;
  note: string;
}

export interface PlayCounter {
  id: string;
  n: string;
  cur: number;
  max: number;
  reset: "cena" | "descanso" | "nunca";
  pill?: boolean;
  /** Contador criado a partir da ficha (ex.: "kawarimi"); a mesa o mantém em dia com as aptidões. */
  auto?: string;
  /** Regra curta mostrada abaixo do nome. */
  note?: string;
}

/** Ataque anotado à mão na mesa (arma, taijutsu, técnica de outro livro…). */
export interface PlayAttack {
  id: string;
  name: string;
  base: number;
  cost: number;
  note: string;
}

export interface PlayLog {
  id: string;
  r: string;
  txt: string;
  tone: "bad" | "ok" | "chk" | "n";
}

export interface PlayState {
  vit: number;
  chk: number;
  round: number;
  conds: PlayCond[];
  effects: PlayEffect[];
  counters: PlayCounter[];
  log: PlayLog[];
  notes: string;
  /** Estados automáticos já criados uma vez (se a pessoa remover, a mesa não recria). */
  autoSeen?: string[];
  /** Ataques personalizados do painel de ataques. */
  attacks?: PlayAttack[];
  /** Bônus de dano extra por poder (id do poder), para bônus que a ficha não sabe calcular. */
  dmgExtra?: Record<string, number>;
}
