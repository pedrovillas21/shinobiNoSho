import { ataquesBasicos, critText, letalText, type DanoCtx } from "./dano";
import { EFEITO_BY_ID, EXCLUSIVOS, PODER_BY_ID } from "./data/poderes";
import type { PlayView } from "./play";
import { custoVisao, espParam, evolucaoDe, gratisFonte, hasApt, hibonBonus, hasChakraExpandido, hasHipnose, katonLevel, kekkeiGratis, maestriaEm, mangekyou, maximizarEm, mimicaCopias, powerLevel, reachEvolution, skillTotal, talentoNatural, versatileName, versatilePicksDe, versatileTechs } from "./rules";
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
  "lamina-raios": { kind: { k: "comum" }, note: "Ataque de CC. Ignora 1 de dureza e quebra armas no bloqueio." }, // nota real em laminaRaiosNote
  descarga: { kind: { k: "metade" }, note: "Vigor (Dif −3) ou atordoado." },
  "lamina-vento": { kind: { k: "laminas" }, note: "Ação completa. Prontidão ou fica fintado. Só o bônus do elemento." },
  "bracos-serpente": { kind: { k: "arma", arma: 3 }, note: "Arma longa de 6m; bloqueia ataques armados. Contínua depois de criada.", costFixed: 4, noMeta: true },
  "colisao-ondas": { kind: { k: "valor", v: 10 }, note: "Construções sofrem o dobro. Evolução Nv 8: base 14; Nv 10: 18." },
  "mina-explosiva": {
    kind: { k: "comum" },
    note: "Funciona como tarja explosiva (Livro Básico, p. 134), com o dano e a Dif de ativação remota do Kibaku Nendo; sem bônus por tarjas extras. Detona sozinha a 2m ou por ativação remota até o alcance do poder. Lançar exige kunai. Potencializar: ação de movimento na hora da explosão.",
  },
};

/** Mina Explosiva Nv 6 (evolução): várias minas à distância com ação completa. */
const MINA_NV6 = " Nv 6: planta várias minas com ação completa, até 15m, em até tantos locais quanto o nível do poder; só 1 ativação remota por rodada; não precisa de kunai.";

/**
 * Lâmina de Raios (Livro Básico, Raiton): o que cada evolução muda (Nv 5, 7 e 9). Usado abaixo do nível da evolução,
 * o efeito fica sem o melhoramento dela (Livro Básico, Evoluindo Efeitos).
 */
function laminaRaiosNote(ev: number): string {
  const out = ["Ataque de CC. Prepara com ação de movimento. Ignora 1 de dureza e quebra armas comuns no bloqueio, mesmo energizadas (menos Fuuton e Raiton)."];
  if (ev >= 1) out.push("Usada no Nv 5+: prepara com ação parcial.");
  if (ev >= 2) out.push("Nv 7+: ignora toda dureza (proteção Raiton: só metade; Fuuton: nenhuma).");
  if (ev >= 3) out.push("Nv 9+: Crítico Aprimorado, cumulativo com o Domínio do Raio.");
  return out.join(" ");
}

