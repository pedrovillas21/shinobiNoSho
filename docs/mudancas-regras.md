# Mudanças de regras: auditoria com os livros (30/09/2026)

Auditoria do app contra os 4 livros (`docs/*.txt`), usando a ficha do Ashihira Senju como caso de teste.
As regras abaixo faltavam ou estavam erradas no app e foram corrigidas.

## Já estava certo

Vitalidade, Chakra, Iniciativa, Reação de Esquiva, Deslocamento, pontos por NC (atributos, perícias, poderes, sociais),
atributo mínimo e máximo, limite de poder e perícia, Acuidade, dano/dificuldade/dureza/custo de Ninpou e elementos,
alcance e tamanho dos elementos, recompra de poder com nível 1 grátis, evoluções, graus de dano, estados de morte,
descanso, regra dos 3 pontos de poder e o limite de 2 Aptidões Especiais do Tensai.

Conferido com a planilha do Ashihira: Vitalidade 134, Chakra 90, Iniciativa 36, Reação de Esquiva 34, Deslocamento 20.

## Versatilidade (Livro Básico, Tensai)

- **Dois poderes versáteis por compra.** No construtor, escolhe-se os dois poderes (Ninpou, Suiton, Katon, Doton, Fuuton, Raiton ou Fuuinjutsu).
- **Nível 1 vale para os dois.** Dá Canhão, ou a técnica de nível 1 no Fuuinjutsu.
- **Do nível 2 em diante, cada nível é de um poder.** Depois de 2 níveis seguidos no mesmo poder, o próximo é do outro. O efeito precisa ser do nível escolhido ou menor.
- **Pré-requisitos.** O nível de Versatilidade conta como nível do poder versátil. Ex.: Versatilidade 10 com Raiton Versátil cumpre "Raiton 5" (Domínio do Raio) e, com Fuuinjutsu Versátil, "Fuuinjutsu 8" (Deus do Trovão).
- **Validação.** A ficha acusa:
  - 3 níveis seguidos no mesmo poder;
  - efeito acima do nível ou fora da lista do poder;
  - evolução antes do nível;
  - poder versátil repetido (na mesma compra ou em outra; a 4ª compra pode repetir os de outras compras);
  - compra extra de Versatilidade sem Aprendizagem Rápida.
- **Ataques na mesa.** Cada poder versátil vira um grupo com alcance, tamanho e bônus do próprio elemento. Ex.: o Raiton Versátil com Espírito/Inteligência 20 tem alcance 75m, tamanho 10m e +1 de dano. Os parâmetros usam o nível de Versatilidade mais alto entre as compras.
- **Lâmina de Raios (Raiton e Raiton Versátil).**
  - O pré-requisito Espírito 8 do efeito agora é conferido. O nível de Versatilidade substitui o nível do poder, mas não os atributos.
  - Na mesa, a observação muda com cada evolução: no Nv 5, preparar vira ação parcial; no Nv 7, ignora toda dureza (proteção Raiton, só metade; Fuuton, nenhuma); no Nv 9, ganha Crítico Aprimorado.
  - Com a evolução Nv 5 aparece a linha "Investida": +2 de dano, mais +1 por nível do poder acima do 5. No versátil conta o nível da Versatilidade, não o nível usado. A linha só pode ser usada do Nv 5 em diante.
  - Evoluções não podem ser puladas (Livro Básico, Evoluindo Efeitos): a Lâmina Nv 9 pede a Lâmina, a Nv 5 e a Nv 7 escolhidas antes. Usada abaixo do nível de uma evolução, a técnica fica sem o melhoramento dela.
