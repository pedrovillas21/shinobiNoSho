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

## Pendências e decisões

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