/** O que mostrar nos efeitos que não causam dano: dureza da criação, dificuldade do teste do alvo ou só o texto. */
interface UtilSpec {
  show: "dureza" | "dif" | "texto" | "absorcao";
  /** Rótulo do número (ex.: "Força ou Escapar"). */
  label?: string;
  txt: string | ((x: { meia: number; key: number; lvl: number; ev: number }) => string);
  difAdj?: number;
  /** Metade da dureza comum (ex.: Prisão de Água). */
  durezaHalf?: boolean;
  /** Dobro da dureza comum (ex.: Golem de Pedra). */
  durezaDobro?: boolean;
  costFixed?: number;
  /** Custo igual a ½ do nível usado, arredondado para cima (ex.: Cortina de Poeira). */
  costHalf?: boolean;
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
  // Doton: efeitos para Kekkei Touta (Livro de Hijutsus vol. 2, Jinton).
  "reducao-peso": {
    show: "texto",
    costFixed: 5,
    txt: ({ key, lvl, ev }) =>
      `Voa (Voo ${key}, conta como alado). Por toque, dá o voo a outros: 5 de chakra cada, até ${lvl} pessoas; só você sustenta. Ou, no lugar do voo, +10m de deslocamento a um alvo (concentração e contato; não vale na 2ª opção do hijutsu). Ação parcial, sustentada.${
        ev >= 1 ? " Nv 8: deixa objetos leves por toque (área do tamanho comum, 8 de chakra) e defende ataques físicos e técnicas materiais (ação parcial, ½ Espírito, LM +2): reduz o dano pelo dano comum do Doton. Socos e chutes de quem está leve: −2 de dano base." : ""
      }`,
  },
  "adicao-peso": {
    show: "texto",
    txt: ({ ev }) =>
      `Como a Pele de Pedra Nv 6. Socos Pesados (custo da Pele de Pedra): dureza de corpo sustentada ${ev >= 1 ? 3 : 2}, Socos de Pedra com dano de arma 5${ev >= 1 ? " que não podem ser bloqueados" : ""}, e você fica com Sobrepeso. Aumentar Peso (4 de chakra): toque com teste de CC, sem dano; o alvo fica com Sobrepeso pelo resto da cena enquanto você sustentar (1× por cena no mesmo alvo). Sobrepeso: −3m de deslocamento e −1 de precisão em testes de mobilidade, Força ou Agilidade; acumula com excesso de compartimentos. Ação de movimento, sustentada.`,
  },
  "golem-pedra": {
    show: "dureza",
    label: "Dureza do golem",
    durezaDobro: true,
    txt: ({ key, lvl, ev }) =>
      `Golem ${ev >= 1 ? "enorme, comandado com ações livres" : "grande"}: age como personagem (ação padrão, movimento, ataque oportuno) e lança seus Doton com as ações dele, mas não usa outras técnicas nem aptidões. Ataque corporal: dano comum −2 (${lvl + half(key) - 2} + bônus do Doton), precisão −3 com os modificadores de tamanho. Sem mente: imune a genjutsu. Restaurar: 1× por golem, ação livre, renova a dureza. Ação de movimento; controle sustentado (Nv 10: contínuo), sem controle vira objeto.`,
  },
  // Doton: efeitos para Daikiga (Livro de Hijutsus vol. 2, p.31).
  "cortina-poeira": {
    show: "dureza",
    label: "Dureza imaginária",
    costHalf: true,
    txt: ({ lvl }) =>
      `Use junto com o Tremor (pago à parte; pode usar CC no lugar de CD): ação parcial e chakra igual a ½ do nível do Tremor. Cortina de poeira circular do tamanho comum, com as regras da Névoa Nv 2: além de 1m, camuflagem parcial. Dura ${lvl} turnos.`,
  },
  "golem-insaciavel": {
    show: "dureza",
    label: "Dureza do golem",
    durezaDobro: true,
    txt: ({ key, lvl, ev }) =>
      `Como o Golem de Pedra do Jinton. Golem ${ev >= 1 ? "enorme, comandado com ações livres" : "grande"}: age como personagem (ação padrão, movimento, ataque oportuno) e lança seus Doton com as ações dele, mas não usa outras técnicas nem aptidões. Ataque corporal: dano comum −2 (${lvl + half(key) - 2} + bônus do Doton), precisão −3 com os modificadores de tamanho, e drena ${Math.ceil(key / 4)} de chakra da vítima (¼ do Espírito; o chakra se dispersa). Sem mente: imune a genjutsu. Restaurar: 1× por golem, ação livre, renova a dureza. Ação de movimento, sem selos; duração contínua.`,
  },
  // Mokuton: efeitos exclusivos (Livro Básico) e efeitos para Zetsu (Livro de Hijutsus vol. 2, p.134–135).
  transmissor: {
    show: "texto",
    txt: "Desfaz um Moku Bunshin em sementes. Implantada no alvo (roupa, comida), segue as regras da aptidão Sensor, mas só detecta quem carrega a semente; só você capta. Ação parcial, toque, contínua.",
  },
  "selar-chakra": {
    show: "texto",
    txt: ({ lvl, ev }) =>
      `Use junto com o Raio (dano normal): o alvo perde ${half(lvl)} de chakra (½ do nível usado). Selar Chakra Bijuu: ação preparada contra Jinchuuriki descontrolado (Modo Bijuu ou menos) com Jinchuuriki ${ev >= 1 ? "de nível igual ou menor que o seu Mokuton" : "menor que o seu Mokuton"}; teste de Espírito (Dif 7 + 2× nível do Jinchuuriki); dez pilares suprimem o chakra sob concentração e o alvo desmaia por 10 minutos.${ev >= 1 ? " Nv 9: quebra técnicas de controle de Bijuu pelo toque (regras do Kai)." : ""}`,
  },
  "golem-mokuton": {
    show: "texto",
    txt: ({ key, lvl, ev }) =>
      `Golem de madeira ${ev >= 1 ? "colossal" : "imenso"} com os seus atributos (Força = Espírito ${key}), dureza 0 e metade da sua Vitalidade; habilidades de combate iguais às suas, perícias 0. Ataque corporal: dano comum do poder (${lvl + half(key)} + bônus do Mokuton)${ev >= 1 ? ", com Selar Chakra de graça" : ""}. Comandar Parceiro, controlado direto por concentração (sem ela, vira objeto); usa seus Mokuton com as ações dele. Ação de movimento e ½ do custo: cura metade da Vitalidade do golem. Sem mente: imune a genjutsu. 1 golem por cena. Ação padrão.`,
  },
  efemeroptero: {
    show: "texto",
    costFixed: 5,
    txt: ({ key }) =>
      `Sob o Imergir, no solo: 5 de chakra e 1 minuto de concentração; enquanto concentrar, viaja ${50 * key}m por rodada sob a terra (50m × Espírito), sem custo a mais. Imergir Perfeito: atravessa qualquer meio sólido com ação padrão e 1 de chakra, sem ataques oportunos.`,
  },
  "chuva-esporos": {
    show: "dureza",
    label: "Dureza dos esporos",
    txt: ({ lvl, ev }) =>
      `Ação completa: CD contra todos na área (defesa normal), a partir de você ou de um Clone Zetsu. Infectados perdem ${half(lvl)} de chakra por turno (sem passar de zero${ev >= 1 ? ", até a morte por chakra negativo" : ""}); ficam Impedidos em ${ev >= 1 ? 1 : 3} turno(s) e Indefesos em ${ev >= 1 ? 5 : 8}; após 10 turnos os esporos viram Clones Zetsu. Recolher o chakra: toque (CC), ação padrão. No Modo Eremita (Kuchiyose), o alvo vira pedra. Contínua.`,
  },
  venenoso: { show: "texto", txt: "Cone que injeta um veneno seu (até nível II) sem causar dano. O veneno é consumido." },
  afiar: { show: "texto", txt: "Arma real de corte ou perfuração: benefícios do Energizar, ignora 1 de dureza, +1 na margem de crítico e lâmina estendida." },
  flutuar: { show: "texto", txt: "Voa sobre o Leque Gigante (Voo = Espírito, condição Alado). Também amortece quedas.", costFixed: 5 },
  "arma-eletrica": { show: "texto", txt: "Energizar armas de corte/perfuração (3), criar projéteis elétricos (1) ou lâmina que ignora 1 de dureza (4)." },
  nevoa: { show: "dureza", label: "Dureza imaginária", txt: "Círculo de 30m + 3m por Espírito: além de 1m, camuflagem parcial (Nv 5: total). Sustentada." },
  "prisao-agua": { show: "dureza", durezaHalf: true, txt: "Alvo a 1m fica paralisado (Força com Dif comum para se soltar). Concentração." },
  "infligir-medo": { show: "dif", label: "Inteligência", difAdj: -2, txt: "Alvo assustado por 2 rodadas (Nv 5: amedrontado; Nv 7: aterrorizado). −1 na Dif por alvo extra." },
  montaria: {
    show: "absorcao",
    label: "Absorção",
    txt: "Animal de argila (Montaria Especial): dureza 0, não ataca e não tem mente. Liga o estado “Montaria de Argila” e enche a absorção dela. As bombas usadas ficam nela: dá para explodi-la como material de um efeito de nível igual ou menor. Viagem: metade do chakra e duração permanente (pague o resto ao entrar em combate).",
  },
  "espelhos-demoniacos": {
    show: "absorcao",
    label: "Absorção de cada espelho",
    txt: "21 espelhos de gelo em cúpula; teste de CD contra Evadir para prender quem está na área. Entrar num espelho é ação livre; trocar de espelho, ação de movimento (acelerado, com finta acelerada à distância). Ataque contra você: 1 dado, com 4 ou menos acerta um reflexo. Fugir pelas frestas dá ataque oportuno. Reconstruir: ação de movimento. Chakra por turno.",
  },
};

/** Espelhos Demoníacos Nv 8: dureza 2, trocar de espelho com ação parcial, Flechas na finta e no ataque oportuno, 4 de chakra por turno. */
const ESPELHOS_NV8 = " Nv 8: dureza 2, trocar de espelho é ação parcial e dá para usar Flechas na finta e no ataque oportuno.";

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
    case "cortina-poeira":
      return { alcance: "com o Tremor", area: `círculo de ${m(T)}` };
    case "selar-chakra":
      return { alcance: m(A), area: "alvos do Raio" };
    case "transmissor":
      return { alcance: "toque", area: "1 Moku Bunshin" };
    case "efemeroptero":
      return { alcance: `${m(50 * key)} por rodada` };
    case "chuva-esporos":
      return { alcance: "você ou um Clone Zetsu", area: `círculo de ${m(T)} de diâmetro` };
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
    case "espelhos-demoniacos":
      return { alcance: "ao seu redor", area: `meia-esfera de ${m(lvl)} de diâmetro` };
    case "montaria":
      return { alcance: "toque", area: ev >= 1 && lvl >= 5 ? "Enorme · até 5 pessoas" : "Grande · até 2 pessoas" };
    case "mina-explosiva":
      return { alcance: ev >= 1 && lvl >= 6 ? "até 15m" : "toque (ou lançada com kunai)", area: "explosão de 5m" };
    default:
      // Energizar, Criar Arma, Afiar, Pele de Pedra, Imergir, Flutuar…
      return { alcance: "pessoal" };
  }
}