- **Pular evoluções (regra da mesa, opcional).** Vale para qualquer efeito, em qualquer poder. Com a regra ligada na etapa Conceito, o efeito já entra na evolução mais alta que o nível da escolha permite, com as anteriores junto, mesmo na 1ª escolha (Lâmina de Raios escolhida no nível 9 = Lâmina Nv 9, numa escolha só). Escolher de novo um efeito já evoluído leva à evolução seguinte possível. O pré-requisito do efeito (ex.: Espírito 8) continua valendo.
- **Aprendizagem Rápida.** Pode ser comprada quantas vezes quiser (sem campo de categoria). Cada compra cria mais uma tabela de Versatilidade na etapa Poderes, e o catálogo mostra quantas tabelas estão liberadas.
- **Fuuinjutsu Versátil em lista (regra da mesa, opcional).** Pelo livro, cada nível dá uma técnica, e a que ficou para trás se perde (Selo de Armazenamento no 1 e Misshi no 3, sem o Selo de Armazenamento Maior). Com a regra ligada na etapa Conceito, cada nível que o Fuuinjutsu recebe traz todas as técnicas até ele (Misshi no 3 também traz o Selo de Armazenamento Maior).
- **Fuuinjutsu Versátil.** Lista na mesa as técnicas escolhidas nos níveis dele.
- **4ª Versatilidade (regra da casa).** A 4ª compra traz 3 poderes versáteis em vez de 2 e pode repetir os de outras compras (mas não dentro dela mesma). O nível 1 vale para os três; do 2º em diante, cada nível é de um deles, com no máximo 2 seguidos no mesmo. Na mesa, um poder que aparece em mais de uma compra vira um grupo só, com os efeitos somados.
- **Fichas antigas.** O app tenta ler os poderes versáteis do nome digitado ("Katon Versátil + Suiton Versátil"). Os níveis de cada poder precisam ser escolhidos de novo; até lá, a ficha mostra um aviso.

## Clã Uchiha (Livro Básico, pág. 180–187)

- **Exigência de elemento.** A ficha acusa erro se o Uchiha não tiver o poder Katon nem a aptidão Elemento Natural: Katon.
- **Elemento Natural: Katon.** Na mesa aparece o Sopro Destrutivo 4 com dano base Espírito +2 e custo ½ Espírito. Com o poder Katon no nível 4, o Sopro entra de graça no grupo do Katon e evolui sozinho no 7 e no 10. Escolher o Sopro no Katon gera um aviso (é escolha desperdiçada).
  - Leitura adotada: nem a aptidão nem o poder Katon de quem tem a aptidão contam no limite de afinidade elemental.
- **Nidan Sharingan.** A Mímica Sharingan dá o Novo Elemento: +1 no limite de afinidade elemental. Na mesa, a Mímica aparece com Anular, Copiar (1 técnica a cada 4 de Inteligência, máx. 5), Memorizar e Novo Elemento.
- **Hipnose Sharingan.** Com Sandan Sharingan, Fascinar e Ilusão Profunda, vira técnica na mesa: Dif 8 + Inteligência, 5 de chakra.
- **Mangekyou Sharingan.**
  - Escolhe-se o par de técnicas dos olhos: Tsukuyomi e Amaterasu, Kagutsuchi e Amaterasu, ou Kamui.
  - Cada técnica desperta ao cumprir os pré-requisitos (Katon 8; Fascinar, Ilusão Profunda e Inteligência 16; nível 8 num poder de ninjutsu). O Susanoo vem ao dominar o par. O que falta aparece como aviso.
  - Na mesa, as técnicas despertas viram ataques com custo de chakra e de visão. O Susanoo desconta 2 de visão ao ativar e 1 por turno.
- **Pontos de visão.** 10 no total, que não se recuperam: nem na noite de descanso, nem em “Restaurar tudo”.
  - A cada 3 perdidos: ofuscado permanente (com 7, 4 e 1 ponto), que soma no ataque fora do limite de −3.
  - 1º zero: atordoado e desprevenido por 1 turno, e o Sharingan desliga. Nada do Sharingan liga (nem técnicas) até o Descanso do Sharingan, que devolve até 5 pontos e mantém o ofuscado 3.
  - 2º zero: cego, permanente.
- **Mangekyou Eterno** (somente PdM): aptidão nova do clã. As técnicas não custam visão, e ela cura o ofuscado e a cegueira.
- **Izanagi e Izanami** (Livro de Hijutsus vol. 2, somente PdM).
  - **Izanagi:** na mesa, conta os usos da cena (metade do Espírito ou da Inteligência) e cobra 10 de chakra só no primeiro.
  - **Izanami:** tem as duas ações (gravar, com Dif 11 + Inteligência, e selar).
  - **Fim da técnica:** acaba quando os usos do Izanagi terminam, quando a cena termina ou quando o Izanami é selado. A mesa então pede o olho perdido: ofuscado −1 permanente e, com o Mangekyou, a técnica desse olho (no Kamui, o curto ou o longo alcance) e o Susanoo. O segundo olho deixa cego.
  - **Cura:** só com transplante ocular ou com o Mangekyou Eterno.
