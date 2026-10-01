import type { AttrKey, SizeKey, Source } from "../types";

/* Espécies do poder Kuchiyose (Livro Básico, pág. 224–227; Guia Avançado; Livro de Hijutsus vol. 1 e 2). */

export interface EspecieTecnica {
  name: string;
  note?: string;
  /** NC mínimo da criatura para usar a técnica. */
  minNc?: number;
  /** Tamanho mínimo da criatura. */
  minSize?: SizeKey;
  /** Poder da criatura que a técnica pede (ex.: Óleo do Sapo pede Suiton). */
  needsPower?: string;
}

export interface Especie {
  id: string;
  name: string;
  kanji: string;
  source: Source;
  /** Espécie exclusiva: só os clãs/hijutsus listados assinam o contrato. */
  exclusive?: { origins: string[]; label: string };
  main: AttrKey[];
  /** Perícias da espécie: o teste usa o nível do atributo. */
  skills: { name: string; attr: AttrKey }[];
  /** Poderes que a criatura pode ter (no máximo um). Vazio = nenhum. */
  powers: { id: string; name: string }[];
  /** Poder elemental: só os efeitos de KUCHI_EFEITOS. */
  elemental?: boolean;
  powerNote?: string;
  apts: string[];
  techniques: EspecieTecnica[];
  attacks: string;
  maxSize?: SizeKey;
  /** Só uma criatura por cena. */
  unitary?: boolean;
  /** Invocação numerosa: até N criaturas no NC máximo, como capangas com 1 de Vitalidade. */
  numerous?: number;
  /** Doki: invoca até 3, com o NC máximo diminuído em 1. */
  triple?: boolean;
  /** Só existe como poder comum. */
  onlyComum?: boolean;
  /** Penalidade de precisão do poder comum (o padrão é 3). */
  comumPenalty?: number;
  /** Inteligência sempre zero (não fala e não precisa do mínimo de Inteligência). */
  intZero?: boolean;
  /** Não fala a língua humana. */
  noSpeech?: boolean;
  notes: string[];
}