/** Dureza extra das criações do elemento. */
const DUREZA: Record<string, number> = {
  doton: 2,
  hyouton: 2,
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
  hyouton: 1,
  mokuton: 1,
};

/** Dificuldade de resistência a mais do poder (a do Hibon Ninpou depende da bonificação escolhida). */
const difPoder = (c: Character, id: string) => (DIF_PODER[id] ?? 0) + (id === "hibon" ? hibonBonus(c).dif : 0);

/** Dureza a mais das criações do poder (idem). */
const durezaPoder = (c: Character, id: string) => (DUREZA[id] ?? 0) + (id === "hibon" ? hibonBonus(c).dureza : 0);

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
  /** Pontos de visão gastos ao usar (técnicas do Mangekyou). */
  vis?: number;
  /** Técnica do Sharingan: não sai com o Sharingan travado (visão zerada ou cego). */
  sharingan?: boolean;
  /** Contador da mesa gasto a cada uso (ex.: Izanagi); sem usos, a técnica não sai. */
  contador?: string;
  /** Kinjutsu que, ao terminar com este uso, custa um olho (Izanagi, Izanami). */
  olho?: string;
  /** Efeito sem dano: número principal (dureza ou Dif) e o que ele faz. */
  info?: { v?: number; label?: string; txt: string };
  /** Alcance e área de efeito. */
  geo?: Geo;
  /** Bombas de argila gastas no uso (Kibaku Nendo: o nível usado). */
  bombas?: number;
  /** Estado da mesa ligado pelo uso (Montaria de Argila), na forma indicada. */
  ativa?: { estado: string; stage: number };
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
  /** Ataque sem nível de poder (taijutsu e armas): mostra `tags` no lugar do nível. */
  tags?: string[];
  /** Teste de acerto (CC ou CD) com os bônus de precisão que a ficha conhece (Maestria, Especialista…). */
  teste?: { k: "CC" | "CD"; v: number; why: string[] };
  /** Arma à distância: alcance sem penalidade em metros (até o dobro −1, até o quádruplo −3). */
  faixa?: number;
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
  /** Texto no lugar de "atributo chave" e nível (grupo de taijutsu e armas). */
  info?: string;
  /** Aviso sobre o grupo inteiro (ex.: Hachimon aberto). */
  notice?: string;
  /** Alcance e tamanho comum do poder, em metros. */
  alcance?: number;
  tamanho?: number;
  /** Bônus que entram em todo efeito do poder. */
  bonus: { label: string; v: number }[];
  /** Bônus de precisão do grupo (Maestria), só para mostrar no cabeçalho. */
  prec?: string;
  /** Recurso gasto a cada uso, para o cabeçalho (ex.: bombas de argila). */
  recurso?: string;
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
  let { label, val }: { label: string; val: number } = espParam(c, v.attrs);
  if (sk) {
    const s = v.skills.find((x) => x.key === sk.k)?.eff ?? 0;
    if (!sk.optional || s > val) {
      label = sk.label;
      val = s;
    }
  }
  return { label, val };
}

/**
 * Parâmetros de um poder de efeitos pela ficha (sem estados da mesa), para a criação e a folha: atributo ou perícia
 * chave (Arte no Kibaku Nendo), dano comum com o bônus do elemento, dificuldade e alcance.
 */
export function paramsPoder(c: Character, id: string, lvl: number) {
  const sk = CHAVE_PERICIA[id];
  let { label, val }: { label: string; val: number } = espParam(c);
  if (sk) {
    const s = skillTotal(c, sk.k) ?? 0;
    if (!sk.optional || s > val) {
      label = sk.label;
      val = s;
    }
  }
  const bonus: { label: string; v: number }[] = [];
  if (ELEMENTO[id]) bonus.push({ label: (PODER_BY_ID[id]?.name ?? id).split(" (")[0], v: ELEMENTO[id] });
  if (id === "hibon" && hibonBonus(c).dano) bonus.push({ label: "Hibon", v: hibonBonus(c).dano });
  if (id === "suiton" && hasApt(c, "elemento-natural-suiton")) bonus.push({ label: "Elemento Natural", v: 2 });
  if (id === "doton" && hasApt(c, "elemento-natural-terra")) bonus.push({ label: "Elemento Natural", v: 1 });
  const meio = half(val);
  const dano = lvl + meio + bonus.reduce((t, b) => t + b.v, 0);
  const dif = 9 + lvl + meio + difPoder(c, id);
  return {
    label,
    val,
    dano,
    danoTxt: [`${lvl}`, `½${label} ${meio}`, ...bonus.map((b) => `${b.label} ${b.v}`)].join(" + "),
    dif,
    difTxt: `9 + ${lvl} + ½${label} ${meio}${difPoder(c, id) ? ` + ${difPoder(c, id)}` : ""}`,
    alcance: alcanceTamanho(id, val).alcance,
  };
}

/** Efeito escolhido num poder: nome da técnica e evolução alcançada. */
interface EffPick {
  eff: string;
  tech: string;
  ev: number;
  /** Ganho pelo Talento Natural. */
  talento?: boolean;
  /** De onde veio o efeito, quando não foi escolhido no poder (ex.: Elemento Natural). */
  tag?: string;
  /** Nível máximo usado acima do nível do poder (Canhão grátis da kekkei genkai, no nível dela). */
  nivel?: number;
}