- **Controlar Bijuu** (somente PdM, com o Mangekyou): aparece na Hipnose Sharingan.

## Chakra

- **Não fica negativo.** Técnica, estado ou troca de forma sem chakra suficiente não sai, e nada é gasto. O botão fica desabilitado.
- **Custo por turno.** Se não houver chakra para pagar, o estado desliga.
- **Gasto manual e “Definir”.** Param no 0. Em 0, a pessoa fica exausta (Livro Básico, Chakra: Gasto e Recuperação).

## Controle Perfeito (Livro Básico, Tensai)

- Com Inteligência maior que o Espírito, a Inteligência substitui o Espírito em todos os parâmetros de poderes e aptidões, tudo junto: dano, dificuldade, alcance, tamanho e custo dos efeitos, Rasengan, Sopro do Elemento Natural: Katon, Kamui, Susanoo, Kyoudo Kyouka, Armadura de Raios, Voo do Kujaku e sensor do Modo Eremita. Também vale nos resumos de dano do construtor e da ficha.
- Não vale para pré-requisitos (a Lâmina de Raios continua pedindo Espírito 8), para o chakra total nem para a afinidade elemental (Espírito 10).
- Nível 2 (Inteligência 12): soma a Inteligência ao chakra total.

## Talento Natural

- Escolhe-se o poder (um versátil de efeitos, ou Hibon Ninpou) e um efeito que não seja exclusivo de elemento.
- Na mesa, o efeito aparece com todas as evoluções que o nível do poder já permite (marcado "Talento Natural").

## Sensores

- **Sensor:** virou estado da mesa. Alcance 10m + 2×Rastrear e 5 de chakra; dura até o início do próximo turno ou é mantido por concentração.
  - Sensor Limitado (detecção pelo solo ou olfato) é escolhido na aptidão e custa 3.
- **Kagura Shingan:** virou estado da mesa. Alcance ativo 20m + 4×Rastrear, passivo pela metade.
  - Alcance estendido ×2, com Rastrear 4.
  - Ryoushitsu dobra o alcance e mostra o alcance progressivo e a supressão de chakra.
- **Hakken no Jutsu:** o estado mostra o alcance, 10m + 2×Rastrear.

## Aptidões de clã e doujutsu

- **Resiliência (Akimichi):**
  - dureza de corpo 1 a cada 4 pontos completos de Vigor (tamanho não conta);
  - −5m de deslocamento;
  - −3 em Esquiva, Acrobacia e Furtividade.

  No Modo Chou do Controle de Caloria, o deslocamento e a Esquiva voltam ao normal.
- **Corpulência:** quem tem não recebe os benefícios da condição acelerado.
- **Rinnegan:** reduz o chakra total em 10% (arredondado para cima).
- **Jinchuuriki nível 1 (Chakra Bijuu):** recebe os benefícios do Chakra Expandido (+50% de chakra; não acumula com a aptidão). Também vale para os requisitos do Rasengan Completo/Oodama.

## Combate

- **Reflexos e Intuição:** somam sozinhos +1 na Esquiva e +1 em Ler Movimento. Não contam para pré-requisitos. Se o +1 também estiver em "Outros", a ficha avisa para não contar duas vezes.
- **Velocista + acelerado:** soma +10m ao deslocamento, em vez de dobrar a Agilidade de novo.
- **Bônus de Esquiva perdidos:** quem está desprevenido, impedido, agarrado, indefeso ou inconsciente perde os bônus de Esquiva na reação.
  - Perde Reflexos, bônus positivos em "Outros" e bônus de estados.
  - A mesa mostra quanto foi perdido.
- **Dureza de corpo na mesa:** soma a da Resiliência com a dos estados.

## Meta-aptidões

