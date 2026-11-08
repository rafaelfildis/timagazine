# Deploy do TI MAGAZINE (Vercel + Neon)

Guia de operação: como publicar, onde ficam as variáveis, como criar o admin, como conferir e como
reverter. Segredos (URL do banco, `AUTH_SECRET`, token do Blob) ficam **só** no painel da Vercel e
no terminal de quem opera; nunca neste repositório, em issue ou em chat.

## 1. Peças

| Peça | Onde | Observação |
|---|---|---|
| Código | GitHub `rafaelfildis/timagazine`, branch `main` | Push na `main` = deploy de produção. Outras branches/PRs = deploy de Preview. |
| Hospedagem | Projeto na Vercel ligado a esse repositório | Framework detectado: Next.js. Build padrão (`npm run build`). |
| Banco | Neon, região **`sa-east-1` (São Paulo)** | Branch `main` = produção. Uma branch separada (ex.: `preview`) = Preview. |
| Imagens | Vercel Blob (store público ligado ao projeto) | Ligar o store ao projeto cria `BLOB_READ_WRITE_TOKEN` sozinho. |
| Node | `engines.node >= 22` no `package.json` | Em Project Settings → Build and Deployment, use Node 22.x ou 24.x. |

## 2. Variáveis de ambiente

Cadastre em Vercel → Project → Settings → Environment Variables, marcando o ambiente certo.
Na Vercel as variáveis valem no **build e no runtime**; o build precisa do banco (ver §3).

| Variável | Production | Preview | Desenvolvimento local (`.env.local`) |
|---|---|---|---|
| `DATABASE_URL` | URL da branch `main` do Neon (pooled, `?sslmode=require`) | URL da branch `preview` do Neon (**nunca** a de produção) | `pglite:./.data/dev` |
| `AUTH_SECRET` | Gerar com `npx auth secret --raw` (um valor só para produção) | Outro valor, gerado do mesmo jeito | `npx auth secret` (grava no `.env.local`) |
| `BLOB_READ_WRITE_TOKEN` | Criado ao ligar o Blob store | O mesmo store serve (ou um store só de Preview) | Vazio |
| `NEXT_PUBLIC_SITE_URL` | **Vazia no Plano 1** (usa o domínio de produção da Vercel). No Plano 5, ao assumir o domínio: `https://timagazine.com.br` | Vazia | Vazia (cai para `http://localhost:3100`) |
| `AUTH_TRUST_HOST` | **Não definir** (nem vazia) | **Não definir** | Não precisa |
| `ALLOW_LOCAL_UPLOADS` | **Não definir** | **Não definir** | `1` (imagens em `public/uploads`) |

Notas:

- **URL canônica.** Sem `NEXT_PUBLIC_SITE_URL`, o site usa `https://$NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`
  (variável de sistema da Vercel; deixe ligada a opção "Automatically expose System Environment
  Variables", que é o padrão). Se nenhuma das duas existir em produção, **o build falha de propósito**
  (`src/config/site.ts`) em vez de publicar canonical/sitemap/RSS apontando para localhost.
  Variáveis `NEXT_PUBLIC_*` são gravadas no build: depois de mudar, faça um novo deploy.
- **`AUTH_TRUST_HOST`.** Na Vercel o Auth.js detecta a plataforma e confia no host sozinho. Use
  `AUTH_TRUST_HOST=true` só se um dia o site rodar fora da Vercel, atrás de proxy/CDN. Definir a variável
  vazia na Vercel desliga a detecção e o `/admin` passa a responder erro (UntrustedHost).
- **Imagens.** Sem `BLOB_READ_WRITE_TOKEN` (e sem `ALLOW_LOCAL_UPLOADS=1`) o envio de imagens do painel
  responde 503 "Armazenamento de imagens não configurado." — o disco da Vercel é somente leitura.
- **Preview** usa banco separado: um PR nunca escreve na produção. Migre e crie o admin da branch
  `preview` do Neon do mesmo jeito que a produção (§3), apontando `DATABASE_URL` para ela.

## 3. Ordem do primeiro deploy (e de todo deploy com migração nova)

O `next build` **lê o banco** (Home, páginas institucionais, sitemap e RSS são pré-renderizados), então
o banco tem de existir e estar migrado **antes** do build. Ordem:

1. **Criar o banco** no Neon (projeto na região `sa-east-1`; branch `main`). Copie a connection string
   *pooled* e cole direto no painel da Vercel (`DATABASE_URL` de Production). Crie também a branch
   `preview` e cole a URL dela em `DATABASE_URL` de Preview.
2. **Migrar** a partir da sua máquina, com a URL só no terminal (o ambiente do processo vence o `.env.local`):

   ```powershell
   # PowerShell: a variável vale só nesta janela
   $env:DATABASE_URL = "<cole a URL do Neon aqui>"
   npm run db:migrate
   ```

   ```bash
   # Git Bash
   DATABASE_URL='<cole a URL do Neon aqui>' npm run db:migrate
   ```

   O script imprime `Banco de destino: <host>/<banco>` (sem usuário nem senha): confira que é o banco
   certo. As migrações incluem `drizzle/0002_bootstrap_data.sql`, que cria as 12 categorias, as 4
   páginas institucionais (texto inicial, editável no painel) e a configuração do WhatsApp (vazia). Ela
   é idempotente: rodar de novo não duplica nem sobrescreve o que a equipe editou.
3. **Criar o admin** (mesmo terminal, mesma `DATABASE_URL`):

   ```bash
   npm run create-admin -- --email pessoa@exemplo.com --name "Nome Sobrenome"
   ```

   O script mostra o banco de destino e só então pede a senha duas vezes, sem eco (mínimo 12
   caracteres; quem digita é a pessoa dona da conta). Para trocar a senha depois: acrescente
   `--reset-password`.
4. **Deploy**: push na `main` (ou "Redeploy" no painel). Aguarde o status `READY`.
5. **Conferir** com a lista do §5.

Regras do banco:

- **Nunca** use `drizzle-kit push` contra Neon: ele aplica o esquema sem migração versionada.
- **Nunca** regenere nem edite `drizzle/0000_init.sql`: ele foi ajustado à mão (extensão `unaccent`,
  função `f_unaccent` e a coluna gerada de busca) e já foi aplicado.
- Mudança de esquema: altere `src/lib/db/schema.ts`, rode `npm run db:generate` e revise o SQL gerado.
  Dados fixos: `npx drizzle-kit generate --custom --name <nome>` e escreva `INSERT ... ON CONFLICT DO NOTHING`.
- Migrações precisam ser **compatíveis com o código anterior** (acrescentar coluna/tabela, não renomear
  nem apagar na mesma leva): assim um rollback de deploy (§4) continua funcionando com o banco já migrado.
- **Nunca** rode `npm run db:seed` em produção: ele cria matérias FALSAS. O script exige `--posts N` e
  recusa qualquer banco que não seja PGlite local sem `--force`.

## 4. Reverter um deploy

1. Vercel → Project → **Deployments**.
2. Escolha o último deploy de produção bom (status `READY`), menu "⋯" → **Promote** (ou **Instant
   Rollback** na aba do deploy atual). O domínio passa a servir aquele deploy em segundos, sem build.
3. Corrija na `main`; o próximo push vira o novo deploy de produção. Depois de um Instant Rollback a
   Vercel pode desligar a promoção automática: confira em Deployments e promova o deploy novo quando estiver bom.

O rollback troca só o código. **O banco não volta junto**: por isso as migrações são aditivas (§3).
Para desfazer dados (ex.: apagaram uma matéria), use o restore do Neon (Branches → *Restore* para um
instante anterior, ou crie uma branch a partir de um ponto no tempo e copie os dados de lá).

## 5. Checklist de fumaça (depois de cada deploy de produção)

- [ ] Home abre (200), com logo, destaques e "Últimas notícias" (vazia até a primeira matéria).
- [ ] `/noticias` abre; filtros mudam a URL; "Limpar filtros" volta para `/noticias`.
- [ ] Uma matéria publicada abre em `/noticias/<slug>` (depois que houver matérias).
- [ ] `/sobre`, `/politica-editorial`, `/politica-de-privacidade` e `/termos-de-uso` mostram o texto.
- [ ] `/contato`: o formulário envia e a mensagem aparece em `/admin/mensagens`.
- [ ] `/feed.xml`, `/sitemap.xml` e `/robots.txt` usam a URL pública (não `localhost`).
- [ ] **Login no `/admin`** com o admin criado; o painel abre sem erro; "Sair" desloga.
- [ ] Em uma matéria rascunho, enviar uma imagem: a URL resultante é do Vercel Blob
      (`*.public.blob.vercel-storage.com`). Apague o rascunho de teste depois.
- [ ] Cabeçalhos: `curl -sI https://<site>/ | grep -iE "x-frame-options|content-security-policy|referrer-policy|x-content-type-options"`
      mostra `DENY`, `frame-ancestors 'none'`, `strict-origin-when-cross-origin` e `nosniff`.
- [ ] Automático (só leitura, não depende de dados): `BASE_URL=https://<site> npx playwright test tests/e2e/smoke.spec.ts`.
      Os demais specs de leitura (home, news, seo…) supõem o banco **semeado** (14 matérias de
      exemplo) e servem para um Preview com seed, não para a produção.

## 6. Referência rápida

| Tarefa | Comando |
|---|---|
| Migrar | `npm run db:migrate` (com `DATABASE_URL` do alvo no terminal) |
| Criar admin | `npm run create-admin -- --email ... --name "..."` |
| Trocar senha | `npm run create-admin -- --email ... --reset-password` |
| Dados de exemplo (só local) | `npm run db:migrate && npm run db:seed -- --posts 14` |
| Gerar segredo | `npx auth secret --raw` (só imprime; copie para o painel). Alternativa: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
