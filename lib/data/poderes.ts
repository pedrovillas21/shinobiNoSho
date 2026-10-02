import type { Efeito, Poder, Req } from "../types";

/* ---------- Efeitos (Ninpou, elementos e revisões do Guia Avançado) ---------- */
export const EFEITOS: Efeito[] = [
  { id: "canhao", name: "Canhão", level: 1, source: "Básico", desc: "Projétil simples de dano próprio." },
  { id: "criar-arma", name: "Criar Arma", level: 2, source: "Básico", desc: "Cria uma arma com o material do poder.", evolves: [6] },
  { id: "orbe", name: "Orbe", level: 2, source: "Guia Avançado", desc: "Projétil esférico de 0,5m com dano comum do poder.", evolves: [7] },
  { id: "raio", name: "Raio", level: 2, source: "Básico", desc: "Disparo em linha de dano próprio.", evolves: [5, 8] },
  { id: "restringente", name: "Restringente", level: 2, source: "Básico", desc: "Prende os pés do alvo ao chão (teste de Força).", evolves: [6] },
  { id: "dano-continuo", name: "Dano Contínuo", level: 2, source: "Guia Avançado", desc: "Queima ou eletrifica o alvo, causando dano por turno.", evolves: [7] },
  { id: "deslocamento-vacuo", name: "Deslocamento de Vácuo", level: 2, source: "Guia Avançado", desc: "Puxa ou empurra uma criatura por 1 rodada.", evolves: [7] },
  { id: "projetar", name: "Projetar", level: 2, source: "Guia Avançado", desc: "Projeta a criação contra um alvo a meio alcance.", evolves: [7] },
  { id: "purificar", name: "Purificar", level: 2, source: "Guia Avançado", desc: "Limpa o ambiente de gases e venenos." },
  { id: "repelir", name: "Repelir", level: 2, source: "Guia Avançado", desc: "Afasta criaturas e projéteis.", evolves: [7] },
  { id: "barreira", name: "Barreira", level: 3, source: "Básico", desc: "Parede defensiva com dureza comum do poder.", evolves: [6, 9] },
  { id: "flechas", name: "Flechas", level: 3, source: "Básico", desc: "Vários projéteis; permite fintar.", evolves: [6, 9] },
  { id: "lanca", name: "Lança", level: 3, source: "Guia Avançado", desc: "Projétil perfurante de longo alcance.", evolves: [6, 9] },
  { id: "ricochete", name: "Ricochete", level: 3, source: "Básico", desc: "Projétil que ricocheteia entre alvos.", evolves: [9] },
  { id: "coluna", name: "Coluna", level: 4, source: "Básico", desc: "Coluna que surge do chão sob o alvo.", evolves: [7, 10] },
  { id: "energizar", name: "Energizar", level: 4, source: "Guia Avançado", desc: "Envolve armas ou o corpo com o elemento; permite bloquear técnicas." },
  { id: "nuvem", name: "Nuvem", level: 4, source: "Básico", desc: "Área que prejudica quem está dentro.", evolves: [7, 10] },
  { id: "sopro", name: "Sopro Destrutivo", level: 4, source: "Básico", desc: "Cone destrutivo (ex.: Goukakyuu no Jutsu).", evolves: [7, 10] },
  { id: "correnteza", name: "Correnteza", level: 5, source: "Guia Avançado", desc: "Onda que empurra os inimigos.", evolves: [8] },
  { id: "missil", name: "Míssil", level: 5, source: "Básico", desc: "Projétil que explode em área (ex.: Ryuuka no Jutsu).", evolves: [8, 10] },
  { id: "onda-explosiva", name: "Onda Explosiva", level: 5, source: "Guia Avançado", desc: "Explosão ao redor do usuário.", evolves: [8] },
  { id: "cegante", name: "Cegante", level: 5, source: "Guia Avançado", desc: "Cega os alvos na área.", evolves: [8] },
  { id: "algemar", name: "Algemar", level: 6, source: "Básico", desc: "Prende o alvo em uma criação sólida.", evolves: [8, 10] },
  { id: "desastre", name: "Desastre", level: 9, source: "Guia Avançado", desc: "Catástrofe em área enorme, sob concentração." },
  // exclusivos
  { id: "imergir", name: "Imergir (Doton)", level: 2, source: "Básico", desc: "Mergulha no solo e se move por dentro dele.", evolves: [4] },
  { id: "tremor", name: "Tremor (Doton)", level: 2, source: "Básico", desc: "Faz o chão tremer, derrubando inimigos.", evolves: [4] },
  { id: "pele-pedra", name: "Pele de Pedra (Doton)", level: 6, source: "Básico", desc: "Endurece o corpo como rocha.", evolves: [9] },
  { id: "inflamavel", name: "Inflamável (Katon)", level: 5, source: "Guia Avançado", desc: "Espalha material inflamável na área.", evolves: [8] },
  { id: "meteoros", name: "Meteoros (Katon)", level: 9, source: "Básico", desc: "Chuva de projéteis flamejantes." },
  { id: "venenoso", name: "Venenoso (Fuuton)", level: 5, source: "Básico", desc: "Ventos carregam veneno." },
  { id: "afiar", name: "Afiar (Fuuton)", level: 6, source: "Básico", desc: "Lâmina de vento em armas." },
  { id: "lamina-vento", name: "Lâmina de Vento (Fuuton)", level: 7, source: "Básico", desc: "Corte de vento de alcance longo.", evolves: [10] },
  { id: "flutuar", name: "Flutuar (Fuuton – Leque)", level: 5, source: "Guia Avançado", desc: "Voa sobre o Leque Gigante. Requer Maestria." },
  { id: "lamina-raios", name: "Lâmina de Raios (Raiton)", level: 2, source: "Básico", desc: "Chidori/Raikiri: técnica de toque cortante. Pré-requisito: Espírito 8.", evolves: [5, 7, 9], reqText: "Espírito 8", req: [{ t: "attr", k: "ESP", min: 8 }] },
  { id: "arma-eletrica", name: "Arma Elétrica (Raiton)", level: 4, source: "Básico", desc: "Eletrifica armas.", evolves: [8] },
  { id: "descarga", name: "Descarga (Raiton)", level: 6, source: "Básico", desc: "Descarga elétrica em quem toca o usuário." },
  { id: "nevoa", name: "Névoa (Suiton)", level: 2, source: "Básico", desc: "Kirigakure no Jutsu: névoa que camufla.", evolves: [5] },
  { id: "prisao-agua", name: "Prisão de Água (Suiton)", level: 3, source: "Básico", desc: "Aprisiona o alvo em uma esfera de água.", evolves: [9] },
  { id: "colisao-ondas", name: "Colisão de Ondas (Suiton)", level: 6, source: "Básico", desc: "Grande onda que varre o campo.", evolves: [8, 10] },
  { id: "infligir-medo", name: "Infligir Medo (Hebi)", level: 2, source: "Hijutsus 2", desc: "Teste de Inteligência (Dif comum −2, −1 por alvo extra) ou fica assustado por 2 rodadas. Custo: 1 por nível usado.", evolves: [5, 7] },
  {
    id: "espelhos-demoniacos",
    name: "Espelhos Demoníacos (Hyouton)",
    level: 6,
    source: "Hijutsus 1",
    desc: "Makyō Hyōshō: 21 espelhos de gelo em cúpula; você se move entre eles e os reflexos confundem os ataques.",
    evolves: [8],
    reqText: "Ataque em Movimento (aptidão); Imergir (efeito)",
    req: [{ t: "apt", id: "ataque-em-movimento" }, { t: "effect", id: "imergir" }],
  },
  { id: "bracos-serpente", name: "Braços de Serpente (Hebi)", level: 4, source: "Hijutsus 2", desc: "Serpentes saem das mangas: arma longa simples de 6m e 3 de dano de arma, bloqueia ataques; pode usar Destreza no dano. Custo 4, contínua." },
  {
    id: "montaria",
    name: "Montaria (Kibaku Nendo)",
    level: 2,
    source: "Hijutsus 2",
    desc: "Animal de argila Grande para 2 pessoas: dureza 0, absorção 8 × Arte, Montaria Especial que não ataca. Pode explodir como material de outro efeito. Nv 5: Enorme, 5 pessoas e Voo igual à Arte.",
    evolves: [5],
    reqText: "Lidar com Animais 4, Ciências Naturais 6 ou Mecanismos 6",
    req: [{ t: "any", of: [{ t: "skill", k: "animais", min: 4 }, { t: "skill", k: "ciencias", min: 6 }, { t: "skill", k: "mecanismos", min: 6 }] }],
  },
  { id: "mina-explosiva", name: "Mina Explosiva (Kibaku Nendo)", level: 3, source: "Hijutsus 2", desc: "Argila como tarja explosiva, com o dano e a Dif de ativação remota do Kibaku Nendo; detona a 2m. Nv 6: várias minas à distância, sem kunai.", evolves: [6] },
];