- **Potencializar:** tem as três opções do livro: +1 de dano base, alcance ×2 ou área ×2.
- **Uma meta-aptidão por técnica:** escolher Potencializar desliga Técnica Poderosa e vice-versa.

## Equipamento

- **Limite de compartimentos:** 3. Com Burro de Carga (Guia Avançado): 4, 5 com Força 8 e 6 com Força 12.
- **Cada compartimento acima do limite:** −3m de deslocamento, já descontado. O −1 de precisão aparece no aviso, mas não é descontado dos testes: no texto do livro, a frase que diz quais testes são afetados está cortada.

## Pílulas do Soldado

- Cada pílula dá ½ Espírito de chakra.
- O efeito colateral acumula desde o último descanso: 1ª fatigado, 2ª exausto, 3ª inconsciente (após 1 hora).
- A 4ª pílula não dá chakra e intoxica: inconsciente por 1 hora, depois exausto por 20 dias.
- O contador de pílulas zera na noite de descanso e em "Restaurar tudo".

## Testes sociais

Aparecem no construtor (etapa de atributos), na ficha impressa e na mesa:

| Teste | Fórmula |
|---|---|
| Atuação | Carisma + ½ Arte |
| Barganha | Carisma + ½ Percepção |
| Blefar | Manipulação + ½ Inteligência (com Carisma: Dif +3 inamistoso, +6 hostil; −3 amistoso, −6 prestativo) |
| Intimidação | Manipulação + ½ Percepção |
| Mudar Atitude | Manipulação + ½ Percepção (com Carisma, só para melhorar) |
| Obter Informação | Carisma + ½ Inteligência |

## Nível shinobi por NC

Segue a Tabela de Evolução do Livro Básico (muda o nome do nível e os ryos iniciais):

| NC | Nível shinobi | Ryos iniciais |
|---|---|---|
| 4–6 | Genin | 100 |
| 7–9 | Chuunin | 1.000 |
| 10–11 | Jounin Especial | 5.000 |
| 12–14 | Jounin | 13.000 |
| 15–17 | Jounin Elite | 36.000 |
| 18+ | Sannin / Kage | 88.000 |

## Armas de fogo e Saika Ikki (Guia Avançado, pág. 13–15, 27–29 e 56–58) — 02/10/2026

Conferido com uma ficha de pistoleiro (Destreza 20, CD 25, Prestidigitação 20, mosquete e bacamarte).

- **Especialista na precisão.** A mesa e a ficha mostram o teste de ataque com o +1 do Especialista da categoria. Arma de fogo aceita Especialista: Armas de Fogo ou Armas de Disparo, sem somar os dois. Ex.: CD 25 → disparo 26.
- **Aptidões de disparo valem nas armas de fogo** (Dano Extra, Mira Apurada, Tiro Longo, Tiro Preciso). Dano Extra com CD 25: +1 no 18 e +1 no 20, 22 e 24 = +4. O nível usado é o da CD sem Especialista.
- **Crítico Aprimorado\* revisado.** Não se escolhe mais a arma: vale em toda arma (ou desarmado) com Especialista. Com a regra opcional sem Especialista, vale em tudo, com CC ou CD 13. Mosquete 15-16 → 14-15-16.
- **Alcance em metros.**
  - Tiro Longo\* dobra o alcance de disparo e arremesso.
  - Alcance Estendido soma +10m nas armas de fogo depois de dobrar.
  - Mosquete com Destreza 20: (15 + 3 × 20) × 2 + 10 = 160m. Bacamarte: 20 × 2 + 10 = 50m.
