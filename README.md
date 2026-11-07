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

## Pendências

- Logo final em SVG/PNG transparente pendente: `public/brand/logo-horizontal.jpg` é provisório (JPG sobre fundo preto) e `simbolo-ti.png` foi recortado dele.