export const EFEITO_BY_ID: Record<string, Efeito> = Object.fromEntries(EFEITOS.map((e) => [e.id, e]));

/** Efeitos exclusivos de elemento/poder (Capacidade não soma neles e o Talento Natural não pode escolhê-los). */
export const EXCLUSIVOS = ["espelhos-demoniacos", "bracos-serpente", "infligir-medo", "imergir", "tremor", "pele-pedra", "inflamavel", "meteoros", "venenoso", "afiar", "lamina-vento", "flutuar", "lamina-raios", "arma-eletrica", "descarga", "nevoa", "prisao-agua", "colisao-ondas", "montaria", "mina-explosiva"];

/** Símbolo de cada poder elemental (e dos que costumam virar versáteis), usado nos seletores. */
export const KANJI_PODER: Record<string, string> = { ninpou: "忍", doton: "土", fuuton: "風", katon: "火", raiton: "雷", suiton: "水", fuuinjutsu: "封", mokuton: "木", "kibaku-nendo": "粘" };

/** Poderes que podem ser escolhidos como versáteis na Versatilidade (Livro Básico, pág. 243). */
export const VERSATEIS = ["ninpou", "suiton", "katon", "doton", "fuuton", "raiton", "fuuinjutsu"];

export const NINPOU_BASE = ["canhao", "criar-arma", "orbe", "raio", "restringente", "projetar", "repelir", "barreira", "flechas", "lanca", "ricochete", "coluna", "energizar", "nuvem", "sopro", "correnteza", "missil", "onda-explosiva", "cegante", "algemar", "desastre"];