- **Armamento Pesado:** +1 de dano de arma nas armas de fogo. Mosquete: 10 + 5 + 1 + 4 = 20.
- **Bacamarte:** linha separada para o alvo a até 10m, com +1 de dano de arma (+2 com Destreza 12): 10 + 6 + 1 + 4 = 21. Além disso fica 19. Tiro Longo não aumenta esses 10m.
- **Disparo mirado:** com Mira Apurada aparece a linha "mirado" (+1 de precisão, gasta a ação de movimento). Com Mira Vital, ela tem +0,5 grau de dano (grau 2 → 2,5: 20 × 2,5 = 50). Não vale com Desarme à Distância nem Flechada no Joelho.
- **Gun Fu:** linha "Golpear" com a arma de fogo, usando a precisão de CD e dano de arma −2. A nota traz o Bloqueio com CD e o disparo com inimigo adjacente (Prestidigitação contra CC +3).
- **Recarga.**
  - Sem nada: ação de movimento.
  - Com Usar Pólvora e Saque Rápido: Recarga Rápida de Pólvora, Prestidigitação contra o manuseio. Passando, recarrega como ação livre; até 2 tentativas por rodada.
  - Recarga Precisa simula 1 dado: 8 + Prestidigitação (não "8 + outro dado"). 8 + 20 = 28 passa o manuseio 22 do mosquete e o 18 do bacamarte.
  - O manuseio agora é um campo da arma: pistola pequena 10, pistola 14, arcabuz 16, bacamarte 18, mosquete 22.
- **Tiro Preciso 2:** a nota explica que ignora camuflagem total, mas você ainda precisa saber que o inimigo existe e ter noção vaga da posição. Não atravessa cobertura total.
- **Guerreiro\*:** valida a categoria (Leves, Medianas, Longas ou Pesadas) e pede Força ou Destreza 10 fora das Leves.
- **Retirada Rápida\*:** a descrição traz o +10m de deslocamento uma vez por cena.

## Jinton e Kekkei Touta (Livro de Hijutsus vol. 2, pág. 71–76) — 02/10/2026

- **Jinton não é Ninpou.** Não tem lista de efeitos; tem uma técnica, o Genkai Hakuri no Jutsu, que agora aparece na mesa:
  - alcance 5m + 1m por Espírito, esfera de 0,5m por Espírito;
  - dano nível + Espírito, custo igual ao nível usado.
  - Prepara com ação padrão e expande no turno seguinte; na área, −2 nas defesas.
  - Sem meta-aptidões até o Jinton 10. A Destruição Avançada libera as meta-aptidões, o golpe de misericórdia e a morte instantânea.
- **Efeitos novos de Doton do Kekkei Touta.** Quem tem uma aptidão restrita do Jinton (Elemento Natural: Terra, Fissão ou Apagar Presença) pode escolhê-los no Doton:
  - Redução de Peso (Nv 5, evolui no 8);
  - Adição de Peso (Nv 6, evolui no 9, pede Elemento Natural: Terra);
  - Golem de Pedra (Nv 7, evolui no 10).

  Eles não aparecem no seletor para quem não tem essas aptidões.
- **2ª opção do hijutsu** (Fissão; Apagar Presença): a Redução de Peso não pode ser evoluída (a ficha acusa erro).
- **Socos Pesados:** com Adição de Peso e Energizar, a mesa mostra o Soco de Pedra com dano de arma 5.
- **Maximizar:** escolhe-se o elemento (Mokuton ou Suiton; Jinton ou Doton só pelo hijutsu Jinton). Na mesa, o Potencializar nesse elemento aplica os três melhoramentos de uma vez. No Jinton, só a partir do nível 10.
  - Leitura adotada: os efeitos de nível 5, 6 e 7 vêm do Kekkei Touta para o Doton, não do Maximizar.
- **Correções:**
  - Fissão pede Vigor 8 (estava 12) e a descrição agora é a da Duplicata;
  - descrições de Elemento Natural: Terra e Apagar Presença corrigidas.

## Evoluções entre tabelas do mesmo poder — 02/10/2026

Regra confirmada com o criador do sistema. Não é opcional e não está escrita nos `docs/*.txt`.

- **Tabelas.** Duas tabelas do mesmo elemento (ou poder de efeitos) dividem as evoluções: uma serve para pegar as evoluções da outra. Contam como tabelas:
  - o poder comprado de novo;
  - o poder e ele como versátil;
  - o mesmo versátil em duas Versatilidades.
