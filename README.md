# Shinobi no Sho · Criador de Ficha

Criador de fichas interativo para o RPG **Naruto: Shinobi no Sho 4.1b** (Sistema D8), feito com Next.js, Tailwind CSS e Motion.

- Pontos, limites e pré-requisitos calculados na hora, com validação por etapa.
- Clãs e hijutsus do Livro Básico, Livros de Hijutsus Vol. 1 e 2 e Guia Avançado do Shinobi (10 anos).
- **Regra da mesa: Nível de Campanha até 30.** Acima do NC 20 cada nível soma +6 atributos, +4 perícias e +2 poderes; o atributo mínimo continua subindo 1 a cada NC ímpar.
- **Pontos de poder extras:** NC 20, 24, 27 e 30 dão +4 pontos de poder além do normal (o do NC 20 é o bônus de Kage do livro).
- **Criação livre:** nada é travado. Pontos a mais, restritos de outro clã, pré-requisitos faltando etc. aparecem como observações.
- **Juuinka:** os 2 bônus do Ichi, os benefícios do Ni e o tipo de selo são escolhidos na etapa Aptidões e viram os bônus do selo na Mesa.
- Regras opcionais do Guia Avançado: 3 pontos de poder por NC, aptidões de habilidade banidas, Dano Extra automático; e a regra de 2+ hijutsus do Livro Básico.
- Fichas salvas no navegador (localStorage), exportação/importação em `.json` e impressão/PDF da ficha.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com, **Add New → Project** e importe o repositório.
3. A Vercel detecta Next.js sozinha; não há variáveis de ambiente. Clique em **Deploy**.

Ou pela CLI: `npx vercel` dentro da pasta.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Tabela de NC, limites, fórmulas e validação | `lib/rules.ts` |
| Atributos, perícias, itens rápidos | `lib/data/base.ts` |
| Aptidões (comuns e restritas) | `lib/data/aptidoes.ts` |
| Poderes e efeitos | `lib/data/poderes.ts` |
| Clãs e hijutsus | `lib/data/origens.ts` |
| Etapas do construtor | `components/builder/steps/` |

Ferramenta de fã, sem fins comerciais, baseada no material gratuito do Projeto D8. Naruto © Masashi Kishimoto / Shueisha.