const A = (k: "ESP" | "INT" | "VIG" | "DES" | "PER", min: number): Req => ({ t: "attr", k, min });

export const PODERES: Poder[] = [
  {
    id: "ninpou", name: "Ninpou (Arte Ninja)", mode: "efeitos", source: "Básico",
    desc: "Ninjutsu não-elemental com estilo próprio (dê um nome ao seu Ninpou). Um efeito novo por nível. Dano = nível usado + ½ ESP; Dif = 9 + nível + ½ ESP.",
    effects: NINPOU_BASE,
  },
  {
    id: "doton", name: "Doton (Terra)", mode: "efeitos", element: true, source: "Básico",
    desc: "Manipula terra e rocha. Todos os efeitos de Ninpou + exclusivos.",
    effects: [...NINPOU_BASE, "deslocamento-vacuo", "imergir", "tremor", "pele-pedra"],
  },
  {
    id: "fuuton", name: "Fuuton (Vento)", mode: "efeitos", element: true, source: "Básico",
    desc: "Ventos cortantes; não cria prisões sólidas.",
    effects: ["canhao", "orbe", "barreira", "coluna", "flechas", "sopro", "raio", "nuvem", "energizar", "missil", "onda-explosiva", "ricochete", "correnteza", "inflamavel", "deslocamento-vacuo", "projetar", "purificar", "repelir", "cegante", "desastre", "venenoso", "afiar", "lamina-vento", "flutuar"],
  },
  {
    id: "katon", name: "Katon (Fogo)", mode: "efeitos", element: true, source: "Básico",
    desc: "Chamas destrutivas; não cria prisões sólidas.",
    effects: ["canhao", "orbe", "flechas", "coluna", "sopro", "raio", "energizar", "missil", "onda-explosiva", "ricochete", "dano-continuo", "inflamavel", "meteoros"],
  },
  {
    id: "raiton", name: "Raiton (Trovão)", mode: "efeitos", element: true, source: "Básico",
    desc: "Eletricidade veloz e letal.",
    effects: ["canhao", "orbe", "coluna", "flechas", "sopro", "raio", "energizar", "missil", "onda-explosiva", "ricochete", "meteoros", "dano-continuo", "desastre", "lamina-raios", "arma-eletrica", "descarga"],
  },
  {
    id: "suiton", name: "Suiton (Água)", mode: "efeitos", element: true, source: "Básico",
    desc: "O segundo elemento mais versátil: todos os efeitos de Ninpou.",
    effects: [...NINPOU_BASE, "inflamavel", "venenoso", "imergir", "deslocamento-vacuo", "purificar", "nevoa", "prisao-agua", "colisao-ondas"],
  },
  {
    id: "fuuinjutsu", name: "Fuuinjutsu (Selamento)", mode: "tecnicas", source: "Básico",
    reqText: "Inteligência 6", req: [A("INT", 6)],
    desc: "Selos de armazenamento, avançados e épicos.",
    techniques: [
      { level: 1, name: "Selo de Armazenamento" },
      { level: 2, name: "Selo de Armazenamento Maior" },
      { level: 3, name: "Misshi (Mensageiro)" },
      { level: 4, name: "Bakudan (Bomba)" },
      { level: 5, name: "Gensou no In (Selo de Ilusão)" },
      { level: 6, name: "Ninjutsu no Wana (Armadilha de Ninjutsu)" },
      { level: 7, name: "Chakra no Souin (Contenção de Chakra)" },
      { level: 8, name: "Kekkai no In / Shishou Fuuin" },
      { level: 9, name: "Keiyaku Fuuin (Anticontrato)" },
      { level: 10, name: "Shiki Fuujin (Demônio da Morte)" },
    ],
  },
  {
    id: "iryou", name: "Iryou Ninjutsu (Médico)", mode: "tecnicas", source: "Básico",
    reqText: "Ninja Médico; Espírito 6", req: [{ t: "apt", id: "ninja-medico" }, A("ESP", 6)],
    desc: "Cura com chakra e o Bisturi de Chakra.",
    techniques: [
      { level: 1, name: "Shousen no Jutsu (Mão Mística)" },
      { level: 1, name: "Chakra no Mesu (Bisturi de Chakra)" },
    ],
  },
  {
    id: "rasengan", name: "Rasengan (Explosão Espiral)", mode: "tecnicas", source: "Básico",
    reqText: "Espírito 8", req: [A("ESP", 8)],
    desc: "Esfera de chakra em rotação; sem selos de mão.",
    techniques: [
      { level: 1, name: "Rasengan Básico" },
      { level: 4, name: "Oodama Rasengan" },
      { level: 6, name: "Rasengan Completo" },
      { level: 8, name: "Rasengan Elemental" },
    ],
  },
  {
    id: "kuchiyose", name: "Kuchiyose (Invocação)", mode: "livre", source: "Básico",
    reqText: "Espírito ou Inteligência 6", req: [{ t: "any", of: [A("ESP", 6), A("INT", 6)] }],
    desc: "Invoca criaturas de um contrato (sapos, cobras, lesmas, cães, macacos…). Pode ser comum ou hijutsu.",
  },
  // ---------- restritos ----------
  { id: "kikai-ninpou", name: "Kikai Ninpou", mode: "efeitos", restricted: true, source: "Básico", reqText: "Kikaichuu", req: [{ t: "apt", id: "kikaichuu" }], desc: "Ninpou de insetos (Aburame).", effects: [...NINPOU_BASE, "dano-continuo", "purificar"] },
  { id: "baika", name: "Baika Ninpou", mode: "tecnicas", restricted: true, source: "Básico", reqText: "Vigor 6; Corpulência", req: [A("VIG", 6), { t: "apt", id: "corpulencia" }], desc: "Expansão do corpo (Akimichi).", techniques: [{ level: 1, name: "Baika no Jutsu" }, { level: 2, name: "Nikudan Sensha" }, { level: 3, name: "Bubun Baika no Jutsu" }, { level: 4, name: "Choudan Bakugeki" }] },
  { id: "juuken", name: "Juuken (Punho Gentil)", mode: "tecnicas", restricted: true, source: "Básico", reqText: "Espírito 1; Byakugan; Acuidade", req: [A("ESP", 1), { t: "apt", id: "byakugan" }, { t: "apt", id: "acuidade" }], desc: "Taijutsu Hyuuga que ataca o sistema de chakra.", techniques: [{ level: 1, name: "Juuken" }, { level: 2, name: "Jūkenpō Ichigekishin" }, { level: 3, name: "Hakkeshou Kaiten" }, { level: 4, name: "Hakke Sanjuuni Shou" }, { level: 5, name: "Hakke Kuushou" }, { level: 6, name: "Hakke Rokujuuyon Shou" }, { level: 7, name: "Juuho Soushiken" }, { level: 8, name: "Hakke Hyakunijuuhachi Shou" }] },
  { id: "shikakyu", name: "Shikakyu (Quadrúpede)", mode: "tecnicas", restricted: true, source: "Básico", reqText: "Hakken no Jutsu", req: [{ t: "apt", id: "hakken" }], desc: "Técnicas bestiais Inuzuka.", techniques: [{ level: 1, name: "Shikakyu no Jutsu" }, { level: 2, name: "Juujin Bunshin" }, { level: 3, name: "Tsuuga" }, { level: 5, name: "Sotorou" }, { level: 6, name: "Garouga" }, { level: 7, name: "Santorou" }, { level: 8, name: "Ooiga Gatenga" }] },
  { id: "kagejutsu", name: "Kagejutsu (Sombras)", mode: "tecnicas", restricted: true, source: "Básico", desc: "Técnicas de sombra do clã Nara.", techniques: [{ level: 1, name: "Kage Shibari" }, { level: 3, name: "Kage Mane" }, { level: 4, name: "Kage Mane Shuriken" }, { level: 5, name: "Kage Kubishibari" }, { level: 6, name: "Kageyose / Kage Nui" }, { level: 8, name: "Kagezukami" }] },
  { id: "shindenshin", name: "Shindenshin (Mente)", mode: "tecnicas", restricted: true, source: "Básico", desc: "Transmissão e troca de mente (Yamanaka).", techniques: [{ level: 1, name: "Shintenshin no Jutsu" }, { level: 3, name: "Shindenshin no Jutsu" }, { level: 5, name: "Shinten Bunshin" }, { level: 6, name: "Shinranshin" }, { level: 7, name: "Shinten Kugutsu Juin" }] },
  { id: "mokuton", name: "Mokuton (Madeira)", mode: "efeitos", restricted: true, source: "Básico", desc: "Terra + Água: madeira e árvores. Inclui técnicas como Mokujōheki, Moku Bunshin, Shichūrō e Mokujin.", effects: [...NINPOU_BASE, "deslocamento-vacuo", "imergir", "purificar"] },
  { id: "hachimon", name: "Hachimon Tonkou", mode: "tecnicas", restricted: true, source: "Básico", reqText: "Vigor 6", req: [A("VIG", 6)], desc: "Oito Portões: bônus físicos enormes em troca de Vitalidade. Pode ser comprado mesmo com clã.", techniques: [{ level: 1, name: "Kaimon (Abertura)" }, { level: 2, name: "Kyūmon (Cura)" }, { level: 3, name: "Seimon (Vida)" }, { level: 4, name: "Shōmon (Dor)" }, { level: 5, name: "Tomon (Limite)" }, { level: 6, name: "Keimon (Visão)" }, { level: 7, name: "Kyōmon (Milagre)" }, { level: 8, name: "Shimon (Morte)" }] },
  { id: "dokujutsu", name: "Dokujutsu (Venenos)", mode: "efeitos", restricted: true, source: "Guia Avançado", reqText: "Venefício 4; Químico", req: [{ t: "skill", k: "venef", min: 4 }, { t: "apt", id: "quimico" }], desc: "Ninpou baseado em Venefício (revisão do Guia).", effects: ["canhao", "orbe", "raio", "dano-continuo", "purificar", "flechas", "lanca", "ricochete", "coluna", "energizar", "nuvem", "sopro", "missil", "correnteza", "onda-explosiva", "cegante"] },
  { id: "hibon", name: "Hibon Ninpou", mode: "efeitos", restricted: true, source: "Básico", desc: "Ninpou único da família com duas bonificações (dano, dureza ou dificuldade) + exclusivos de um elemento.", effects: [...NINPOU_BASE, "imergir", "tremor", "pele-pedra", "inflamavel", "meteoros", "venenoso", "afiar", "lamina-vento", "lamina-raios", "arma-eletrica", "descarga", "nevoa", "prisao-agua", "colisao-ondas"] },
  { id: "jinchuuriki", name: "Jinchuuriki", mode: "livre", restricted: true, source: "Básico", desc: "Poder da Bijuu selada: Chakra Bijuu, Presença, Manto, Modo e Forma Bijuu, Bijuudama…" },
  { id: "magen", name: "Magen (Ilusão Demoníaca)", mode: "livre", restricted: true, source: "Básico", reqText: "Inteligência 6; Fascinar; Miragem; Ilusão Profunda", req: [A("INT", 6), { t: "apt", id: "fascinar" }, { t: "apt", id: "miragem" }, { t: "apt", id: "ilusao-profunda" }], desc: "Genjutsus: Amedrontar, Confundir, Segurar, Adormecer, Paralisar…" },
  { id: "versatilidade", name: "Versatilidade (Tensai)", mode: "efeitos", restricted: true, source: "Básico", desc: "Dois poderes versáteis em um (Ninpou, Suiton, Katon, Doton, Fuuton, Raiton, Fuuinjutsu).", effects: [...NINPOU_BASE, "imergir", "tremor", "pele-pedra", "inflamavel", "meteoros", "venenoso", "afiar", "lamina-vento", "lamina-raios", "arma-eletrica", "descarga", "nevoa", "prisao-agua", "colisao-ondas", "dano-continuo", "deslocamento-vacuo", "purificar"] },
  { id: "hyouton", name: "Hyouton (Gelo)", mode: "efeitos", restricted: true, source: "Hijutsus 1", desc: "Vento + Água: gelo (clã Yuki).", effects: [...NINPOU_BASE, "deslocamento-vacuo", "dano-continuo", "imergir", "espelhos-demoniacos"] },
  { id: "sabaku", name: "Sabaku Hijutsu (Areia)", mode: "efeitos", restricted: true, source: "Hijutsus 1", reqText: "Jinchuuriki 1 (Ichibi) ou opção de hijutsu", desc: "Técnica secreta do deserto: armadura, terceiro olho, pirâmide.", effects: NINPOU_BASE },
  { id: "jiton", name: "Jiton (Magnetismo)", mode: "efeitos", restricted: true, source: "Hijutsus 1", desc: "Satetsu (areia de ferro) ou Sakin (pó de ouro).", effects: [...NINPOU_BASE, "deslocamento-vacuo", "colisao-ondas"] },
  { id: "kami-ninpou", name: "Kami Ninpou (Papéis)", mode: "efeitos", restricted: true, source: "Hijutsus 1", desc: "Arte secreta dos papéis (Kamijutsu).", effects: [...NINPOU_BASE] },
  { id: "nintaijutsu", name: "Nintaijutsu", mode: "livre", restricted: true, source: "Hijutsus 1", reqText: "Força 2; Velocista; Ataque em Movimento", req: [{ t: "attr", k: "FOR", min: 2 }, { t: "apt", id: "velocista" }, { t: "apt", id: "ataque-em-movimento" }], desc: "Raiton unificado ao combate físico (efeitos próprios)." },
  { id: "rinne-ninpou", name: "Rinne Ninpou", mode: "livre", restricted: true, source: "Hijutsus 1", desc: "Poder do Rinnegan." },
  { id: "senninka", name: "Senninka", mode: "livre", restricted: true, source: "Hijutsus 1", desc: "Transformação Eremita (Juugo)." },
  { id: "kujaku", name: "Kujaku Myoho", mode: "efeitos", restricted: true, source: "Hijutsus 2", reqText: "Chakra Expandido; Vigor 2", req: [{ t: "apt", id: "chakra-expandido" }, A("VIG", 2)], desc: "Arte do pavão (Hoshigakure).", effects: [...NINPOU_BASE] },
  { id: "bakuton", name: "Bakuton (Explosão)", mode: "efeitos", restricted: true, source: "Hijutsus 2", reqText: "Espírito 4", req: [A("ESP", 4)], desc: "Chakra explosivo.", effects: [...NINPOU_BASE] },
  { id: "sumi-ninpou", name: "Sumi Ninpou (Tinta)", mode: "efeitos", restricted: true, source: "Hijutsus 2", reqText: "Arte de Combate", req: [{ t: "apt", id: "arte-combate" }], desc: "Ninpou de tinta (Chouju-Giga).", effects: [...NINPOU_BASE, "nevoa", "prisao-agua"] },
  { id: "kumo-ninpou", name: "Kumo Ninpou (Teia)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Teias de chakra (Gorudogumo).", effects: [...NINPOU_BASE, "projetar", "purificar"] },
  { id: "hebi-ninpou", name: "Hebi Ninpou (Serpentes)", mode: "efeitos", restricted: true, source: "Hijutsus 2", reqText: "Possessão da Serpente Branca; Ocultismo 2", req: [{ t: "apt", id: "possessao-serpente" }, { t: "skill", k: "ocultismo", min: 2 }], desc: "Arte ninja das serpentes (Hebinomichi). Alcance curto; +1 na dificuldade de resistência.", effects: ["canhao", "orbe", "raio", "restringente", "imergir", "barreira", "flechas", "lanca", "ricochete", "coluna", "nuvem", "sopro", "correnteza", "missil", "onda-explosiva", "venenoso", "algemar", "infligir-medo", "bracos-serpente", "dano-continuo", "projetar", "purificar", "repelir", "cegante"] },
  { id: "ototon", name: "Ototon (Som)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Elemento Som (Jingokuon).", effects: [...NINPOU_BASE, "dano-continuo"] },
  { id: "jiongu", name: "Jiongu", mode: "livre", restricted: true, source: "Hijutsus 2", reqText: "Corpo de Fios; Ocultismo 10; Medicina 10", req: [{ t: "apt", id: "corpo-fios" }, { t: "skill", k: "ocultismo", min: 10 }, { t: "skill", k: "medicina", min: 10 }], desc: "Rancor da Terra do Medo: corpo de fios e corações extras." },
  { id: "jinton", name: "Jinton (Poeira)", mode: "livre", restricted: true, source: "Hijutsus 2", reqText: "Espírito 12; Doton, Fuuton ou Katon 5", req: [A("ESP", 12), { t: "any", of: [{ t: "power", id: "doton", min: 5 }, { t: "power", id: "fuuton", min: 5 }, { t: "power", id: "katon", min: 5 }] }], desc: "Kekkei Touta: desintegração." },
  { id: "kibaku-nendo", name: "Kibaku Nendo (Argila)", mode: "efeitos", restricted: true, source: "Hijutsus 2", reqText: "Arte 4", req: [{ t: "skill", k: "arte", min: 4 }], desc: "Argila explosiva moldada. Parâmetros pela Arte, +2 de dano e bombas de argila iguais ao nível usado.", effects: ["canhao", "orbe", "imergir", "flechas", "coluna", "nuvem", "missil", "onda-explosiva", "inflamavel", "algemar", "meteoros", "montaria", "mina-explosiva"] },
  { id: "futton", name: "Futton (Vapor)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Mei Kekkei Genkai: vapor.", effects: [...NINPOU_BASE, "dano-continuo"] },
  { id: "youton", name: "Youton (Lava)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Mei Kekkei Genkai: lava.", effects: [...NINPOU_BASE, "dano-continuo", "desastre"] },
  { id: "ranton", name: "Ranton (Tempestade)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Água + Raio: tempestade.", effects: [...NINPOU_BASE, "lamina-raios"] },
  { id: "shakuton", name: "Shakuton (Calor)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Fogo + Vento: calor que seca.", effects: [...NINPOU_BASE, "dano-continuo"] },
  { id: "shouton", name: "Shouton (Cristal)", mode: "efeitos", restricted: true, source: "Hijutsus 2", desc: "Cristal.", effects: [...NINPOU_BASE, "dano-continuo", "deslocamento-vacuo"] },
];