- **Exemplo.** Doton com 2 níveis tem Imergir (Imergir 2). No Doton com 10 níveis, escolher Imergir dá Imergir Nv 4.
- **Como o app conta.**
  - As escolhas de todas as tabelas do poder entram numa fila, pelo nível em que foram feitas (empate: ordem na ficha).
  - Na mesma tabela, repetir é sempre evolução, como antes.
  - Vindo de outra tabela, é evolução quando ela existe e cabe no nível da tabela. Num poder comum, o limite é o nível do poder; num versátil, o nível da escolha.
  - Fora isso, é só o mesmo efeito, com a evolução que já tinha (ex.: o Canhão de cada tabela).
- **Construtor.** O seletor mostra "→ evolução" para efeitos que estão em outra tabela ("Você já tem Imergir em outra tabela de Doton…").
- **Ficha e mesa.** Cada tabela mostra o efeito com a evolução que ela alcança. O Doton 2 continua com Imergir; o Doton 10 (ou o Doton Versátil) fica com Imergir evoluído Nv 4.

## Comprando o poder pela 2ª vez (Livro Básico, Ninpou) — 02/10/2026

- **Já estava certo:**
  - o nível 1 da 2ª compra em diante é grátis (Ninpou 4 + Ninpou 3 = 6 pontos);
  - os parâmetros de todos os efeitos usam o nível mais alto entre as compras (na mesa, o Raio da compra de nível 3 vai até o Nv 4).
- **Corrigido:** cada compra só ganha efeitos pelos próprios níveis. Antes, uma 2ª compra de nível 3 aceitava um efeito de nível 5 se a outra compra fosse de nível 5. O nível mais alto só define os parâmetros, não os efeitos de cada compra.
  - Vale também para as evoluções: a evolução precisa caber no nível da compra em que foi escolhida. Inclui a evolução vinda de outra tabela; o Doton 10 evolui o Imergir do Doton 2, o contrário não.

## Elementos Irrestritos (Livro de Hijutsus vol. 2, pág. 134, Zetsu) — 02/10/2026

- **Antes:** a aptidão não fazia nada. Com o Mokuton, a Restrição de Elemento barrava Katon, Fuuton e Raiton, e o limite de afinidade continuava valendo.
- **Agora:**
  - 1 nível grátis nos cinco elementos básicos, com o Canhão de cada um no nível de Mokuton (aparece na ficha e na mesa como "grátis pelo Elementos Irrestritos");
  - a 1ª compra de qualquer elemento básico tem o nível 1 já pago;
  - pode comprar qualquer dos cinco: a Restrição de Elemento do Mokuton deixa de valer para eles;
  - não sofre mais o limite de afinidade elemental (Livro Básico, p.89).
- **Só o Canhão usa o nível de Mokuton.** Com Mokuton 10, os cinco Canhões vão até o nível 10, mas os elementos continuam no nível 1 (ou no nível comprado): os outros efeitos e os pré-requisitos (ex.: "Fuuton 5") seguem esse nível. Ex.: Katon 3 comprado tem Canhão até 10 e Raio até 3.
- **Não dá outras kekkei genkai.** A aptidão abre só os cinco elementos básicos; Hyouton, Youton etc. continuam fora pela Restrição de Elemento do Mokuton.
- **Corrigido junto:** com duas kekkei genkai na ficha, a Restrição de Elemento juntava as listas das duas, e uma liberava a outra (Mokuton + Hyouton não dava erro). Agora cada uma barra a outra. A exceção é a Dupla Linhagem, que junta Futton e Youton.
- **Leitura adotada:** o nível grátis não soma com o do Mokuton. Os dois dão o mesmo "1 nível" em Doton e Suiton, então continua Doton 1 e Suiton 1 (o livro não diz que acumula). Se o criador confirmar que soma, vira Doton 2 e Suiton 2.

## Coletes e armaduras (Livro Básico, Tabela de Armaduras) — 02/10/2026

- **Antes:** os coletes eram só itens com nome e preço; não mudavam o limite de compartimentos.
- **Agora:** a armadura muda o limite sem penalidade (3, ou o do Burro de Carga):
  - Colete Ninja: +1 (bolsos a mais);
  - Colete Ninja Resistente: −1 (couro reforçado; +10 de absorção);
  - Armadura de Batalha −1 e Reforçada −2, se forem adicionadas com esse nome.