export const ESPECIES: Especie[] = [
  {
    id: "sapos",
    name: "Sapos",
    kanji: "蛙",
    source: "Básico",
    main: ["AGI", "ESP", "FOR"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Escapar", attr: "DES" },
      { name: "Prontidão", attr: "PER" },
    ],
    powers: [
      { id: "fuuton", name: "Fuuton" },
      { id: "suiton", name: "Suiton" },
      { id: "katon", name: "Katon" },
    ],
    elemental: true,
    apts: ["Ataque em Movimento", "Especialista", "Guerreiro", "Intuição", "Reflexos", "Velocista", "Maestria", "Perito", "Perícia Inata", "Usar Arma"],
    techniques: [
      { name: "Tadayou" },
      { name: "Óleo do Sapo", note: "Inflamável Nv 5 grátis no Suiton", needsPower: "suiton", minSize: "medio" },
    ],
    attacks: "Clava, Lança e Espadas de qualquer tipo",
    notes: ["Como Hijutsu, dá acesso ao Senjutsu."],
  },
  {
    id: "cobras",
    name: "Cobras",
    kanji: "蛇",
    source: "Básico",
    main: ["FOR", "AGI", "PER"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Prontidão", attr: "PER" },
      { name: "Rastrear", attr: "PER" },
    ],
    powers: [],
    apts: ["Ataque em Movimento", "Especialista", "Reflexos", "Intuição", "Velocista", "Perito", "Perícia Inata", "Lutador", "Ponto Cego", "Arremessar", "Ataque Atordoante", "Ataque Poderoso", "Derrubar Agressivo", "Sensor (via olfato)"],
    techniques: [{ name: "Kawarimi no Jutsu", note: "troca de pele" }, { name: "Kinobori" }, { name: "Imergir (Doton)" }, { name: "Amedrontar Nv 2", note: "Magen; só contra criaturas menores" }],
    attacks: "Mordida (perfuração), Batida com Cauda (esmagamento)",
    notes: ["Temperamentais: podem exigir sacrifícios em troca de obediência.", "Como Hijutsu, dá acesso ao Senjutsu."],
  },
  {
    id: "lesmas",
    name: "Lesmas",
    kanji: "蛞",
    source: "Básico",
    main: ["INT", "ESP", "VIG"],
    skills: [
      { name: "Ciências Naturais", attr: "INT" },
      { name: "Concentração", attr: "INT" },
      { name: "Escapar", attr: "DES" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Medicina", attr: "INT" },
      { name: "Prontidão", attr: "PER" },
    ],
    powers: [{ id: "iryou", name: "Iryou Ninjutsu" }],
    powerNote: "Só a cura geral, usada junto do invocador no mesmo alvo (as curas se somam).",
    apts: ["Acuidade", "Ataque em Movimento", "Intuição", "Reflexos", "Ninja Médico", "Perito", "Perícia Inata", "Lutar às Cegas", "Maestria", "Resistência Maior (Vigor)", "Duro de Matar"],
    techniques: [{ name: "Tadayou" }, { name: "Kinobori" }, { name: "Katsuyu Daibunretsu" }, { name: "Byakugou no In" }, { name: "Ácido", note: "Sopro Destrutivo Nv 4, dano base = Espírito", minSize: "medio" }],
    attacks: "Batida de Corpo (esmagamento)",
    unitary: true,
    notes: ["Invocação unitária: só uma lesma por cena.", "Como Hijutsu, dá acesso ao Byakugou no In."],
  },
  {
    id: "aguias",
    name: "Águias",
    kanji: "鷲",
    source: "Básico",
    main: ["AGI", "PER"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Voo", attr: "AGI" },
      { name: "Prontidão", attr: "PER" },
      { name: "Rastrear", attr: "PER" },
    ],
    powers: [],
    apts: ["Ataque em Movimento", "Especialista", "Reflexos", "Intuição", "Velocista", "Perito", "Perícia Inata", "Ponto Cego", "Ataque Atordoante", "Ataque Poderoso", "Derrubar Agressivo"],
    techniques: [{ name: "Bater de Asas", note: "ventania de 2m de diâmetro por nível de Força" }],
    attacks: "Garras (corte), Bico (perfuração)",
    noSpeech: true,
    notes: ["Não falam a língua humana.", "Derrubar Agressivo não pede Lutador nem sofre a penalidade da manobra."],
  },
  {
    id: "caes",
    name: "Cães",
    kanji: "犬",
    source: "Básico",
    exclusive: { origins: ["hatake"], label: "Clã Hatake" },
    main: ["AGI", "PER"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Escapar", attr: "DES" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Procurar", attr: "PER" },
      { name: "Prontidão", attr: "PER" },
      { name: "Rastrear", attr: "PER" },
    ],
    powers: [],
    apts: ["Acuidade", "Ataque em Movimento", "Especialista", "Intuição", "Reflexos", "Velocista", "Perito", "Perícia Inata", "Lutador", "Ponto Cego", "Ataque Atordoante", "Ataque Poderoso", "Derrubar Agressivo", "De Pé", "Desarme Agressivo", "Rasteira", "Sensor (via olfato)"],
    techniques: [{ name: "Tadayou" }, { name: "Doton: Tsuiga no Jutsu", note: "pede Kuchiyose 6" }],
    attacks: "Mordida (perfuração)",
    maxSize: "medio",
    numerous: 8,
    notes: ["Invocação numerosa: até 8 cães no NC máximo, como capangas com 1 de Vitalidade que falham em Habilidades de Combate."],
  },
  {
    id: "macacos",
    name: "Macacos",
    kanji: "猿",
    source: "Guia Avançado",
    exclusive: { origins: ["sarutobi"], label: "Clã Sarutobi" },
    main: ["FOR", "AGI", "PER", "VIG"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Disfarces", attr: "PER" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Prontidão", attr: "PER" },
    ],
    powers: [],
    apts: [
      "Ataque em Movimento", "Combate Defensivo", "Crítico Aprimorado", "De Pé", "Especialista", "Guerreiro", "Intuição", "Lutador", "Lutar às Cegas", "Mobilidade",
      "Oportunista", "Ponto Cego", "Punho de Ferro", "Reflexos", "Retirada Rápida", "Rolamento", "Saque Rápido", "Trespassar", "Usar Arma", "Usar Armadura Pesada",
      "Velocista", "Perito", "Perícia Inata", "Apanhar Objetos", "Arremessar", "Ataque Atordoante", "Ataque Giratório", "Ataque Múltiplo", "Ataque Poderoso", "Bloquear Arma",
      "Desarme Agressivo", "Chute Duplo", "Chute Giratório", "Chute Inverso", "Contragolpe", "Derrubar Agressivo", "Golpe Atemi", "Golpe Caratê", "Rasteira", "Soco Agarrado",
      "Soco em Gancho", "Voadora", "Resistência Maior", "Auxiliador Especialista", "Agarrar Agressivo", "Estilo Zui Quan", "Imobilização", "Instância de Falange", "Roubar", "Henge Perfeito",
      "Burro de Carga", "Furtividade Ágil",
    ],
    techniques: [{ name: "Henge no Jutsu" }, { name: "Henge: Kongōnyoi", note: "Bastão Adamantino", minNc: 12, minSize: "medio" }, { name: "Tadayou" }, { name: "Kinobori" }],
    attacks: "Socos e Chutes (esmagamento); Armas (qualquer tipo)",
    maxSize: "grande",
    notes: ["Punho de Ferro funciona como Usar Arma para a invocação."],
  },
  {
    id: "baku",
    name: "Baku",
    kanji: "獏",
    source: "Hijutsus 2",
    exclusive: { origins: ["shimura"], label: "Clã Shimura" },
    main: ["FOR", "PER", "INT", "ESP"],
    skills: [
      { name: "Atletismo", attr: "FOR" },
      { name: "Concentração", attr: "INT" },
      { name: "Prontidão", attr: "PER" },
      { name: "Rastrear", attr: "PER" },
    ],
    powers: [],
    apts: [
      "Ataque em Movimento", "Crítico Aprimorado", "Especialista", "Intuição", "Lutador", "Oportunista", "Trespassar", "Usar Armaduras Pesadas", "Agarrar Agressivo", "Arremessar",
      "Ataque Atordoante", "Ataque Giratório", "Ataque Múltiplo", "Ataque Poderoso", "Contragolpe", "Derrubar Agressivo", "Instância de Falange", "Potencializar", "Burro de Carga", "Duro de Matar",
      "Perícia Inata", "Perito", "Resistência Maior",
    ],
    techniques: [{ name: "Akumu no Kyūin", note: "Sucção de Pesadelo", minNc: 12 }, { name: "Amedrontar Nv 2", note: "Magen; só contra criaturas menores" }, { name: "Kinobori" }],
    attacks: "Batida de Tromba (esmagamento), Garras (corte)",
    unitary: true,
    notes: ["Invocação unitária: só um Baku por cena."],
  },
  {
    id: "doninhas",
    name: "Doninhas",
    kanji: "鼬",
    source: "Hijutsus 2",
    main: ["AGI", "ESP", "DES"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Prontidão", attr: "PER" },
    ],
    powers: [{ id: "fuuton", name: "Fuuton" }],
    elemental: true,
    apts: [
      "Acuidade", "Ataque em Movimento", "Combate Defensivo", "Crítico Aprimorado", "De Pé", "Especialista", "Guerreiro", "Maestria: Fuuton", "Mobilidade", "Oportunista",
      "Ponto Cego", "Reflexos", "Retirada Rápida", "Rolamento", "Trespassar", "Usar Arma (Foice)", "Velocista", "Domínio do Vento", "Potencializar", "Técnica Acelerada",
      "Técnica Eficiente", "Técnica Elevada", "Técnica Poderosa", "Perito", "Perícia Inata",
    ],
    techniques: [{ name: "Kirikiri Mai", note: "Dança Decapitadora", minNc: 12, minSize: "medio" }],
    attacks: "Foices (corte)",
    maxSize: "medio",
    notes: ["Kirikiri Mai lança a doninha junto de uma técnica Fuuton do invocador."],
  },
  {
    id: "marisco",
    name: "Marisco",
    kanji: "蛤",
    source: "Hijutsus 2",
    main: ["INT", "ESP", "VIG"],
    skills: [
      { name: "Furtividade", attr: "AGI" },
      { name: "Prontidão", attr: "PER" },
      { name: "Procurar", attr: "PER" },
    ],
    powers: [],
    apts: [
      "Combate Defensivo", "Especialista", "Intuição", "Lutar às Cegas", "Trespassar", "Ataque Atordoante", "Ataque Giratório", "Ataque Poderoso", "Contragolpe", "Ilusão Profunda",
      "Potencializar", "Técnica Acelerada", "Duro de Matar", "Perícia Inata", "Perito", "Resistência Maior (Vigor)", "Fascinar", "Miragem", "Sensor",
    ],
    techniques: [{ name: "Magen: Kijō no Rōkaku", note: "névoa com Miragem; pede Miragem", minNc: 10 }],
    attacks: "Batida de Corpo (esmagamento)",
    unitary: true,
    notes: ["Invocação unitária: só um marisco por cena.", "O Clã Hōzuki compra como poder comum; quem não tem outro clã ou hijutsu pode comprar como restrito."],
  },
  {
    id: "salamandra",
    name: "Salamandra",
    kanji: "蠑",
    source: "Hijutsus 2",
    main: ["FOR", "AGI", "INT", "VIG"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Prontidão", attr: "PER" },
    ],
    powers: [],
    apts: [
      "Acuidade", "Ataque em Movimento", "Combate Defensivo", "Crítico Aprimorado", "De Pé", "Especialista", "Lutar às Cegas", "Mobilidade", "Oportunista", "Ponto Cego",
      "Reflexos", "Retirada Rápida", "Rolamento", "Trespassar", "Velocista", "Perícia Inata", "Perito", "Resistência Maior (Vigor)",
    ],
    techniques: [{ name: "Dokugiri", note: "Névoa Venenosa; pede Venefício 10 do invocador" }, { name: "Imergir Nv 2", note: "Doton no maior nível do NC" }, { name: "Engolimento", minNc: 12 }],
    attacks: "Batida com Cauda (esmagamento)",
    maxSize: "enorme",
    unitary: true,
    notes: ["Invocação unitária: só uma salamandra por cena.", "Guarda venenos (NC 12+): 1 compartimento por categoria de tamanho acima de Médio."],
  },
  {
    id: "tartaruga",
    name: "Tartaruga",
    kanji: "亀",
    source: "Hijutsus 2",
    main: ["FOR", "PER", "INT", "VIG"],
    skills: [
      { name: "Atletismo (só nadar)", attr: "FOR" },
      { name: "Ciências Naturais", attr: "INT" },
      { name: "Cultura", attr: "INT" },
      { name: "Ocultismo", attr: "INT" },
      { name: "Procurar", attr: "PER" },
    ],
    powers: [],
    apts: [
      "Crítico Aprimorado", "Combate Defensivo", "Especialista", "Intuição", "Lutador", "Trespassar", "Ataque Atordoante", "Ataque Giratório", "Ataque Poderoso", "Bloquear Arma",
      "Contragolpe", "Derrubar Agressivo", "Desarme Agressivo", "Duro de Matar", "Perito", "Perícia Inata", "Resistência Maior",
    ],
    techniques: [{ name: "Pele de Pedra", note: "Doton no maior nível do NC; dureza = Espírito" }, { name: "Tadayou" }, { name: "Kinobori" }],
    attacks: "Batida de Casco (esmagamento), Mordida (perfuração)",
    notes: ["Casco de Proteção: Dureza de Corpo 1, 2 no NC 12+ e 3 no NC 16+ (não soma com Pele de Pedra)."],
  },
  {
    id: "aranhas",
    name: "Aranhas",
    kanji: "蜘",
    source: "Hijutsus 2",
    exclusive: { origins: ["gorudogumo"], label: "Gorudogumo" },
    main: ["DES", "AGI", "PER"],
    skills: [
      { name: "Atletismo (escalada)", attr: "FOR" },
      { name: "Furtividade", attr: "AGI" },
      { name: "Procurar", attr: "PER" },
      { name: "Prontidão", attr: "PER" },
      { name: "Rastrear", attr: "PER" },
    ],
    powers: [],
    powerNote: "Usam o Canhão do Kumo Ninpou no limite de poder do NC, sem selos. Com o Kumo Ninpou do invocador, também Restringente e Algemar.",
    apts: [
      "Acuidade", "Ataque em Movimento", "Combate Defensivo", "Crítico Aprimorado", "De Pé", "Especialista", "Intuição", "Lutar às Cegas", "Maestria", "Mobilidade",
      "Oportunista", "Ponto Cego", "Reflexos", "Retirada Rápida", "Trespassar", "Velocista", "Ataque Atordoante", "Ataque Poderoso", "Potencializar", "Perito",
      "Perícia Inata", "Resistência Maior (Vigor)", "Auxiliador Especialista", "Corpo Esguio", "Esquiva de Risco", "Agarrar Agressivo", "Imobilização", "Mestre da Criação", "Burro de Carga", "Furtividade Ágil",
    ],
    techniques: [{ name: "Kinobori", note: "sem gastar chakra" }],
    attacks: "Mordida (perfuração), Batida com o corpo (contusão)",
    onlyComum: true,
    intZero: true,
    notes: ["Inteligência sempre zero: falham em testes de Inteligência e não falam, mas obedecem ordens simples."],
  },
  {
    id: "doki",
    name: "Doki",
    kanji: "鬼",
    source: "Hijutsus 2",
    exclusive: { origins: ["mateki"], label: "Mateki" },
    main: ["FOR", "DES", "AGI", "PER"],
    skills: [
      { name: "Acrobacia", attr: "AGI" },
      { name: "Atletismo", attr: "FOR" },
      { name: "Escapar", attr: "DES" },
      { name: "Prontidão", attr: "PER" },
      { name: "Procurar", attr: "PER" },
    ],
    powers: [],
    apts: [
      "Ataque Atordoante", "Ataque em Movimento", "Ataque Giratório", "Ataque Poderoso", "Contragolpe", "Derrubar Agressivo", "Desarme Agressivo", "Especialista", "Furtividade Ágil", "Guerreiro",
      "Lutador", "Perícia Inata", "Perito", "Ponto Cego", "Reflexos", "Resistência Maior", "Usar Arma", "Velocista",
    ],
    techniques: [{ name: "Tadayou" }, { name: "Kinobori" }],
    attacks: "não especificado no livro",
    maxSize: "enorme",
    triple: true,
    onlyComum: true,
    comumPenalty: 1,
    intZero: true,
    notes: [
      "Inteligência sempre zero: não falam e os pontos do mínimo de Inteligência podem ir para outros atributos.",
      "Comandados pela Flauta Demoníaca; sem ela ficam imóveis e só se defendem.",
      "Feitos para o combate: −1 de precisão em vez de −3.",
      "Invocação tripla: até 3 Doki, com o NC máximo diminuído em 1.",
    ],
  },
  {
    id: "tubarao",
    name: "Tubarão",
    kanji: "鮫",
    source: "Hijutsus 1",
    exclusive: { origins: ["hoshigaki"], label: "Clã Hoshigaki" },
    main: ["FOR", "AGI", "PER"],
    skills: [
      { name: "Atletismo (natação)", attr: "FOR" },
      { name: "Prontidão", attr: "PER" },
      { name: "Rastrear", attr: "PER" },
    ],
    powers: [],
    apts: ["Ataque em Movimento", "Especialista", "Reflexos", "Velocista", "Perito", "Perícia Inata", "Ataque Atordoante", "Ataque Poderoso", "Sensor (duração contínua)"],
    techniques: [{ name: "Ataque do Cardume", note: "com 8 tubarões invocados" }],
    attacks: "não especificado no livro",
    maxSize: "grande",
    numerous: 8,
    onlyComum: true,
    intZero: true,
    notes: [
      "Inteligência sempre zero: não falam, mas obedecem ordens simples.",
      "Invocação numerosa: até 8 tubarões no NC máximo, como capangas que falham em Habilidades de Combate (menos no Ataque do Cardume).",
    ],
  },
];

export const ESPECIE_BY_ID: Record<string, Especie> = Object.fromEntries(ESPECIES.map((e) => [e.id, e]));

/** Efeitos permitidos a poderes elementais de invocação, qualquer que seja o elemento (Livro Básico, pág. 225). */
export const KUCHI_EFEITOS = ["canhao", "orbe", "flechas", "coluna", "sopro", "raio", "missil", "ricochete"];