/**
 * Kekkei genkai de elemento (Livro Básico, Mokuton; Livros de Hijutsus): 1 nível grátis em cada elemento que a forma,
 * com o Canhão desses elementos usando o nível da kekkei genkai; níveis a mais nesses elementos são comprados à parte.
 * `restrito`: o personagem só aprende a kekkei genkai e esses elementos (Restrição de Elemento).
 */
export const KEKKEI_ELEMENTOS: Record<string, { gratis: string[]; restrito: boolean }> = {
  mokuton: { gratis: ["doton", "suiton"], restrito: true },
  hyouton: { gratis: ["fuuton", "suiton"], restrito: true },
  sabaku: { gratis: ["fuuton", "doton"], restrito: true },
  jiton: { gratis: ["fuuton", "doton"], restrito: true },
  youton: { gratis: ["doton", "katon"], restrito: true },
  futton: { gratis: ["katon", "suiton"], restrito: true },
  ranton: { gratis: ["raiton", "suiton"], restrito: true },
  shakuton: { gratis: ["katon", "fuuton"], restrito: true },
  shouton: { gratis: ["doton"], restrito: true },
  bakuton: { gratis: ["doton", "raiton"], restrito: true },
  jinton: { gratis: ["doton", "fuuton", "katon"], restrito: true },
  ototon: { gratis: ["fuuton"], restrito: false },
  "kibaku-nendo": { gratis: ["doton"], restrito: false },
};

export const PODER_BY_ID: Record<string, Poder> = Object.fromEntries(PODERES.map((p) => [p.id, p]));

export const BIJUUS = [
  "Ichibi (Shukaku)",
  "Nibi (Matatabi)",
  "Sanbi (Isobu)",
  "Yonbi (Son Gokū)",
  "Gobi (Kokuō)",
  "Rokubi (Saiken)",
  "Nanabi (Chōmei)",
  "Hachibi (Gyūki)",
  "Kyuubi (Kurama)",
];