/** Junta a mesma escolha feita em compras diferentes, guardando a evolução mais alta. */
function addPick(picks: EffPick[], x: EffPick) {
  const cur = picks.find((y) => y.eff === x.eff);
  if (!cur) picks.push(x);
  else {
    cur.ev = Math.max(cur.ev, x.ev);
    if (!cur.tech) cur.tech = x.tech;
    if (!cur.tag) cur.tag = x.tag;
    if (x.nivel) cur.nivel = Math.max(cur.nivel ?? 0, x.nivel);
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
  c.poderes.forEach((pe, idx) => {
    const def = PODER_BY_ID[pe.id];
    if (!def || def.mode !== "efeitos" || pe.id === "versatilidade") return;
    const g = byId.get(pe.id) ?? { level: 0, picks: [] };
    g.level = Math.max(g.level, pe.level);
    pe.effects.slice(0, pe.level).forEach((eff, i) => {
      if (!eff || !EFEITO_BY_ID[eff]) return;
      // Escolher o efeito de novo = evolução, nesta tabela ou em outra do mesmo poder.
      addPick(g.picks, { eff, tech: pe.techniques[i]?.trim() ?? "", ev: evolucaoDe(c, idx, i) });
    });
    byId.set(pe.id, g);
  });
  // Elemento Natural: Katon (clã Uchiha): com o Katon no nível 4, o Sopro Destrutivo vem de graça e evolui sozinho no 7 e no 10.
  const natural = hasApt(c, "elemento-natural-katon");
  const katonG = byId.get("katon");
  if (natural && katonG && katonG.level >= 4) addPick(katonG.picks, { eff: "sopro", tech: "", ev: katonG.level >= 10 ? 2 : katonG.level >= 7 ? 1 : 0, tag: "Elemento Natural" });
  // Terra Insaciável (Daikiga): Barreira Nv 6 de graça no Doton. A próxima Barreira escolhida já conta como Nv 9 em
  // `evolucoes` (rules.ts); aqui só garante o Nv 6 e o limite do nível do Doton.
  const dotonG = byId.get("doton");
  if (hasApt(c, "terra-insaciavel") && dotonG) {
    const tag = "Terra Insaciável: CC no lugar de CD para prender ou de LM+2 para defender";
    const cur = dotonG.picks.find((x) => x.eff === "barreira");
    const ev = Math.max(1, Math.min(cur?.ev ?? 0, reachEvolution("barreira", dotonG.level)));
    if (cur) Object.assign(cur, { ev, tag: cur.tag ?? tag });
    else addPick(dotonG.picks, { eff: "barreira", tech: "", ev, tag });
  }
  // Kekkei genkai de elemento: 1 nível grátis nos elementos que a formam, com o Canhão no nível da kekkei genkai.
  for (const g of kekkeiGratis(c)) {
    const el = byId.get(g.el) ?? { level: 1, picks: [] };
    byId.set(g.el, el);
    addPick(el.picks, { eff: "canhao", tech: "", ev: 0, tag: `grátis pelo ${gratisFonte(g.from)}`, nivel: g.lvl });
  }
  for (const [id, g] of byId) {
    if (id === "hibon" && tn?.target === "hibon") addTalento(g, tn.eff);
    if (g.picks.length) groups.push(effectGroup(c, v, p, { key: id, powerId: id, title: PODER_BY_ID[id].name, level: g.level, picks: g.picks }));
  }
  if (natural && !(katonG && katonG.level >= 4)) groups.push(katonNatural(c, v, p));

  // Versatilidade: cada poder versátil vira um grupo com alcance, tamanho e bônus do próprio elemento.
  // Os parâmetros usam o nível de Versatilidade mais alto entre as compras (como no Ninpou comprado 2×).
  // O mesmo poder versátil em mais de uma compra (4ª Versatilidade, regra da casa) junta os efeitos num grupo só.
  const vLevel = powerLevel(c, "versatilidade");
  const vGroups = new Map<string, { level: number; picks: EffPick[] }>();
  c.poderes.forEach((pe, idx) => {
    if (pe.id !== "versatilidade") return;
    (pe.versatile ?? []).forEach((id, k) => {
      if (!id || PODER_BY_ID[id]?.mode !== "efeitos") return;
      const g = vGroups.get(id) ?? { level: vLevel, picks: [] as EffPick[] };
      vGroups.set(id, g);
      for (const x of versatilePicksDe(c, idx, k)) if (x.eff && EFEITO_BY_ID[x.eff]) addPick(g.picks, { eff: x.eff, tech: x.tech.trim(), ev: x.ev });
    });
  });
  for (const [id, g] of vGroups) {
    if (tn?.target === id) addTalento(g, tn.eff);
    if (g.picks.length) groups.push(effectGroup(c, v, p, { key: `versatilidade:${id}`, powerId: id, title: versatileName(id), level: vLevel, picks: g.picks }));
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

  const jin = powerLevel(c, "jinton");
  if (jin) groups.push(jintonGroup(c, v, p, jin));

  const sharingan = sharinganGroup(c, v, p);
  if (sharingan) groups.push(sharingan);
  const ms = mangekyouGroup(c, v, p);
  if (ms) groups.push(ms);

  return groups;
}

/**
 * Jinton (Livro de Hijutsus vol. 2, Kekkei Touta): não segue o Ninpou nem tem lista de efeitos; é uma técnica só,
 * o Genkai Hakuri no Jutsu. Alcance curto (5m + 1m por Espírito), esfera de 0,5m por Espírito, dano nível + Espírito,
 * custo igual ao nível usado. Sem meta-aptidões até o Jinton 10 (Destruição Avançada), quando o Maximizar também vale.
 */
function jintonGroup(c: Character, v: PlayView, p: PlayState, lvl: number): AtkGroup {
  const k = chave(c, v, "jinton");
  const extra = p.dmgExtra?.jinton ?? 0;
  const avancada = lvl >= 10;
  const maxi = avancada && maximizarEm(c) === "jinton";
  const potOn = (pot: PotMode | undefined, md: PotMode) => !!pot && (pot === md || maxi);
  const alcance = 5 + k.val;
  const area = k.val / 2;
  const note = [
    "Prepare o cubo com uma ação padrão (Técnica Acelerada não reduz); no turno seguinte, expanda como ataque à distância (ação padrão). Na área, −2 de precisão nas defesas (não vale contra Super Acelerados).",
    avancada
      ? "Destruição Avançada (Jinton 10): meta-aptidões na preparação; golpe de misericórdia contra um alvo impedido e morte instantânea contra um alvo indefeso."
      : "Sem meta-aptidões (liberadas no Jinton 10).",
  ].join(" ");
  const row: AtkRow = {
    key: "jinton:genkai-hakuri",
    name: "Genkai Hakuri no Jutsu",
    sub: "Separação do Mundo Primitivo · sustentada (1 ataque)",
    note,
    min: 1,
    max: lvl,
    meta: avancada,
    free: false,
    calc: (n, opt) => {
      const pot = avancada ? opt.pot : undefined;
      const parts = [`Nv ${n}`, `${k.label} ${k.val}`];
      let base = n + k.val;
      if (extra) {
        base += extra;
        parts.push(`extra ${extra}`);
      }
      if (v.dano) {
        base += v.dano;
        parts.push(`estado ${v.dano}`);
      }
      if (potOn(pot, "dano")) {
        base += 1;
        parts.push(maxi ? "Maximizar 1" : "Potencializar 1");
      }
      const A = alcance * (potOn(pot, "alcance") ? 2 : 1);
      const T = area * (potOn(pot, "area") ? 2 : 1);
      return { base: Math.max(0, base), cost: n, dif: 0, noDif: true, parts, geo: { alcance: m(A), area: `esfera de ${String(T).replace(".", ",")}m de diâmetro` } };
    },
  };
  return {
    id: "jinton",
    title: "Jinton (Poeira)",
    level: lvl,
    keyLabel: k.label,
    keyVal: k.val,
    alcance,
    notice: maxi ? "Maximizar: o Potencializar aplica os três melhoramentos de uma vez." : undefined,
    bonus: [],
    extra,
    rows: [row],
  };
}

/** Elemento Natural: Katon sem o poder no nível 4: Sopro Destrutivo 4, dano base Espírito +2 e custo ½ Espírito (Livro Básico, pág. 180). */
function katonNatural(c: Character, v: PlayView, p: PlayState): AtkGroup {
  const { label, val: esp } = espParam(c, v.attrs);
  const at = alcanceTamanho("katon", esp);
  const extra = p.dmgExtra?.["elemento-natural-katon"] ?? 0;
  const row: AtkRow = {
    key: "elemento-natural-katon:sopro",
    name: "Sopro Destrutivo",
    sub: "Elemento Natural: Katon",
    note: DANO_EFEITO.sopro.note,
    min: 4,
    max: 4,
    meta: false,
    free: false,
    calc: () => {
      const parts = [`${label} ${esp}`, "Katon 2"];
      if (extra) parts.push(`extra ${extra}`);
      if (v.dano) parts.push(`estado ${v.dano}`);
      return { base: Math.max(0, esp + 2 + extra + v.dano), cost: half(esp), dif: 13 + half(esp) + v.dif, parts, geo: geo("sopro", { A: at.alcance, T: at.tamanho, lvl: 4, ev: 0, key: esp }) };
    },
  };
  return { id: "elemento-natural-katon", title: "Elemento Natural: Katon", level: 4, keyLabel: label, keyVal: esp, alcance: at.alcance, tamanho: at.tamanho, bonus: [], extra, rows: [row] };
}

/** Linha de técnica sem nível variável (Sharingan e Mangekyou: nível de poder 10 para a dificuldade). */
const tecRow = (key: string, name: string, sub: string, note: string, calc: () => Calc, util = false): AtkRow => ({ key, name, sub, note, min: 10, max: 10, meta: false, free: false, util, calc });

/**
 * Técnicas do Sharingan: Hipnose Sharingan (Sandan, Fascinar e Ilusão Profunda; Livro Básico pág. 186) e os kinjutsus
 * Izanagi e Izanami (Livro de Hijutsus vol. 2, somente PdM), que no fim custam a visão de um olho.
 */
function sharinganGroup(c: Character, v: PlayView, p: PlayState): AtkGroup | null {
  const int = v.attrs.INT;
  const rows: AtkRow[] = [];
  if (hasHipnose(c))
    rows.push(
      tecRow(
        "sharingan:hipnose",
        "Hipnose Sharingan",
        "Genjutsu · olhar, sem selos",
        `Regras do Magen. Informação e Alterar Atitude (1 rodada), Nocautear e Controlar Mente (capangas)${int >= 10 ? ", Paralisar" : ", Paralisar (pede Int 10)"}, Roubar Técnica (ação completa), Falsa Morte (1×/cena, sem teste) e Sobrepor Genjutsu.${
          mangekyou(c) ? " Com o Mangekyou (somente PdM): Controlar Bijuu, permanente; a Bijuu vira sua invocação (regras do Kuchiyose Comum)." : ""
        }`,
        () => ({ base: 0, cost: 5, dif: 0, parts: [], noDif: true, sharingan: true, info: { v: 8 + int + v.dif, label: "Dif · Inteligência", txt: "O alvo resiste com Inteligência." }, geo: { alcance: "9m", area: "1 criatura" } }),
        true,
      ),
    );
  if (hasApt(c, "izanagi")) {
    const k = p.counters.find((x) => x.n === "Izanagi");
    const max = k?.max ?? Math.ceil(Math.max(c.attrs.ESP, c.attrs.INT) / 2);
    const cur = k?.cur ?? max;
    rows.push(
      tecRow(
        "sharingan:izanagi",
        "Izanagi",
        `Kinjutsu · ${cur}/${max} usos na cena`,
        "Somente PdM. Os usos não se misturam com a Falsa Morte da Hipnose. Feito em olhos transplantados noutra parte do corpo (Medicina Dif 30), não causa ofuscado nem cegueira.",
        () => ({
          base: 0,
          cost: cur === max ? 10 : 0,
          dif: 0,
          parts: [],
          noDif: true,
          sharingan: true,
          contador: "Izanagi",
          info: { txt: "Como a Falsa Morte: ao ser alvo de ataque ou poder, o inimigo crê que você morreu (sem teste) e você se move pelo deslocamento. 10 de chakra só no 1º uso. Ao acabar os usos ou a cena, perde a visão de um olho." },
        }),
        true,
      ),
    );
  }
  if (hasApt(c, "izanami"))
    rows.push(
      tecRow(
        "sharingan:izanami",
        "Izanami · gravar",
        "Kinjutsu · 1ª ação padrão",
        "Somente PdM. Falhou: começa a gravar a ilusão. Use “Izanami · selar” no turno seguinte.",
        () => ({ base: 0, cost: 10, dif: 0, parts: [], noDif: true, sharingan: true, info: { v: 11 + int + v.dif, label: "Dif · Inteligência", txt: "O alvo resiste com Inteligência." }, geo: { alcance: "olhar", area: "1 criatura" } }),
        true,
      ),
      tecRow(
        "sharingan:izanami-selar",
        "Izanami · selar",
        "Kinjutsu · 2ª ação padrão, turno seguinte",
        "Somente PdM.",
        () => ({
          base: 0,
          cost: 0,
          dif: 0,
          parts: [],
          noDif: true,
          sharingan: true,
          olho: "Izanami",
          info: { txt: "O que aconteceu entre as duas ações se repete sem fim na mente do alvo: fica paralisado, e um ataque contra a vida dele cancela. A cada 24h, novo teste de Inteligência com a Dif 1 nível menor. Ao selar, você perde a visão de um olho." },
        }),
        true,
      ),
    );
  if (!rows.length) return null;
  return { id: "sharingan", title: "Sharingan", level: 10, keyLabel: "Int", keyVal: int, bonus: [], extra: 0, rows };
}

/**
 * Técnicas do Mangekyou Sharingan que já despertaram (Livro Básico, pág. 183–187). Cada uso desconta os pontos de
 * visão; o Susanoo e a ativação do Kamui ficam em Estados.
 */
function mangekyouGroup(c: Character, v: PlayView, p: PlayState): AtkGroup | null {
  const m = mangekyou(c);
  if (!m) return null;
  // Uma técnica vai embora com o olho perdido no Izanagi/Izanami; cego, não sobra nenhuma.
  const perdidas = p.olhos?.tecs ?? [];
  const ok = (id: string) => (p.olhos?.perdidos ?? 0) < 2 && !perdidas.includes(id) && m.tecs.some((t) => t.id === id && t.ok);
  const curto = !perdidas.includes("kamui-curto");
  const longo = !perdidas.includes("kamui-longo");
  const vis = (n: number) => custoVisao(c, n);
  // Controle Perfeito: Inteligência no lugar do Espírito.
  const { label: espLbl, val: esp } = espParam(c, v.attrs);
  const kat = katonLevel(c);
  const alvo = { alcance: "9m", area: "1 criatura" };
  const util = (key: string, name: string, sub: string, cost: number, visao: number, txt: string, note = "") =>
    tecRow(`mangekyou:${key}`, name, sub, note, () => ({ base: 0, cost, vis: vis(visao), dif: 0, parts: [], noDif: true, sharingan: true, info: { txt } }), true);
  const rows: AtkRow[] = [];

  if (ok("amaterasu")) {
    rows.push(
      tecRow(
        "mangekyou:amaterasu",
        "Amaterasu",
        "Ação padrão · teste de LM · sem selos",
        "Só se defende com Esquiva (alvo acelerado ou com Agilidade maior que sua Percepção), Evadir para trás de cobertura ou o Hiraishin. Vantagem contra todos os elementos; as chamas ficam até consumir o alvo. Sem meta-aptidões.",
        () => ({ base: 0, cost: 10, vis: vis(2), dif: 0, noDif: true, sharingan: true, parts: [`2 × Katon ${kat}`], fixed: { v: 2 * kat, txt: "imediato; depois 4 fixo por turno (acumula a cada uso), ignora dureza" }, geo: { alcance: "9m, no campo de visão", area: "1 criatura" } }),
      ),
      util("amaterasu-manter", "Amaterasu · manter", "Concentração · turno seguinte", 0, 1, "Cada turno a mais custa 1 de visão e pede novo teste de acerto. Você fica desprevenido e para se for atacado."),
    );
  }
  if (ok("kagutsuchi"))
    rows.push(
      util(
        "kagutsuchi",
        "Kagutsuchi · Enton",
        "Molda as chamas do Amaterasu",
        0,
        1,
        `Transforma chamas do Amaterasu já em cena num efeito do seu Katon (menos exclusivos). Use o efeito no grupo Katon para dano e chakra; o alvo também sofre o dano contínuo do Amaterasu. Opcional: dano base 2 × Katon (${2 * kat}) sem bônus. Também extingue chamas (ação padrão, 2m), dá Criar Arma ao Susanoo e Barreira Nv 3.`,
      ),
    );
  if (ok("tsukuyomi")) {
    rows.push(
      tecRow(
        "mangekyou:tsukuyomi",
        "Tsukuyomi · Torturador",
        "Ação padrão · olhar, sem selos",
        "Falhou: exausto até ser curado. Passou: fatigado até o fim da cena, depois exausto. Sempre −4 de Inteligência (0 = coma); só Iryou Ninjutsu 9 cura. Alvo com Sandan: Dif 2 níveis menor; com Mangekyou: 4. Repetível na cena.",
        () => ({ base: 0, cost: 10, vis: vis(2), dif: 0, parts: [], noDif: true, sharingan: true, info: { v: 11 + v.attrs.INT + v.dif, label: "Dif · Inteligência", txt: "O alvo resiste com Inteligência." }, geo: alvo }),
      ),
      util("tsukuyomi-mensageiro", "Tsukuyomi · Mensageiro", "Ação padrão · olhar", 10, 1, "Conversa por dias num instante, com qualquer imagem ou sensação. Sem penalidades ao alvo."),
    );
  }
  if (ok("kamui")) {
    const need = "Precisa do Kamui ativado (Estados, 10 de chakra).";
    if (curto)
      rows.push(
        tecRow(
        "mangekyou:expelir",
        "Kamui · Expelir Objetos",
        "Curto alcance · ação padrão",
        `1 alvo por compartimento expelido (1 chakra cada). Sem armas, metade do dano. ${need}`,
        () => ({ base: Math.max(0, esp + v.dano), cost: 1, vis: vis(1), dif: 0, noDif: true, sharingan: true, parts: v.dano ? [`${espLbl} ${esp}`, `estado ${v.dano}`] : [`${espLbl} ${esp}`], geo: { alcance: "18m", area: "1 alvo por compartimento" } }),
        ),
        util("abducao-objetos", "Kamui · Abdução de Objetos", "Curto alcance · defesa, sem teste", 1, 1, "Guarda na dimensão um objeto grande ou menor jogado contra você (1 chakra por compartimento, até 10).", need),
        util("intangibilidade", "Kamui · Intangibilidade", "Curto alcance · ação padrão ou defesa", 5, 2, "Na defesa é sucesso automático (menos contra crítico). Atravessa obstáculos, mas não interage com o mundo nem usa o Teletransporte. Até 5 minutos seguidos.", need),
      );
    if (longo)
      rows.push(
        tecRow(
        "mangekyou:abducao-ofensiva",
        "Kamui · Abdução Ofensiva",
        "Longo alcance · concentração",
        `Teste de LM no fim de cada turno; acerta com 3 acertos (ou um crítico) enquanto o alvo estiver a 18m e à vista. ${need}`,
        () => ({ base: 0, cost: 10, vis: vis(2), dif: 0, noDif: true, sharingan: true, parts: [`${espLbl} ${esp}`], fixed: { v: esp, txt: "e amputa um braço; sangrando ×5" }, geo: { alcance: "18m", area: "1 criatura" } }),
        ),
        util("abducao-defensiva", "Kamui · Abdução Defensiva", "Longo alcance · defesa, sem teste", 5, 2, "Engole um ataque à distância contra você ou um aliado no alcance.", need),
      );
    // Teletransporte e dimensão são dos dois olhos.
    rows.push(util("teletransporte", "Kamui · Teletransporte", "Ação de movimento", 1, 1, "Entra ou sai da dimensão do Kamui e reaparece num lugar conhecido. Levar alguém indefeso ou voluntário: ação completa e chakra dobrado.", need));
  }
  if (!rows.length) return null;
  return { id: "mangekyou", title: m.eterno ? "Mangekyou Sharingan Eterno" : "Mangekyou Sharingan", level: 10, keyLabel: m.eterno ? "Visão" : "Pontos de visão", keyVal: m.eterno ? 10 : (p.visao?.pts ?? 10), bonus: [], extra: 0, rows };
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
  if (id === "hibon" && hibonBonus(c).dano) bonus.push({ label: "Hibon: Dano Adicional", v: hibonBonus(c).dano });
  if (id === "suiton" && hasApt(c, "elemento-natural-suiton")) bonus.push({ label: "Elemento Natural", v: 2 });
  if (id === "doton" && hasApt(c, "elemento-natural-terra")) bonus.push({ label: "Elemento Natural", v: 1 });
  const capacidade = hasApt(c, "capacidade") && NINPOU_E_ELEMENTOS.includes(id);
  // Maximizar no elemento: o Potencializar aplica os três melhoramentos ao mesmo tempo.
  const maxi = maximizarEm(c) === id;
  const potOn = (pot: PotMode | undefined, m: PotMode) => !!pot && (pot === m || maxi);
  const extra = p.dmgExtra?.[key] ?? 0;
  const elemTotal = bonus.reduce((t, b) => t + b.v, 0);
  const maestria = maestriaEm(c, id, key.startsWith("versatilidade:")) ? 1 : 0;
  // Kibaku Nendo: cada efeito gasta bombas de argila iguais ao nível usado (Livro de Hijutsus vol. 2).
  const argila = id === "kibaku-nendo";
  const comArgila = (r: Calc, lvl: number): Calc => (argila ? { ...r, bombas: lvl } : r);

  const rows: AtkRow[] = o.picks
    .flatMap(({ eff, tech, ev, talento, tag: from, nivel }): AtkRow[] => {
      const e = EFEITO_BY_ID[eff];
      const spec = DANO_EFEITO[eff];
      const tag = talento ? "Talento Natural" : (from ?? "");
      if (!spec) {
        const u = utilRow(c, key, id, eff, tech, ev, level, k, v, tag);
        return [{ ...u, calc: (lvl, opt) => comArgila(u.calc(lvl, opt), lvl) }];
      }
      // Teste de acerto: CC nos golpes de toque e armas criadas, CD no resto.
      const tk: "CC" | "CD" = eff === "lamina-raios" || spec.kind.k === "arma" ? "CC" : "CD";
      const teste = { k: tk, v: v.combat[tk] + maestria, why: [maestria ? "Maestria +1" : "", eff === "meteoros" ? "−3 se mirar em alguém" : ""].filter(Boolean) };
      const effName = e.name.replace(/ \(.*\)$/, "");
      const evoLvl = ev ? e.evolves?.[ev - 1] : undefined;
      const evoTxt = evoLvl ? `evoluído Nv ${evoLvl}` : "";
      const meta = !spec.noMeta;
      const row: AtkRow = {
        key: `${key}:${eff}`,
        name: tech || effName,
        sub: [tech ? effName : "", evoTxt, tag].filter(Boolean).join(" · "),
        note: eff === "lamina-raios" ? laminaRaiosNote(ev) : eff === "mina-explosiva" && ev >= 1 ? spec.note + MINA_NV6 : spec.note,
        min: e.level,
        max: spec.costFixed ? e.level : Math.max(e.level, level, nivel ?? 0),
        meta,
        free: !!spec.free,
        teste,
        calc: (lvl, opt) =>
          comArgila(
            {
              ...dmgCalc(lvl, opt),
              // Potencializar: dobra o alcance ou a área, à escolha (com Maximizar, os dois).
              geo: geo(eff, { A: at.alcance * (meta && potOn(opt.pot, "alcance") ? 2 : 1), T: at.tamanho * (meta && potOn(opt.pot, "area") ? 2 : 1), lvl, ev, key: k.val }),
            },
            lvl,
          ),
      };
      // Lâmina de Raios Nv 5 (evolução): atacar com Investida dá +2 de dano, +1 a cada nível do poder acima do 5.
      // Conta o nível do poder (num poder versátil, o da Versatilidade), não o nível usado; usar abaixo do Nv 5 perde a evolução.
      if (eff !== "lamina-raios" || ev < 1 || row.max < 5) return [row];
      const investida: AtkRow = {
        ...row,
        key: `${key}:${eff}:investida`,
        name: `${row.name} · Investida`,
        sub: ["Ação completa · corrida de 3m+", row.sub].filter(Boolean).join(" · "),
        note: "+1 no ataque e −1 na defesa até o seu próximo turno. Se o alvo Esquivar ou Antecipar, ganha um ataque oportuno (não vale se você estiver Acelerado ou tiver o Nidan Sharingan; Mobilidade serve contra ele).",
        min: 5,
        calc: (lvl, opt) => {
          const r = row.calc(lvl, opt);
          const b = 2 + Math.max(0, level - 5);
          return { ...r, base: r.base + b, parts: [...r.parts, `Investida ${b}`] };
        },
      };
      return [row, investida];
      function dmgCalc(lvl: number, opt: { free?: boolean; pot?: PotMode }): Calc {
        const comum = lvl + half(k.val);
        const dif = 9 + lvl + half(k.val) + v.dif + difPoder(c, id);
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
        if (potOn(opt.pot, "dano") && meta) {
          base += 1;
          parts.push(maxi ? "Maximizar 1" : "Potencializar 1");
        }
        if (opt.free && spec.free && lvl >= 2) return { base: Math.max(0, half(base)), cost: 0, dif, parts: [`(${partsText(parts)}) ÷ 2`] };
        return { base: Math.max(0, base), cost, dif, parts };
      }
    })
    // Primeiro o que causa dano, depois o resto; cada parte pelo nível do efeito.
    .sort((a, b) => Number(!!a.util) - Number(!!b.util) || a.min - b.min);

  return {
    id: key,
    title: o.title,
    level,
    keyLabel: k.label,
    keyVal: k.val,
    alcance: at.alcance,
    tamanho: at.tamanho,
    notice: maxi ? "Maximizar: o Potencializar neste elemento aplica os três melhoramentos de uma vez (+1 de dano base, alcance ×2 e área ×2)." : undefined,
    bonus,
    prec: maestria ? "Maestria +1" : undefined,
    recurso: argila ? "bombas de argila = nível usado" : undefined,
    extra,
    rows,
  };
}

function utilRow(c: Character, groupKey: string, powerId: string, eff: string, tech: string, ev: number, level: number, k: { label: string; val: number }, v: PlayView, tag = ""): AtkRow {
  const e = EFEITO_BY_ID[eff];
  const spec: UtilSpec = EFEITO_UTIL[eff] ?? { show: "texto", txt: e.desc };
  const effName = e.name.replace(/ \(.*\)$/, "");
  const evoLvl = ev ? e.evolves?.[ev - 1] : undefined;
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
      const txt = typeof spec.txt === "function" ? spec.txt({ meia: half(k.val), key: k.val, lvl, ev }) : spec.txt;
      const comum = lvl + half(k.val);
      const dif = 9 + comum + v.dif + difPoder(c, powerId);
      const cost = spec.costFixed ?? (spec.costHalf ? Math.ceil(lvl / 2) : lvl);
      const { alcance: A, tamanho: T } = alcanceTamanho(powerId, k.val);
      const out: Calc = { base: 0, cost, dif, parts: [], noDif: true, info: { txt }, geo: geo(eff, { A, T, lvl, ev, key: k.val }) };
      if (eff === "montaria") {
        // Montaria (Kibaku Nendo): 5 de chakra, absorção 8 por nível de Arte; a forma Enorme é a evolução do Nv 5.
        const enorme = ev >= 1 && lvl >= 5;
        out.cost = 5;
        out.info = { v: 8 * k.val, label: `Absorção · ${enorme ? "Enorme, Voo" : "Grande"}`, txt };
        out.ativa = { estado: "montaria-argila", stage: enorme ? 1 : 0 };
      } else if (spec.show === "absorcao") {
        // Espelhos Demoníacos (Livro de Hijutsus, Hyouton): absorção 8 por nível usado, dureza 0 sem bônus de elemento.
        out.cost = ev >= 1 ? 4 : 3;
        out.info = { v: 8 * lvl, label: spec.label ?? "Absorção", txt: `${txt} Dureza ${ev >= 1 ? 2 : 0}.${ev >= 1 ? ESPELHOS_NV8 : ""}` };
      } else if (spec.show === "dureza") {
        // Barreira Nv 9 (evolução): dureza +2.
        const full = comum + durezaPoder(c, powerId) + (eff === "barreira" && ev >= 2 ? 2 : 0);
        out.info = { v: spec.durezaHalf ? half(full) : spec.durezaDobro ? 2 * full : full, label: spec.label ?? "Dureza", txt };
      } else if (spec.show === "dif") {
        out.info = { v: dif + (spec.difAdj ?? 0), label: `Dif · ${spec.label ?? "resistência"}`, txt };
      }
      return out;
    },
  };
}

