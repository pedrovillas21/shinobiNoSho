# Configurar o Supabase

O site usa o Supabase para contas, fichas e salas. Tudo roda no mesmo deploy da Vercel; o Supabase é só o banco e o login.

## 1. Criar o projeto

1. Em [supabase.com](https://supabase.com), **New project**. Guarde a senha do banco: ela entra na `DATABASE_URL`, usada só no deploy para as migrações (o site em si nunca a usa).
2. Espere o projeto terminar de subir.

## 2. Criar as tabelas e regras

As tabelas são criadas **sozinhas a cada deploy**, pelas migrações automáticas (seção [Migrações automáticas](#migrações-automáticas), mais abaixo). Você só precisa cadastrar a `DATABASE_URL` na Vercel (passo 4).

Isso cria:

| Tabela | O que guarda | Quem acessa |
| --- | --- | --- |
| `profiles` | nome de usuário | só a própria conta |
| `characters` | as fichas | só o dono |
| `rooms` | salas e códigos | membros da sala; só o mestre apaga |
| `room_members` | quem está em cada sala, a ficha aberta agora + resumo de Vit/Chakra do balão | membros da sala; só jogador publica resumo |
| `room_characters` | cada ficha usada na sala, com vida, chakra, condições e histórico | só o dono da ficha |

E no **Storage**, o bucket `retratos`: a imagem de cada ficha, já reduzida no navegador (~110 KB no máximo). A ficha guarda só o endereço, então abrir a lista não baixa as imagens de novo; o navegador as mantém em cache. Cada conta só envia e apaga na própria pasta; o bucket é público para leitura, mas os nomes são aleatórios e só o dono da ficha conhece o endereço. Fichas com o retrato ainda dentro do JSON (de antes do Storage, ou importadas) têm a imagem movida sozinha quando o dono abre o site. O `.json` exportado continua com a imagem dentro.

O mestre pode pôr várias fichas dele na sala e trocar entre elas; o jogador fica com a que escolheu ao entrar. As fichas do mestre não aparecem para os jogadores.

Criar sala, entrar, pôr/tirar fichas do mestre, expulsar e gerar código novo passam por funções no banco que conferem quem está pedindo. Não existe forma de expulsar alguém sem ser o mestre, nem de ler a ficha de outra pessoa.

## 3. Ajustar o login

Em **Authentication → Sign In / Providers → Email**:

- Deixe **Enable Email provider** ligado.
- **Desligue "Confirm email"**. O login é por nome de usuário, então não há e-mail real para confirmar.
- Em **Authentication → Policies** (ou Password settings), coloque senha mínima de **8** caracteres.

A senha é guardada pelo Supabase Auth com hash (bcrypt); nem o dono do site consegue lê-la. A sessão fica em cookies que o JavaScript da página não acessa.

> O Supabase recusa domínios que não são públicos, como `.local`. Por isso o padrão é `shinobi-no-sho.app` (não é registrado por ninguém e nenhum e-mail é enviado). Contas ficam presas ao domínio com que foram criadas, então não troque depois que o grupo se cadastrar.

## 4. Variáveis de ambiente

Em **Project Settings → API** copie a **Project URL** e a chave **publishable** (ou **anon**).

- **Local:** copie `.env.example` para `.env.local` e preencha.
- **Vercel:** Project Settings → Environment Variables, as mesmas três variáveis, e faça um novo deploy.
- **Vercel, só em Production:** `DATABASE_URL` (Supabase → **Connect** → **Session pooler**, com a senha do banco). Marque como **Sensitive**. É ela que aplica as migrações no deploy.

Nunca use a chave `service_role`/secret no site.

## 5. Tempo real

A migração já coloca `room_members` na publicação `supabase_realtime`. Confira em **Database → Publications → supabase_realtime** se a tabela aparece marcada; é isso que faz o balão atualizar Vit/Chakra e expulsões na hora.

## Migrações automáticas

Funciona como o Flyway: cada arquivo em `supabase/migrations/` roda **uma vez**, em ordem, e fica registrado no banco (`app_migrations.schema_history`). O `npm run build` roda [`scripts/migrate.mjs`](scripts/migrate.mjs) antes do `next build`, então todo deploy de produção na Vercel já deixa o banco em dia.

**Para mudar o banco:** crie um arquivo novo com o próximo número, por exemplo `supabase/migrations/0003_inventario.sql`, faça commit e suba. Nunca edite um arquivo que já foi aplicado: o deploy falha com "mudou depois de aplicado". Para corrigir algo, crie outro script.

**O que acontece no deploy:**

| Situação | Resultado |
| --- | --- |
| Production com `DATABASE_URL` | aplica o que falta; se um script der erro, ele é desfeito por inteiro e o deploy falha (o site no ar continua o anterior) |
| Production sem `DATABASE_URL` | o deploy falha avisando que falta a variável |
| Preview (branches) | pula, para uma branch em teste não mexer no banco de produção. Com banco próprio para preview, defina `MIGRATE_ON_PREVIEW=1` |
| Build local (`npm run build`) | pula, a não ser que `DATABASE_URL` esteja exportada no terminal |
| `SKIP_MIGRATIONS=1` | pula sempre (emergência) |

Dois deploys ao mesmo tempo não migram juntos: um espera o outro (cadeado no Postgres).

**Já tinha colado os scripts no SQL Editor?** Na primeira execução o sistema vê que as tabelas já existem e só registra esses scripts (aparecem como `Baseline`), sem rodar de novo.

**Comandos locais** (leem a `DATABASE_URL` do `.env.local`):

```bash
npm run db:info
```

```bash
npm run db:migrate
```

```bash
npm run db:validate
```

**Certificado (opcional, recomendado):** a conexão é sempre criptografada. Para o script também conferir que está falando com o servidor certo do Supabase, baixe o certificado em **Database → Settings → SSL Configuration → Download certificate** e salve como `supabase/ca.crt` (não é segredo, pode ir para o git). Sem ele o script avisa no log e segue.

## Esqueci a senha de alguém

Como não há e-mail real, "Send password recovery" não chega a ninguém. Redefina pelo painel: **Authentication → Users**, encontre `usuario@shinobi-no-sho.app`, abra o menu da linha e defina uma senha nova para passar à pessoa.