- Ex.: com o Colete Resistente o limite cai para 2; levar 3 compartimentos dá −3m de deslocamento e −1 de precisão.
- **Observações novas:** coletes só para Chuunin ou acima; não se veste uma armadura sobre outra (com duas, vale a primeira da lista).
- **Ainda não feito:** a absorção da armadura não entra na mesa, e a penalidade das armaduras pesadas não é aplicada.

## Daikiga: Terra Insaciável e efeitos de Doton (Livro de Hijutsus vol. 2, pág. 30–31) — 02/10/2026

- **Antes:** Terra Insaciável era só um nome ("Doton que devora chakra"); os efeitos de Doton do Daikiga não existiam.
- **Terra Insaciável:**
  - pré-requisito completo: Ingestão de Chakra, Doton 6 e Barreira (Doton) — faltava a Barreira;
  - Barreira Nv 6 grátis no Doton: a aptidão evolui a Barreira Nv 3 (pré-requisito) para Nv 6, então a próxima Barreira escolhida no Doton já é a Nv 9 (pede Doton 9). Vale no seletor do construtor, na ficha e na mesa (conferido no PDF, p.31). Mostra que pode usar CC no lugar de CD (prender) ou de LM+2 (defender);
  - drenar chakra pela Barreira e Prisão Indestrutível estão na descrição;
  - só Doton como poder elemental: outro elemento (ou kekkei genkai, ou elemento versátil) vira observação.
- **Efeitos novos de Doton** (só aparecem no seletor com Ingestão de Chakra e Terra Insaciável):
  - Cortina de Poeira (nível 4): pede ainda Lutar às Cegas ou Sensor, e o Tremor. Na mesa: chakra = ½ do nível usado, círculo do tamanho comum, regras da Névoa Nv 2, dura turnos iguais ao nível;
  - Golem de Terra Insaciável (nível 7, evolui no 10): como o Golem de Pedra do Jinton; o ataque corporal drena ¼ do Espírito em chakra (arredondado para cima, como na Ingestão de Chakra; o livro não diz).

## Efeitos exclusivos do Mokuton e do Zetsu (Livro Básico, Mokuton; Livro de Hijutsus vol. 2, pág. 134–135) — 02/10/2026

- **Antes:** o Mokuton só tinha os efeitos de Ninpou, Imergir, Deslocamento de Vácuo e Purificar.
- **Efeitos exclusivos do Mokuton** (Livro Básico). Os níveis vêm das técnicas prontas: Soushinki pede "Mokuton 2 (Transmissor)" e Fuuinjutsu pede "Mokuton 6 (Selar Chakra)".
  - Transmissor (nível 2): pede Clone (Moku Bunshin);
  - Selar Chakra (nível 6, evolui no 9): pede Raio. Junto com o Raio, o alvo perde ½ do nível usado em chakra; inclui o Selar Chakra Bijuu;
  - Golem (nível 7, evolui no 10).
- **Dificuldade do Mokuton:** faltava o +1 na dificuldade de resistência de todo efeito Mokuton (o +1 de dano já existia). Ex.: Mokuton 5 com Espírito 10 tem Dif 20.
- **Conferido no PDF** (Livro Básico p.176–178; Hijutsus vol. 2 p.134–135): níveis, pré-requisitos, custos e evoluções batem. O cabeçalho do Selar Chakra diz "Dano: 2 por nível do poder", mas o texto diz que o Raio causa o dano normal e o alvo perde ½ do nível usado em chakra; o app segue o texto.
- **Efeitos para Zetsu** (só aparecem no seletor com Anatomia Zetsu):
  - Efemeróptero (nível 5): pede Imergir; custo 5, viaja 50m × Espírito por rodada;
  - Chuva de Esporos (nível 7, evolui no 10): pede Transmissor, Nuvem, Selar Chakra e Clone Zetsu.

## Shakuton, Corpo Esguio, Modo Eremita, Maximizar e Golem — 03/10/2026

- **Shakuton (Livro de Hijutsus vol. 2, pág. 121–123):**
  - +2 de dano base em todo efeito (faltava na tabela de Dano Adicional);
  - efeitos Meteoros (Katon, 9) e Kajousatsu (exclusivo, Nv 3, evolui no 6 e no 9).
