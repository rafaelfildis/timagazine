# TI MAGAZINE

Portal editorial de **Tecnologia • Inovação • Negócios**.

- Documento de design: [`docs/superpowers/specs/2026-11-07-ti-magazine-portal-design.md`](docs/superpowers/specs/2026-11-07-ti-magazine-portal-design.md)
- Planos de construção: `docs/superpowers/plans/`
- Catálogo de referências de UI: [`docs/referencias/ui-vault`](docs/referencias/ui-vault) (cópia de github.com/en970/ui-vault, licença MIT)

Chaves de API ficam nas variáveis de ambiente da Vercel — nunca neste repositório.

## Desenvolvimento

Next.js (App Router) + Tailwind v4 + TypeScript. Copie `.env.example` para `.env` e preencha os valores (nunca commite segredos).

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
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

Imagens: `POST /api/upload` (editor, mesma origem, jpeg/png/webp/avif até 5 MB, tipo conferido pelos bytes). Com `BLOB_READ_WRITE_TOKEN` envia ao Vercel Blob; sem ele grava em `public/uploads/` (ignorado pelo git) e a rota `/uploads/[name]` serve o arquivo. Nunca use o fallback local em produção.

E2E do painel: além do admin, `.env.test` aceita `E2E_EDITOR_EMAIL`/`E2E_EDITOR_PASSWORD` (editor de teste para o 403). Os specs que alteram o banco rodam no projeto `chromium-painel`, depois dos de leitura.

## Pendências

- Logo final em SVG/PNG transparente pendente: `public/brand/logo-horizontal.jpg` é provisório (JPG sobre fundo preto) e `simbolo-ti.png` foi recortado dele.
