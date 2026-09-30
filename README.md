# Shinobi no Sho · Fichas & Mesa

Criador de fichas e mesa em grupo para o RPG **Naruto: Shinobi no Sho 4.1b** (Sistema D8), feito com Next.js, Tailwind CSS, Motion e Supabase.

- **Contas:** registro com nome de usuário e senha; cada jogador tem as próprias fichas.
- **Salas:** qualquer um cria uma sala e recebe um código de 6 letras. Quem entra escolhe a ficha; a mesa (vida, chakra, condições, turnos) só existe dentro da sala e é salva por sala. O combate é da sala: só o mestre inicia, passa o turno e encerra, e as fichas de todos acompanham ao vivo.
- **Mestre com várias fichas:** o criador da sala (ADM) põe quantas fichas dele quiser na sala (NPCs, inimigos) e troca entre elas com um toque na faixa do topo da mesa. Jogadores ficam com uma ficha só.
- **Balão de jogadores:** bolinha no canto que dá para arrastar para qualquer canto da tela; um toque abre um cartão com quem está na sala, Vit/Chakra ao vivo e quem está online. O ADM pode expulsar; os outros só veem.

- Pontos, limites e pré-requisitos calculados na hora, com validação por etapa.
- Clãs e hijutsus do Livro Básico, Livros de Hijutsus Vol. 1 e 2 e Guia Avançado do Shinobi (10 anos).
- **Regra da mesa: Nível de Campanha até 30.** Acima do NC 20 cada nível soma +6 atributos, +4 perícias e +2 poderes; o atributo mínimo continua subindo 1 a cada NC ímpar.
- **Pontos de poder extras:** NC 20, 24, 27 e 30 dão +4 pontos de poder além do normal (o do NC 20 é o bônus de Kage do livro).
- **Criação livre:** nada é travado. Pontos a mais, restritos de outro clã, pré-requisitos faltando etc. aparecem como observações.
- **Juuinka:** os 2 bônus do Ichi, os benefícios do Ni e o tipo de selo são escolhidos na etapa Aptidões e viram os bônus do selo na Mesa.
- Regras opcionais do Guia Avançado: 3 pontos de poder por NC, aptidões de habilidade banidas, Dano Extra automático; e a regra de 2+ hijutsus do Livro Básico.
- Fichas salvas na conta (Supabase), exportação/importação em `.json` e impressão/PDF da ficha. Fichas da versão antiga, que ficavam no navegador, podem ser enviadas para a conta pelo aviso da tela inicial.

## Rodar localmente

Antes, configure o Supabase seguindo [SUPABASE.md](SUPABASE.md) e crie o `.env.local` a partir de `.env.example`.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com, **Add New → Project** e importe o repositório.
3. A Vercel detecta Next.js sozinha. Em **Environment Variables**, cadastre as variáveis de `.env.example` (a `DATABASE_URL` só em Production) e clique em **Deploy**. O build aplica as migrações do banco antes de compilar.

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
| Tabelas, regras de acesso e funções das salas | `supabase/migrations/` (um arquivo novo por mudança) |
| Migrações automáticas no build (estilo Flyway) | `scripts/migrate.mjs` |
| Fichas na conta | `lib/store.ts` |
| Estado de jogo por sala | `lib/sala.ts` |
| Sala, balão de jogadores e escolha de ficha | `components/sala/` |
| Login e sessão | `app/entrar/`, `proxy.ts`, `lib/supabase/` |

Ferramenta de fã, sem fins comerciais, baseada no material gratuito do Projeto D8. Naruto © Masashi Kishimoto / Shueisha.