/** Poderes de técnicas prontas (exceto Rasengan e Jinton, que têm cálculo) e poderes livres ou personalizados. */
export function outrosPoderes(c: Character): OutroPoder[] {
  const out: OutroPoder[] = [];
  c.poderes.forEach((pe, i) => {
    const def = PODER_BY_ID[pe.id];
    if (def?.mode === "efeitos" || pe.id === "rasengan" || pe.id === "jinton") return;
    const items = def?.mode === "tecnicas" ? (def.techniques ?? []).filter((t) => t.level <= pe.level).map((t) => `Nv ${t.level} · ${t.name}`) : pe.techniques.map((t) => t.trim()).filter(Boolean);
    out.push({ id: `${pe.id}:${i}`, title: def?.name ?? pe.customName ?? "Poder", level: pe.level, items, note: pe.note?.trim() ?? "" });
  });
  // Poder de técnicas usado como versátil (Fuuinjutsu): só as técnicas escolhidas nos níveis dele.
  c.poderes.forEach((pe, i) => {
    if (pe.id !== "versatilidade") return;
    (pe.versatile ?? []).forEach((id, k) => {
      const def = PODER_BY_ID[id];
      if (def?.mode !== "tecnicas") return;
      const lista = c.optionals.fuuinjutsuLista;
      const items = versatileTechs(pe, k, lista)
        .map((n) => def.techniques?.[n])
        .filter((t): t is NonNullable<typeof t> => !!t)
        .map((t) => `Nv ${t.level} · ${t.name}`);
      out.push({ id: `versatilidade:${id}:${i}`, title: versatileName(id), level: pe.level, items, note: lista ? "Regra opcional: técnicas em lista." : "" });
    });
  });
  // Mímica Sharingan (Nidan Sharingan, Livro Básico pág. 185): técnicas sem custo de chakra, exceto Anular.
  if (hasApt(c, "nidan-sharingan")) {
    const n = mimicaCopias(c);
    out.push({
      id: "mimica-sharingan",
      title: "Mímica Sharingan",
      level: 0,
      items: ["Anular Técnica", `Copiar Técnica · até ${n}`, "Memorizar Técnica · 1", "Novo Elemento"],
      note: [
        "Anular Técnica: manobra de previsão mesmo sem contra-técnica, copiando a do adversário e pagando o mesmo chakra.",
        `Copiar Técnica: analisar é ação completa (anuncie quando a técnica for usada); usa a cópia por 1 semana. Limite ${n} (1 a cada 4 de Inteligência, máx. 5). Só efeitos de poder, aptidões shinobi e de manobra, e o nível 1 de poderes comuns; nada de clã ou hijutsu, e dentro do seu limite de poder e pré-requisitos.`,
        "Memorizar Técnica: 1 cópia sem prazo. Aprender de vez custa 2 pontos de poder (anote como aptidão).",
        "Novo Elemento: uma afinidade elemental a mais.",
      ].join("\n"),
    });
  }
  return out;
}