- **Dano Adicional conferido nos 4 livros:** Fuuton, Katon, Raiton, Mokuton, Hibon, Kami Ninpou, Kujaku, Kibaku Nendo, Youton, Futton e Ranton já estavam certos; só faltava o Shakuton. O Satetsu (Jiton) dá +1 de dano, mas o app ainda não separa Satetsu de Sakin.
- **Corpo Esguio (Guia Avançado, pág. 25):** aptidão de combate que faltava (sair de agarrado com ação parcial e +2; +2 também contra algemas e cordas).
- **Eien no Mangekyou Sharingan:** conquistado na história, não comprado. Continua como aptidão, mas sem custo e sem usar uma das gratuitas.
- **Modo Eremita, Senjutsu Nv 2 (Guia Avançado, pág. 18–19):** Chakra +20 e Vitalidade +30 são bônus da lista de Senjutsu (1 ponto cada, 1×/cena, ação livre) e duram 1 cena. Antes o app dava o +20 sozinho ao entrar no modo. Agora são botões no estado; no fim da cena (ou na noite de descanso), o que ainda passar do máximo some.
- **Maximizar:** Jinton e Doton só aparecem para quem tem o hijutsu Jinton (o poder Jinton). O seletor usa o mesmo painel dos efeitos.
- **Golem do Mokuton (Livro Básico, efeito de nível 7):** etapa "Golem" no construtor (aparece com Mokuton), seção na ficha impressa e contador "Vitalidade do Golem" na mesa. Atributos iguais aos seus com Força = Espírito, +5 de Força e Vigor (imenso) ou +7 (colossal, Nv 10); metade da Vitalidade calculada com esse Vigor; combate igual ao seu; dano corporal comum do Mokuton.

## Pendências e decisões

- **Elementos Irrestritos + Mokuton:** em aberto se o nível grátis soma (Doton 2 e Suiton 2). O app não soma. Contexto e o que mudar: [pendencia-elementos-irrestritos.md](pendencia-elementos-irrestritos.md).

- **Chakra Bijuu:** entra somado ao chakra normal, não como reserva separada.
- **Versatilidades extras:** seguem o livro. Cada compra extra paga os níveis (com o nível 1 grátis, como no Ninpou comprado de novo). A planilha do Ashihira cobra só 2 pontos por compra extra (regra da casa); se a mesa usar isso, dá para virar uma regra opcional.
- **Onde a planilha do Ashihira diverge do livro (não copiar para o app):**
  - Resiliência tira 3 da Agilidade (o livro dá −3 só na Esquiva e em testes, mais −5m de deslocamento).
  - Corpulência soma +2 no Vigor (o livro dá +2 só nos testes de Vigor).
  - Byakugou no In tira 15% do chakra (o livro tira 15 pontos).

## Arquivos alterados

- `lib/rules.ts`:
  - Versatilidade, Talento Natural, pré-requisitos;
  - `derived()` (Resiliência, Rinnegan, Chakra Bijuu, compartimentos, dureza);
  - Reflexos/Intuição, testes sociais, validação, migração de fichas antigas.
- `lib/play.ts`: Corpulência, Velocista acelerado, bônus de Esquiva perdidos, dureza, pílulas.
- `lib/estados.ts`: Sensor, Kagura Shingan, alcance do Hakken, Modo Chou sem penalidades da Resiliência.
- `lib/ataques.ts`: grupos por poder versátil, Talento Natural, opções do Potencializar.
- `lib/data/base.ts`: tabela de nível shinobi.
- `lib/data/poderes.ts`: listas de efeitos exclusivos e de poderes versáteis.
- `lib/types.ts`:
  - `PowerEntry.versatile` e `PowerEntry.owner` (Versatilidade);
  - `PlayState.pills` (pílulas tomadas).
- Telas:
  - `StepPoderes` (editor da Versatilidade);
  - `StepAptidoes` (Talento Natural e tipo de Sensor);
  - `StepAtributos` (bônus automáticos e testes sociais);
  - `StepEquipamento` (limite de compartimentos);
  - `FichaSheet`;
  - mesa: `Ataques`, `Numeros`, `Lateral`.
