# TI MAGAZINE

Portal editorial de **Tecnologia • Inovação • Negócios**.

- Documento de design: [`docs/superpowers/specs/2026-11-07-ti-magazine-portal-design.md`](docs/superpowers/specs/2026-11-07-ti-magazine-portal-design.md)
- Planos de construção: `docs/superpowers/plans/`
- Catálogo de referências de UI: [`docs/referencias/ui-vault`](docs/referencias/ui-vault) (cópia de github.com/en970/ui-vault, licença MIT)

Chaves de API ficam nas variáveis de ambiente da Vercel — nunca neste repositório.

**Deploy e operação** (Neon + Vercel, variáveis por ambiente, migração, admin, rollback, checklist): [`docs/operacao/deploy.md`](docs/operacao/deploy.md).

## Desenvolvimento

Next.js (App Router) + Tailwind v4 + TypeScript. Copie `.env.example` para `.env.local` e preencha os valores (nunca commite segredos). Para imagens locais, acrescente `ALLOW_LOCAL_UPLOADS=1`.

Banco local (PGlite, `DATABASE_URL=pglite:./.data/dev`): `npm run db:migrate` cria o esquema e os dados mínimos (categorias, páginas institucionais, configurações); `npm run db:seed -- --posts 14` acrescenta matérias de exemplo (o seed recusa banco que não seja PGlite sem `--force`).

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run db:migrate` | Aplica as migrações de `drizzle/` (mostra o banco de destino, sem credenciais) |
| `npm run db:seed -- --posts N` | Matérias de exemplo (só dev) |
| `npm run create-admin -- --email ... --name "..."` | Cria um admin (senha pedida sem eco) |
| `npm run build` / `npm run start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes de ponta a ponta e acessibilidade (Playwright + axe; sobe o site na porta 3100, ou usa `BASE_URL`) |

Na primeira vez: `npx playwright install chromium`.

## Painel (/admin)

Regra de segurança: **toda página do painel e toda server action chama `requireRole(...)`** (de `src/lib/auth.ts`). O layout e o `proxy.ts` não bastam: o layout não reexecuta em navegações parciais e o proxy só confere o cookie.

Papéis: **editor** acessa Matérias, Destaques da Home e Mensagens; **admin** acessa também Páginas (institucional e políticas) e Configurações. Papel insuficiente responde 403.

Cache: toda mutação do painel chama `revalidatePath("/", "layout")` (ver `src/lib/posts/mutations.ts`), que renova o cabeçalho (botão do WhatsApp) e todas as páginas públicas.

Imagens: `POST /api/upload` (editor, mesma origem, jpeg/png/webp/avif até 5 MB, tipo conferido pelos bytes). Com `BLOB_READ_WRITE_TOKEN` envia ao Vercel Blob. Sem ele, só com `ALLOW_LOCAL_UPLOADS=1` (dev e e2e) grava em `public/uploads/` (ignorado pelo git) e a rota `/uploads/[name]` serve o arquivo; sem nenhum dos dois responde 503 "Armazenamento de imagens não configurado." Nunca defina `ALLOW_LOCAL_UPLOADS` na Vercel.

E2E do painel: além do admin, `.env.test` aceita `E2E_EDITOR_EMAIL`/`E2E_EDITOR_PASSWORD` (editor de teste para o 403). Os specs que alteram o banco rodam no projeto `chromium-painel`, depois dos de leitura.

## Pendências

- Logo final em SVG/PNG transparente pendente: `public/brand/logo-horizontal.jpg` é provisório (JPG sobre fundo preto) e `simbolo-ti.png` foi recortado dele.