/* ---------------- taijutsu e armas ---------------- */

/** Força dos estados ligados com esta origem (ex.: tamanho do Baika). */
const forDe = (p: PlayState, pred: (e: PlayState["effects"][number]) => boolean) =>
  p.effects.filter((e) => e.active && pred(e)).reduce((t, e) => t + e.mods.filter((m) => m.on && m.t === "FOR").reduce((s, m) => s + m.v, 0), 0);

/** Contexto de dano na mesa: atributos com os estados, Hachimon, Modo Kurama e Armadura de Raios. */
export function mesaDanoCtx(c: Character, v: PlayView, p: PlayState, o: { energizar?: boolean; poderoso?: boolean }): DanoCtx {
  const gate = p.effects.find((e) => e.active && e.gate);
  // Hachimon (Livro Básico, pág. 202):o bônus de Força do portão dobra no dano e anula os outros bônus de Força e de dano;
  // a Força de tamanho continua valendo.
  const hachimon = gate ? { gate: gate.gate!, forDano: c.attrs.FOR + forDe(p, (e) => e.auto === "baika") + 2 * forDe(p, (e) => e === gate) } : undefined;
  return {
    attrs: v.attrs,
    combat: v.combat,
    dano: v.dano,
    hachimon,
    energizar: o.energizar,
    poderoso: o.poderoso,
    kurama: p.effects.some((e) => e.active && e.auto === "jinchuuriki" && e.stage === 4),
    armaduraRaios: p.effects.some((e) => e.active && e.auto === "armadura-raios"),
  };
}

