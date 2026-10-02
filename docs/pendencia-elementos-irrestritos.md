# Pendência: Elementos Irrestritos soma com o nível grátis do Mokuton?

**Situação:** em aberto. O app segue o livro como está (não soma). Decidido em 02/10/2026: manter assim até haver resposta do criador do sistema ou decisão da mesa.

## A dúvida

Um Zetsu tem Mokuton e a aptidão Elementos Irrestritos. Os dois dão um nível grátis em elementos:

- **Mokuton** (Livro Básico, p.176): "O personagem recebe gratuitamente 1 nível em Doton e Suiton, e poderá utilizar o Efeito Canhão para Doton e Suiton usando o nível de Mokuton como parâmetro."
- **Elementos Irrestritos** (Livro de Hijutsus Vol.2, p.134): "A personagem recebe gratuitamente 1 Nível em todos os cinco elementos básicos e pode utilizar o efeito Canhão para qualquer dos elementos básicos usando o nível de Mokuton como nível efetivo da técnica."

Em Doton e Suiton, os dois benefícios caem no mesmo elemento. A pergunta: fica Doton 1 e Suiton 1 grátis, ou Doton 2 e Suiton 2?

## Os dois lados

**Não soma (o que o app faz hoje):**
- As duas regras usam a mesma frase ("recebe gratuitamente 1 nível"); nenhuma diz que acumula.
- Livro Básico, p.56–57 (Aptidões Cumulativas): "Aptidões iguais não se acumulam." e "Esta regra também é válida quando você recebe um benefício de aptidão gratuitamente (...) Quando uma aptidão tiver benefícios cumulativos, isso estará explicitamente escrito na sua descrição."
- Ressalva: essa regra fala de benefícios de **aptidão**, e o nível grátis do Mokuton vem de um **poder**. Ela indica a intenção do livro, mas não decide sozinha.

**Soma (pedido do jogador João Guilherme, 02/10/2026):**
- "Recebe gratuitamente 1 nível" seria +1 nível, não "o nível 1". Se o Mokuton já deu o primeiro nível, o Elementos Irrestritos dá mais um.
- Para ele, o livro distingue "o nível 1 é gratuito" (ex.: comprar o poder pela 2ª vez, Livro Básico p.95) de "recebe 1 nível" (um nível a mais).

## O que mudaria no app se a decisão for "soma"

Doton e Suiton ficam com 2 níveis grátis; Fuuton, Katon e Raiton continuam com 1. Pontos a mexer:

- `lib/rules.ts`, `kekkeiGratis`: hoje devolve `{ el, from, lvl }` com 1 nível por elemento. Precisaria de um campo com a quantidade de níveis grátis (`n`), somando Mokuton + Elementos Irrestritos em Doton e Suiton.
- `lib/rules.ts`, `nivelGratis` e `spent`: hoje a 1ª compra do elemento desconta 1 ponto. Passaria a descontar até `n` (Doton 2 comprado custaria 0).
- `lib/rules.ts`, `powerLevel`: sem compra, o elemento vale 1; passaria a valer `n`.
- Telas: `components/FichaSheet.tsx` (linha "Nível 1" dos elementos grátis e "nível 1 grátis" na compra) e `components/builder/steps/StepPoderes.tsx` (aviso "Elementos grátis" e o selo "nível 1 grátis pelo …").
- `lib/ataques.ts`: o grupo do elemento não comprado usa nível 1; passaria a usar `n`. O Canhão continua no nível de Mokuton.
- Registrar em `docs/mudancas-regras.md` (seção Elementos Irrestritos), como regra da mesa ou como regra confirmada pelo autor.