/** Ataque desarmado, armas do equipamento e golpes de clã (Juuken, Shikakyu…), com o dano já calculado. */
export function grupoBasico(c: Character, v: PlayView, p: PlayState, o: { energizar?: boolean; poderoso?: boolean }): AtkGroup {
  const x = mesaDanoCtx(c, v, p, o);
  const extra = p.dmgExtra?.basico ?? 0;
  const rows: AtkRow[] = ataquesBasicos(c, x).map((a) => ({
    key: `basico:${a.key}`,
    name: a.name,
    sub: [a.tag, a.tipo].filter(Boolean).join(" · "),
    note: [a.note, ...a.warn.map((w) => `⚠ ${w}`)].filter(Boolean).join(" "),
    min: a.lvl?.min ?? 1,
    max: a.lvl?.max ?? 1,
    meta: false,
    free: false,
    plusHalf: a.plusHalf,
    tags: [letalText(a.letal), `crítico ${critText(a.crit)}`],
    teste: { k: a.test, v: v.combat[a.test] + (a.prec?.v ?? 0), why: a.prec?.why ?? [] },
    faixa: a.faixa,
    calc: (lvl) => {
      const r = a.lvl ? a.lvl.calc(lvl) : a;
      const parts = extra ? [...r.parts, `extra ${extra}`] : r.parts;
      return { base: Math.max(0, r.base + extra), cost: a.cost, dif: 0, parts, noDif: true, geo: { alcance: a.alcance } };
    },
  }));
  return {
    id: "basico",
    title: "Taijutsu e armas",
    level: 0,
    keyLabel: "",
    keyVal: 0,
    info: `For ${x.hachimon ? `${x.hachimon.forDano} no dano` : v.attrs.FOR} · Des ${v.attrs.DES} · ½ atributo + dano de arma`,
    notice: x.hachimon ? `Hachimon ${x.hachimon.gate} aberto: o bônus de Força do portão conta em dobro no dano e anula os outros bônus de Força e de dano (tamanho, dano de arma e Dano Extra continuam).` : undefined,
    bonus: [],
    extra,
    rows,
  };
}

/** Dano final de cada grau (1 a 4). Técnica Poderosa soma 0,5 ao grau e arredonda para cima. */
export function graus(base: number, plusHalf: boolean, minGrau = 1) {
  return [1, 2, 3, 4].map((g) => ({ g, v: g < minGrau ? null : Math.ceil(base * (g + (plusHalf ? 0.5 : 0))) }));
}

export const GRAU_2D8 = ["4–8", "9–11", "12–14", "15–16"];

export const partsText = (parts: string[]) => parts.join(" + ");
