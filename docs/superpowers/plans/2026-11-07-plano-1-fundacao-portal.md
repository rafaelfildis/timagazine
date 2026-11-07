# Plano 1 — Fundação e portal de notícias

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar, na Vercel, o portal TI MAGAZINE com a identidade nova, a Home, as Notícias com busca e filtros, a página da matéria, as páginas institucionais e um painel mínimo em que o admin publica matérias à mão.

**Architecture:** Aplicação Next.js (App Router) renderizada no servidor, com banco PostgreSQL acessado por Drizzle. A busca usa o full-text do Postgres em português. O painel `/admin` é protegido por Auth.js com papéis `admin` e `editor`. Imagens e arquivos vão para o Vercel Blob. Cada push na `main` gera deploy automático.

**Tech Stack:** Next.js 16 · React 19 · TypeScript (strict) · Tailwind CSS v4 · Drizzle ORM · Neon Postgres (`@neondatabase/serverless`) · PGlite nos testes · Auth.js v5 · Vercel Blob · Zod · Vitest + Testing Library · Playwright + @axe-core/playwright · lucide-react (ícones de linha) · react-markdown + rehype-sanitize.

**Spec:** `docs/superpowers/specs/2026-11-07-ti-magazine-portal-design.md`

**Planos seguintes (fora deste):**
- Plano 2: curadoria com IA (coleta, reescrita, imagem e fila).
- Plano 3: Empresas, Eventos, Relatório e Academia.
- Plano 4: contas de leitor, newsletter e LGPD completa.
- Plano 5: migração das matérias antigas, redirecionamentos e domínio.

## Global Constraints

- Paleta: `--color-primary: #16E65C` · `--color-deep: #0B3320` · `--color-bg: #070A07` · `--color-text: #FFFFFF` · `--color-muted: #A7B0A5`. O verde vibrante aparece só em botões principais, links ativos, indicadores e detalhes.
- Fontes: Montserrat para títulos, manchetes e destaques; Inter para textos, menus e formulários. Carregar via `next/font/google` com `display: swap`.
- Tema escuro único. Todo efeito de movimento fica dentro de `@media (prefers-reduced-motion: no-preference)`.
- Contraste mínimo WCAG 2.2 AA. Testes com axe sem violações `critical` ou `serious`.
- Logo: usar o arquivo original. Não recriar com fonte, não distorcer, não recortar. Versão horizontal no cabeçalho e símbolo "TI" em espaços pequenos e no favicon.
- Textos fixos da Home:
  - Título: "Tecnologia, inovação e negócios para quem lidera a transformação."
  - Descrição: "Informação qualificada, tendências de mercado e as vozes de CIOs, líderes e especialistas em um só lugar."
  - Botões: "Assine no WhatsApp" e "Leia as últimas notícias".
- Proibido: alegações sem comprovação ("a principal revista do Brasil"), abertura obrigatória, áudio automático e download simulado.
- Idioma `pt-BR` em `<html lang>`, datas no formato `dd/MM/yyyy` com fuso `America/Bahia`.
- URLs públicas:

  | Rota | Página |
  |---|---|
  | `/` | Home |
  | `/noticias` | Notícias |
  | `/noticias/[slug]` | Matéria |
  | `/sobre` | Sobre |
  | `/contato` | Contato |
  | `/politica-de-privacidade` | Política de Privacidade |
  | `/termos-de-uso` | Termos de Uso |
  | `/politica-editorial` | Política Editorial e de Correções |

  O painel fica em `/admin` e o login do admin em `/admin/login`. A rota `/entrar` fica reservada para o leitor (Plano 4).
- Segredos só em variáveis de ambiente (`DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`). Nunca no repositório nem no chat. Criar `.env.example` com os nomes, sem valores.
- Categorias, nesta ordem, com slugs:

  | Categoria | Slug |
  |---|---|
  | Inteligência Artificial | `inteligencia-artificial` |
  | Cloud e Infraestrutura | `cloud-infraestrutura` |
  | Cibersegurança | `ciberseguranca` |
  | Dados e Analytics | `dados-analytics` |
  | Desenvolvimento e Software | `desenvolvimento-software` |
  | Gestão e Governança de TI | `gestao-governanca` |
  | Transformação Digital | `transformacao-digital` |
  | GovTech e Setor Público | `govtech-setor-publico` |
  | Tecnologia na Saúde | `tecnologia-saude` |
  | Startups e Negócios | `startups-negocios` |
  | Carreiras e Liderança | `carreiras-lideranca` |
  | Hardware e Conectividade | `hardware-conectividade` |

- Modalidades, com rótulo e valor:

  | Rótulo | Valor |
  |---|---|
  | Notícia | `noticia` |
  | Reportagem | `reportagem` |
  | Análise | `analise` |
  | Artigo de opinião | `opiniao` |
  | Entrevista | `entrevista` |
  | Tutorial | `tutorial` |
  | Review | `review` |
  | Vídeo | `video` |
  | Podcast | `podcast` |

- Origem da matéria: `curadoria`, com o rótulo "Curadoria", ou `propria`, com o rótulo "Apuração própria".
- Crédito de fonte (quando `origin = 'curadoria'`): no fim da matéria, a linha "Com informações de {sourceName}", com link para `sourceUrl`.
- Imagem gerada por IA (`imageAi = true`): legenda "Ilustração gerada por IA".
- Sem cookies de rastreamento neste plano. O único cookie é a sessão do painel, que é essencial. O banner de consentimento entra no Plano 4, junto com as contas de leitor.
- Itens do menu que pertencem a planos futuros (Empresas, Relatórios, Eventos, Academia) ficam **ocultos** até o plano deles ir ao ar. Use o flag em `src/config/nav.ts`; não crie páginas vazias.

## Review Focus

1. **Busca com acento ou caixa diferente:** "seguranca", "SEGURANÇA" e "segurança" encontram a mesma matéria. Teste no Task 4.
2. **Parâmetros inválidos na URL:** `?pagina=abc`, `?categoria=inexistente` ou `?de=2026-12-01&ate=2026-01-01` não podem gerar erro 500. A página ignora o parâmetro inválido e mostra o resto. Teste no Task 4.
3. **Rascunho, matéria agendada ou slug inexistente:** acessar direto pela URL dá 404 e a matéria não aparece em listagens, sitemap nem RSS. Teste no Task 4 e no Task 7.
4. **Home com poucas matérias:** com 0, 1 ou 3 publicadas, a Home não quebra. Destaques incompletos mostram só o que existe e, com zero, aparece um estado informativo. Teste no Task 6.
5. **Título muito longo ou matéria sem imagem:** o card não estoura o layout, o título corta em 3 linhas e entra uma imagem padrão da marca. Corpo com `<script>` ou `onerror=` sai sanitizado. Teste no Task 5.

---

## Estrutura de arquivos

```
src/
  app/
    layout.tsx                      # html lang, fontes, metadados base
    globals.css                     # tokens Tailwind v4 (@theme)
    (site)/layout.tsx               # Header + Footer + skip link
    (site)/page.tsx                 # Home
    (site)/noticias/page.tsx        # listagem com filtros
    (site)/noticias/[slug]/page.tsx # matéria
    (site)/sobre/page.tsx
    (site)/contato/page.tsx  + actions.ts
    (site)/[pagina]/page.tsx        # políticas (slug em ALLOWED_PAGES)
    not-found.tsx
    sitemap.ts  robots.ts  feed.xml/route.ts
    api/views/[id]/route.ts         # contador de leituras
    admin/login/page.tsx
    admin/(painel)/layout.tsx       # guarda de sessão
    admin/(painel)/page.tsx         # visão geral
    admin/(painel)/materias/...     # lista, nova, [id]
    admin/(painel)/destaques/page.tsx
    admin/(painel)/paginas/[slug]/page.tsx
    admin/(painel)/mensagens/page.tsx
    admin/(painel)/configuracoes/page.tsx
  config/nav.ts  config/taxonomy.ts  config/site.ts
  lib/db/schema.ts  lib/db/client.ts  lib/db/seed.ts  lib/db/test-db.ts
  lib/posts/filters.ts  lib/posts/queries.ts  lib/posts/mutations.ts
  lib/posts/reading-time.ts  lib/posts/slug.ts
  lib/markdown.tsx  lib/format.ts  lib/auth.ts  lib/settings.ts
  components/brand/  components/site/  components/posts/  components/admin/
public/brand/  (logo-horizontal.png|svg, simbolo-ti.png|svg, motion.mp4, og-default.png, capa-padrao.jpg)
tests/unit/  tests/e2e/
drizzle/ (migrações geradas)
```

---

### Task 1: Projeto, tokens da marca e qualidade

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/config/site.ts`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `public/brand/*`
- Test: `tests/unit/tokens.test.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces:
  - Classes Tailwind `bg-bg`, `bg-deep`, `text-primary`, `text-muted`, `font-display` (Montserrat), `font-sans` (Inter).
  - Superfícies `--color-surface: #0D130E`, `--color-surface-2: #121A13`, `--color-border: #1E2A20` **[Claude]**.
  - `siteConfig: { name: 'TI MAGAZINE'; tagline: 'Tecnologia • Inovação • Negócios'; url: string; editor?: string }` em `src/config/site.ts`. Sem `editor`, o rodapé omite a linha "Editor responsável".

- [ ] **Step 1:** Rodar `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` na raiz do repositório, sem apagar `docs/` e `README.md`. Adicionar os scripts `test` (vitest run), `test:e2e` (playwright test), `typecheck` (tsc --noEmit) e `db:generate` / `db:migrate` (drizzle-kit).
- [ ] **Step 2:** Copiar os arquivos da marca para `public/brand/`:
  - Logo horizontal: `logo-horizontal.*`. Se ainda não houver PNG transparente ou SVG, usar provisoriamente o JPG enviado (fundo preto) sobre o fundo `#000` do cabeçalho e registrar a pendência no README.
  - Motion: `motion.mp4`, vindo de `C:\Users\Bem Vindo\Downloads\TI Magazine - Motion da marca v4 (5s).mp4`.
  - Favicon: gerar a partir do símbolo "TI" (skill `favicon-gen`).
  - Capa padrão: `capa-padrao.jpg` (1600×900, fundo `#070A07` com onda de pontos verde e o símbolo "TI" ao centro), usada quando a matéria não tem imagem.
  - Imagem de compartilhamento: `og-default.png` (1200×630, logo horizontal centralizado).
- [ ] **Step 3: Write the failing test** `tests/unit/tokens.test.ts`: ler `src/app/globals.css` e verificar que contém `--color-primary: #16E65C`, `--color-deep: #0B3320`, `--color-bg: #070A07`, `--color-text: #FFFFFF` e `--color-muted: #A7B0A5`.
- [ ] **Step 4:** Run `npm test -- tokens`. Expected: FAIL.
- [ ] **Step 5:** Escrever o bloco `@theme` em `globals.css` com os tokens das Global Constraints e as superfícies. Em `layout.tsx`: `lang="pt-BR"`, Montserrat e Inter via `next/font/google` (variáveis `--font-display` e `--font-sans`) e `body` com `bg-bg text-text font-sans`.
- [ ] **Step 6:** Run `npm test -- tokens`. Expected: PASS.
- [ ] **Step 7: Write** `tests/e2e/smoke.spec.ts`: a página `/` responde 200, tem `html[lang="pt-BR"]` e o axe não encontra violações `critical` ou `serious`.
- [ ] **Step 8:** Run `npm run typecheck && npm test && npm run test:e2e`. Expected: tudo PASS.
- [ ] **Step 9: Commit** `chore: projeto Next.js com tokens da marca TI MAGAZINE`.

### Task 2: Banco de dados, taxonomia e dados de exemplo

**Files:**
- Create: `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `src/lib/db/test-db.ts`, `src/lib/db/seed.ts`, `src/config/taxonomy.ts`, `drizzle.config.ts`, `drizzle/0000_*.sql`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Produces:
  - **Tabela `users`:** `id` (uuid), `name`, `email` (unique), `passwordHash`, `role` (`'admin' | 'editor'`), `createdAt`.
  - **Tabela `categories`:** `id` (serial), `slug` (unique), `name`, `position`.
  - **Tabela `tags`:** `id`, `slug` (unique), `name`.
  - **Tabela `posts`:**
    - Identificação: `id` (uuid), `slug` (unique), `title`, `dek` (linha fina), `body` (markdown).
    - Classificação: `categoryId`, `modality` (enum das 9), `origin` (`'curadoria' | 'propria'`), `sponsored` (bool, default false).
    - Fonte: `sourceName` e `sourceUrl` (nullable).
    - Imagem: `imageUrl` (nullable), `imageAlt`, `imageAi` (bool).
    - Autoria e publicação: `authorId`, `status` (`'draft' | 'published'`), `publishedAt` (timestamptz, nullable), `updatedAt`.
    - Métricas e busca: `readingMinutes` (int), `views` (int, default 0) e `searchVector` (tsvector gerado).
  - **Tabela `post_tags`:** `postId`, `tagId`, com PK composta.
  - **Tabela `home_highlights`:** `position` (1–5, PK) e `postId`.
  - **Tabela `pages`:** `slug` (PK; `sobre`, `politica-de-privacidade`, `termos-de-uso` ou `politica-editorial`), `title`, `body`, `updatedAt`.
  - **Tabela `contact_messages`:** `id`, `name`, `email`, `subject` (`'pauta' | 'correcao' | 'imprensa' | 'parcerias' | 'outro'`), `message`, `consentAt`, `createdAt`, `readAt`.
  - **Tabela `settings`:** `key` (PK) e `value`. Chave inicial: `whatsapp_channel_url`.
  - **Exports de `taxonomy.ts`:** `CATEGORIES` (`readonly {slug, name}[]`, os 12 da lista), `MODALITIES` (`readonly {value, label}[]`, os 9) e `ORIGIN_LABEL`.
  - **Exports de `db`:**
    - `db` (Drizzle sobre Neon), em `client.ts`.
    - `createTestDb(): Promise<{ db; close(): Promise<void> }>` (PGlite com `unaccent` e as migrações aplicadas), em `test-db.ts`.
    - `seed(db, { posts: number })`, em `seed.ts`.

- [ ] **Step 1: Write the failing test** `tests/unit/schema.test.ts`, usando `createTestDb()` e `seed(db, { posts: 0 })`:
  - existem 12 categorias na ordem de `CATEGORIES`;
  - inserir dois posts com o mesmo `slug` lança erro;
  - `searchVector` de um post com título "Segurança em nuvem" bate com `plainto_tsquery('portuguese', f_unaccent('seguranca'))`.
- [ ] **Step 2:** Run `npm test -- schema`. Expected: FAIL.
- [ ] **Step 3:** Escrever o schema e a migração. A migração cria a extensão `unaccent` e a função imutável abaixo:

```sql
CREATE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;
```

  A coluna `search_vector` é gerada (pesos: título A, linha fina B, corpo C):

```sql
setweight(to_tsvector('portuguese', f_unaccent(coalesce(title,''))), 'A') ||
setweight(to_tsvector('portuguese', f_unaccent(coalesce(dek,''))), 'B') ||
setweight(to_tsvector('portuguese', f_unaccent(coalesce(body,''))), 'C')
```

  Criar índice GIN nessa coluna e índice em `(status, published_at desc)`.
- [ ] **Step 4:** O `seed` cria as categorias, as páginas institucionais com texto inicial, a chave `whatsapp_channel_url` vazia e N posts publicados com dados variados (todas as categorias e modalidades, um patrocinado, uma opinião, um de curadoria com fonte e um sem imagem).
- [ ] **Step 5:** Run `npm test -- schema`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: schema do banco, taxonomia e seed`.

### Task 3: Cabeçalho, rodapé e navegação

**Files:**
- Create: `src/config/nav.ts`, `src/components/brand/Logo.tsx`, `src/components/site/Header.tsx`, `src/components/site/MobileNav.tsx`, `src/components/site/Footer.tsx`, `src/components/site/WhatsAppButton.tsx`, `src/components/site/SearchBox.tsx`, `src/app/(site)/layout.tsx`, `src/lib/settings.ts`
- Test: `tests/unit/nav.test.ts`, `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `db` e a tabela `settings` (Task 2).
- Produces:
  - `NAV_ITEMS: readonly { label: string; href: string; enabled: boolean }[]`, na ordem Home, Notícias, Empresas, Relatórios, Eventos, Academia, Sobre, Contato.
    - `enabled: false` para Empresas (`/empresas`), Relatórios (`/relatorio`), Eventos (`/eventos`) e Academia (`/academia`).
  - `visibleNav(): NavItem[]`.
  - `getSetting(key: 'whatsapp_channel_url'): Promise<string | null>`.
  - `<WhatsAppButton variant="solid" | "outline" />`: sem URL configurada, **não renderiza**.
  - `<Logo variant="horizontal" | "symbol" />`.

- [ ] **Step 1: Write the failing test** `nav.test.ts`: `visibleNav().map(i => i.label)` é igual a `['Home','Notícias','Sobre','Contato']`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar `nav.ts`, o Header e os demais componentes:
  - **Header:**
    - Fixo (`sticky top-0`), com no máximo 72 px no desktop e 60 px no celular.
    - Logo horizontal, menu, ícone de busca (abre `SearchBox`, que envia para `/noticias?q=`), WhatsApp e "Entrar". "Entrar" fica oculto até o Plano 4: flag `ACCOUNT_ENABLED = false` em `nav.ts`.
    - Link ativo em `text-primary` com sublinhado.
  - **MobileNav:** abaixo de 1024 px. Botão com `aria-expanded` e `aria-controls`; fecha com Esc e prende o foco enquanto aberto.
  - **Footer:** logo, assinatura, links institucionais e políticas, e "Editor responsável" lido de `siteConfig`.
  - **Layout:** skip link "Pular para o conteúdo".
- [ ] **Step 4: Write** `navigation.spec.ts`:
  - **Viewport 375 px:** o menu abre e fecha pelo botão e pela tecla Esc, e o foco volta ao botão.
  - **Viewport 1440 px:** o link ativo tem `aria-current="page"`.
  - **WhatsApp:** com `whatsapp_channel_url` vazio, o botão "Assine no WhatsApp" não existe.
- [ ] **Step 5:** Run `npm test -- nav && npm run test:e2e -- navigation`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: cabeçalho, menu responsivo e rodapé`.

### Task 4: Consulta de matérias — filtros, busca e paginação

**Files:**
- Create: `src/lib/posts/filters.ts`, `src/lib/posts/queries.ts`
- Test: `tests/unit/filters.test.ts`, `tests/unit/queries.test.ts`

**Interfaces:**
- Consumes: o schema e `createTestDb` (Task 2).
- Produces:
  - **Tipo `PostFilters`:**
    - Busca e classificação: `q?: string`, `categoria?: string`, `modalidade?: Modality`, `autor?: string` (uuid), `tag?: string[]`.
    - Período: `de?: string` e `ate?: string` (ISO `yyyy-mm-dd`).
    - Ordem e página: `ordem: 'recentes' | 'antigas' | 'lidas' | 'relevancia'` e `pagina: number`.
  - **`parseFilters(sp: Record<string, string | string[] | undefined>): PostFilters`:**
    - nunca lança erro;
    - descarta valores inválidos;
    - `pagina` vale no mínimo 1;
    - com `de > ate`, troca os dois;
    - `ordem` padrão é `relevancia` se houver `q` e `recentes` se não houver;
    - `relevancia` sem `q` vira `recentes`.
  - **`filtersToSearchParams(f: PostFilters): URLSearchParams`:** omite os valores padrão.
  - **`listPosts(db, f: PostFilters, pageSize = 12): Promise<{ items: PostCard[]; total: number; page: number; pages: number }>`.**
  - **`getPostBySlug(db, slug): Promise<PostFull | null>`:** só publicados, com `publishedAt <= now()`.
  - **`getRelated(db, post, n = 3): Promise<PostCard[]>`.**
  - **Tipo `PostCard`:** `{ id, slug, title, dek, categoryName, categorySlug, modality, origin, sponsored, imageUrl, imageAlt, imageAi, publishedAt, readingMinutes }`.
  - **Tipo `PostFull`:** `PostCard` mais `{ body, authorName, updatedAt, sourceName, sourceUrl, tags: {slug, name}[] }`.

- [ ] **Step 1: Write the failing tests** em `filters.test.ts`:
  - `parseFilters({ pagina: 'abc' }).pagina === 1`;
  - `parseFilters({ categoria: 'inexistente' }).categoria === undefined`;
  - `parseFilters({ de: '2026-12-01', ate: '2026-01-01' })` resulta em `de: '2026-01-01'` e `ate: '2026-12-01'`;
  - `parseFilters({ q: 'nuvem' }).ordem === 'relevancia'`;
  - `parseFilters({ ordem: 'relevancia' }).ordem === 'recentes'`;
  - `parseFilters({ tag: ['ia', 'cloud'] }).tag` tem 2 itens;
  - `filtersToSearchParams(parseFilters({})).toString() === ''`;
  - ida e volta: `parseFilters(Object.fromEntries(filtersToSearchParams(f)))` é igual a `f` para um filtro completo.
- [ ] **Step 2: Write the failing tests** em `queries.test.ts`, com `createTestDb` e um seed controlado:
  - uma matéria com título "Segurança em nuvem" é encontrada por `q: 'seguranca'`, `q: 'SEGURANÇA'` e `q: 'segurança'`;
  - um rascunho e um post com `publishedAt` amanhã não aparecem em `listPosts` e `getPostBySlug` retorna `null` para eles;
  - categoria + modalidade + período combinados retornam só a interseção;
  - `ordem: 'lidas'` ordena por `views desc`;
  - 25 posts com `pageSize` 12 resultam em `pages === 3`, e a página 3 tem 1 item;
  - `pagina: 99` retorna `items: []` com `total` correto, sem erro.
- [ ] **Step 3:** Run `npm test -- filters queries`. Expected: FAIL.
- [ ] **Step 4:** Implementar `parseFilters` com Zod (`safeParse` campo a campo, validando `categoria` contra `CATEGORIES`) e `listPosts`:
  - **Busca:** `plainto_tsquery('portuguese', f_unaccent($q))` sobre `search_vector`.
  - **Relevância:** `ts_rank_cd`.
  - **Período:** `de` e `ate` inclusivos no fuso `America/Bahia`.
  - **Tags:** todas as tags pedidas precisam estar presentes (E).
- [ ] **Step 5:** Run. Expected: PASS.
- [ ] **Step 6: Commit** `feat: consultas de matérias com busca em português e filtros`.

### Task 5: Cards, matéria e renderização segura

**Files:**
- Create: `src/lib/posts/reading-time.ts`, `src/lib/posts/slug.ts`, `src/lib/format.ts`, `src/lib/markdown.tsx`, `src/components/posts/PostCard.tsx`, `src/components/posts/PostBadges.tsx`, `src/components/posts/SourceCredit.tsx`, `src/components/posts/ShareButtons.tsx`, `src/app/(site)/noticias/[slug]/page.tsx`, `src/app/api/views/[id]/route.ts`, `src/components/posts/ViewPing.tsx`
- Test: `tests/unit/reading-time.test.ts`, `tests/unit/slug.test.ts`, `tests/unit/markdown.test.tsx`, `tests/unit/post-card.test.tsx`, `tests/e2e/article.spec.ts`

**Interfaces:**
- Consumes: `getPostBySlug`, `getRelated` e os tipos `PostCard`/`PostFull` (Task 4).
- Produces:
  - `readingMinutes(markdown: string): number`: palavras ÷ 200, arredondado para cima, mínimo 1.
  - `slugify(title: string): string`: minúsculas, sem acento, hífens, máximo 80 caracteres, cortando em palavra inteira.
  - `formatDate(d: Date): string`: `dd/MM/yyyy` em `America/Bahia`.
  - `<Markdown source={string} />`: react-markdown + remark-gfm + rehype-sanitize (schema padrão) e links externos com `rel="noopener noreferrer"`.
  - `<PostCard post size="lg" | "md" | "sm" />`.
  - `POST /api/views/[id]`: incrementa `views` e responde 204. Não usa cookies; ignora requisições de bots pelo User-Agent.

- [ ] **Step 1: Write the failing tests:**
  - `readingMinutes('')` vale 1;
  - `readingMinutes` de 401 palavras vale 3;
  - `slugify('Cibersegurança: o que muda em 2026?')` vale `'ciberseguranca-o-que-muda-em-2026'`;
  - `<Markdown>` com `<script>alert(1)</script>` e `<img src=x onerror=alert(1)>` não gera `script` nem atributo `onerror` no HTML;
  - `<PostCard>` sem `imageUrl` usa `/brand/capa-padrao.jpg`;
  - título com 300 caracteres recebe a classe `line-clamp-3`;
  - `sponsored` mostra o selo "Patrocinado";
  - `modality === 'opiniao'` mostra o selo "Opinião".
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar as funções e os componentes.
  - **PostCard:**
    - Borda fina `border-border`, `rounded-xl`, imagem 16:9 via `next/image`.
    - Chapéu (categoria · modalidade), título em `font-display`, data e "N min de leitura".
    - Variante `lg` com título sobre a imagem e gradiente `from-bg/95` para garantir contraste.
  - **Página da matéria:** segue a §6.4 do spec, com os blocos nesta ordem:
    1. Chapéu, título, linha fina, autor, publicação e atualização, tempo de leitura e selos.
    2. Imagem grande com legenda: "Ilustração gerada por IA" se `imageAi`, senão `imageAlt`.
    3. Corpo.
    4. `SourceCredit` (só para curadoria).
    5. Tags com link para `/noticias?tag=`.
    6. Compartilhar (LinkedIn, WhatsApp, X, copiar link).
    7. 3 relacionadas.
  - **SEO da matéria:** `generateMetadata` com título, descrição (`dek`), canonical e Open Graph com a imagem; JSON-LD `NewsArticle` com `author` = Organization "TI MAGAZINE"; `notFound()` quando `getPostBySlug` retorna `null`.
- [ ] **Step 4: Write** `article.spec.ts`:
  - uma matéria de curadoria mostra "Com informações de" com link para a fonte;
  - um slug de rascunho dá 404;
  - a página tem um `script[type="application/ld+json"]` com `"@type":"NewsArticle"`;
  - o axe não encontra violações `critical` ou `serious`.
- [ ] **Step 5:** Run `npm test && npm run test:e2e -- article`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: página da matéria, cards e contador de leituras`.

### Task 6: Home

**Files:**
- Create: `src/app/(site)/page.tsx`, `src/lib/posts/home.ts`, `src/components/site/HeroGlobe.tsx`, `src/components/site/Hero.tsx`, `src/components/site/QuickLinks.tsx`, `src/components/posts/HighlightsGrid.tsx`, `src/components/posts/LatestPosts.tsx`
- Test: `tests/unit/home.test.ts`, `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `listPosts` e `PostCard` (Tasks 4 e 5), a tabela `home_highlights` e `getSetting`.
- Produces:
  - `getHomeData(db): Promise<{ highlights: PostCard[]; latest: PostCard[] }>`.
  - `highlights`: as posições 1–5 de `home_highlights`, ignorando posts não publicados. As vagas que sobrarem são preenchidas com as mais recentes, sem repetir. O resultado tem no máximo 5 itens.
  - `latest`: 9 itens, excluindo os destaques.

- [ ] **Step 1: Write the failing tests** em `home.test.ts`:
  - com 0 posts, `highlights` fica vazio;
  - com 3 posts e nenhum destaque manual, `highlights` tem os 3 mais recentes;
  - com o destaque manual de posição 1 apontando para um post antigo, ele vem primeiro;
  - um destaque manual que aponta para um rascunho é ignorado;
  - `latest` nunca contém itens de `highlights`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar a Home, nesta ordem:
  - **Hero compacto:** no máximo 70vh no desktop, com os textos fixos das Global Constraints. O botão "Leia as últimas notícias" leva a `/noticias`.
    - O `HeroGlobe` é um SVG/Canvas leve de pontos formando um globo verde, que gira só com `prefers-reduced-motion: no-preference` e tem `aria-hidden`. Sem bibliotecas 3D, com orçamento de 30 KB.
  - **QuickLinks:** 4 atalhos com ícones lucide:
    - Notícias diárias → `/noticias`;
    - Relatório Oficial de TI, Mural de Empresas, Eventos e CIO Talks → só aparecem quando o item de nav correspondente tiver `enabled: true`.
  - **HighlightsGrid:** 1 grande + 4 secundárias, com o link "Ver todas as notícias". Com zero itens, mostra o estado "As primeiras matérias estão a caminho."
  - **LatestPosts:** filtros rápidos por categoria (chips que levam a `/noticias?categoria=`) e o botão "Carregar mais", que leva a `/noticias?pagina=2`.
  - **Faixa final:** chamada para o Canal do WhatsApp, só se a URL estiver configurada.
  - **Seções futuras:** as seções dos planos 3 e 4 (Empresas, Eventos, Academia, CIO Talks, Relatório, Newsletter) não são renderizadas neste plano.
- [ ] **Step 4: Write** `home.spec.ts`:
  - **Viewport 1440×900:** o primeiro card de destaque fica visível sem rolar (o hero é compacto) e há exatamente um `h1`.
  - **Viewport 375 px:** não há rolagem horizontal (`scrollWidth <= innerWidth`).
  - **Movimento reduzido:** com `reducedMotion: 'reduce'`, o globo não anima (`animation-name: none` ou nenhum `requestAnimationFrame` ativo).
  - **Acessibilidade:** o axe não encontra violações `critical` ou `serious`.
- [ ] **Step 5:** Run. Expected: PASS.
- [ ] **Step 6: Commit** `feat: home com destaques, últimas notícias e globo`.

### Task 7: Página de Notícias, SEO global e 404

**Files:**
- Create: `src/app/(site)/noticias/page.tsx`, `src/components/posts/FilterBar.tsx`, `src/components/posts/Pagination.tsx`, `src/components/posts/ResultsState.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/feed.xml/route.ts`, `src/app/not-found.tsx`
- Test: `tests/e2e/news.spec.ts`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `parseFilters`, `filtersToSearchParams` e `listPosts` (Task 4), `PostCard` (Task 5).

- [ ] **Step 1: Write** `news.spec.ts`:
  - **URL dos filtros:** escolher a categoria "Cibersegurança" e a modalidade "Análise" muda a URL para conter `categoria=ciberseguranca&modalidade=analise`. A contagem "N resultados" corresponde ao seed.
  - **Voltar à listagem:** abrir uma matéria e usar o voltar do navegador mantém os filtros e a página.
  - **Limpar filtros:** leva de volta a `/noticias`.
  - **Busca sem resultado:** `q=zzzzz` mostra o estado vazio com uma sugestão de limpar os filtros.
  - **Página inexistente:** `?pagina=99` mostra o estado vazio, sem erro.
  - **Parâmetro inválido:** `?pagina=abc` responde 200.
  - **Acessibilidade:** o axe não encontra violações `critical` ou `serious`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar a página de Notícias:
  - **Renderização:** server component lê `searchParams` e passa por `parseFilters`.
  - **FilterBar:** client component com `useRouter().replace` + `filtersToSearchParams`. Campos:
    - busca com debounce de 300 ms;
    - categoria e modalidade em `select`;
    - autor;
    - tags com multiseleção;
    - período "de" e "até";
    - ordenação ("Mais recentes", "Mais antigas", "Mais lidas" e, se houver busca, "Relevância").
  - **Estado de carregamento:** `loading.tsx` com skeleton.
  - **Estado de erro:** `error.tsx` com o botão "Tentar novamente".
  - **Paginação:** acessível, com `nav aria-label="Paginação"`.
- [ ] **Step 4:** Implementar o SEO global:
  - **sitemap:** home, `/noticias`, as matérias publicadas e as páginas institucionais.
  - **robots:** bloqueia `/admin` e `/api`.
  - **feed.xml:** RSS 2.0 com as 30 últimas matérias publicadas.
  - **not-found:** com link para a Home e para Notícias.
- [ ] **Step 5: Write** `seo.spec.ts`:
  - `/sitemap.xml` não contém o slug do rascunho;
  - `/feed.xml` é um XML válido com no máximo 30 `item`;
  - `/rota-que-nao-existe` responde 404 com o texto da página de erro.
- [ ] **Step 6:** Run. Expected: PASS.
- [ ] **Step 7: Commit** `feat: notícias com filtros na URL, sitemap, RSS e 404`.

### Task 8: Sobre, Contato e políticas

**Files:**
- Create: `src/app/(site)/sobre/page.tsx`, `src/app/(site)/contato/page.tsx`, `src/app/(site)/contato/actions.ts`, `src/app/(site)/[pagina]/page.tsx`, `src/components/site/BrandVideo.tsx`
- Test: `tests/unit/contact.test.ts`, `tests/e2e/institutional.spec.ts`

**Interfaces:**
- Consumes: as tabelas `pages` e `contact_messages` (Task 2) e `<Markdown>` (Task 5).
- Produces:
  - `submitContact(prev, formData): Promise<{ ok: boolean; errors?: Record<string,string> }>`, uma server action com validação Zod:
    - nome com 2 a 120 caracteres;
    - e-mail válido;
    - assunto no enum;
    - mensagem com 10 a 5000 caracteres;
    - `consent` obrigatório.
  - Um campo honeypot `website` preenchido resulta em `ok: true` sem gravar nada.
  - Limite de 5 envios por IP por hora (contados na tabela).

- [ ] **Step 1: Write the failing tests** em `contact.test.ts`:
  - sem `consent`, o resultado é `ok: false` com `errors.consent`;
  - um e-mail inválido resulta em `errors.email`;
  - com o honeypot preenchido, nada é gravado;
  - um envio válido grava 1 linha com `consentAt` preenchido;
  - o 6º envio do mesmo IP na mesma hora resulta em `ok: false`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar as páginas:
  - **Contato:** formulário com `useActionState` e mensagens de erro ligadas aos campos via `aria-describedby`.
  - **Sobre:** texto da tabela `pages` + `BrandVideo`. O vídeo usa `<video>` com `controls`, `preload="none"` e um poster extraído do último quadro. Não tem `autoplay` nem som automático.
  - **Políticas:** a rota `[pagina]` aceita só os slugs `politica-de-privacidade`, `termos-de-uso` e `politica-editorial`. Qualquer outro slug dá `notFound()`.
  - **Texto inicial da Política Editorial** (no seed): explica a coleta em fontes, o uso de IA no texto e na imagem, a aprovação humana obrigatória, o crédito às fontes e como pedir correção pelo Contato (assunto "correção").
- [ ] **Step 4: Write** `institutional.spec.ts`:
  - o vídeo da Sobre não está tocando ao carregar (`paused === true`);
  - um envio do Contato válido mostra a confirmação;
  - `/politica-editorial` responde 200;
  - `/qualquer-coisa` responde 404.
- [ ] **Step 5:** Run. Expected: PASS.
- [ ] **Step 6: Commit** `feat: sobre, contato e políticas`.

### Task 9: Login do painel e papéis

**Files:**
- Create: `src/lib/auth.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/(painel)/layout.tsx`, `src/app/admin/(painel)/page.tsx`, `scripts/create-admin.ts`, `middleware.ts`
- Test: `tests/unit/auth.test.ts`, `tests/e2e/admin-auth.spec.ts`

**Interfaces:**
- Consumes: a tabela `users` (Task 2).
- Produces:
  - `auth()`, `signIn` e `signOut` do Auth.js v5, com o provider Credentials, hash `argon2id` (`@node-rs/argon2`) e sessão JWT de 8 horas.
  - `verifyCredentials(db, email: string, password: string): Promise<User | null>` (aplica o limite de tentativas) e `hasRole(userRole: Role, required: Role): boolean`.
  - `requireRole(role: 'editor' | 'admin'): Promise<Session>`: redireciona para `/admin/login` sem sessão e responde 403 quando o papel não basta (`admin` inclui `editor`).
  - `npm run create-admin -- --email X --name Y` pede a senha no terminal, sem eco, e cria um usuário `admin`.
  - Limite de 5 tentativas de login por e-mail a cada 15 minutos.

- [ ] **Step 1: Write the failing tests** em `auth.test.ts`:
  - `verifyCredentials` com a senha certa retorna o usuário e com a errada retorna `null`;
  - a 6ª tentativa errada em 15 minutos retorna `null` mesmo com a senha certa;
  - `hasRole('editor', 'admin') === false` e `hasRole('admin', 'editor') === true`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar a autenticação:
  - o `middleware.ts` protege `/admin/:path*`, exceto `/admin/login`;
  - o layout do painel tem menu lateral: Visão geral, Matérias, Destaques da Home, Páginas, Mensagens e Configurações;
  - a visão geral mostra os contadores de publicadas, rascunhos e mensagens não lidas, e as 5 mais lidas.
- [ ] **Step 4: Write** `admin-auth.spec.ts`:
  - `/admin` sem login redireciona para `/admin/login`;
  - o login com o usuário de teste do seed (credenciais só em `.env.test`, nunca commitadas) entra no painel;
  - o logout volta ao login.
- [ ] **Step 5:** Run. Expected: PASS.
- [ ] **Step 6: Commit** `feat: login do painel com papéis admin e editor`.

### Task 10: Painel — matérias, destaques, páginas, mensagens e configurações

**Files:**
- Create: `src/lib/posts/mutations.ts`, `src/app/admin/(painel)/materias/page.tsx`, `src/app/admin/(painel)/materias/nova/page.tsx`, `src/app/admin/(painel)/materias/[id]/page.tsx`, `src/components/admin/PostForm.tsx`, `src/components/admin/ImageUpload.tsx`, `src/app/admin/(painel)/destaques/page.tsx`, `src/app/admin/(painel)/paginas/[slug]/page.tsx`, `src/app/admin/(painel)/mensagens/page.tsx`, `src/app/admin/(painel)/configuracoes/page.tsx`, `src/app/api/upload/route.ts`
- Test: `tests/unit/mutations.test.ts`, `tests/e2e/admin-publish.spec.ts`

**Interfaces:**
- Consumes: `requireRole` (Task 9), `slugify` e `readingMinutes` (Task 5), `createTestDb` (Task 2).
- Produces:
  - **`PostInput`** (schema Zod em `mutations.ts`): `{ id?, title, dek, slug?, body, categoryId, modality, origin, sourceName?, sourceUrl?, sponsored, imageUrl?, imageAlt?, imageAi, tagNames: string[], status, publishedAt? }`.
  - **`savePost(db, input: PostInput, userId): Promise<{ id: string; slug: string }>`:**
    - gera o slug a partir do título se não vier preenchido e garante que seja único com sufixo `-2`, `-3`…;
    - recalcula `readingMinutes`;
    - atualiza `updatedAt`;
    - ao publicar sem `publishedAt`, usa `now()`;
    - aceita `publishedAt` futuro, que fica agendado.
  - **`setHighlights(db, ids: (string | null)[5])`.**
  - **`savePage(db, slug, { title, body })`.**
  - **`setSetting(db, key, value)`:** `whatsapp_channel_url` precisa ser uma URL `https://whatsapp.com/channel/...` ou ficar vazio.
  - **Validação de `PostInput`:** só permite `origin='curadoria'` com `sourceName` e `sourceUrl` preenchidos.
  - **`POST /api/upload`** (exige papel `editor`): aceita jpeg, png, webp e avif até 5 MB, envia ao Vercel Blob e devolve `{ url }`.
  - **Após cada mutação:** `revalidatePath('/')`, `revalidatePath('/noticias')` e o caminho da matéria.

- [ ] **Step 1: Write the failing tests** em `mutations.test.ts`:
  - dois posts com o título "Teste" ficam com os slugs `teste` e `teste-2`;
  - um post publicado sem data recebe `publishedAt` preenchido;
  - um post de curadoria sem `sourceUrl` é rejeitado;
  - `setHighlights` com um id inexistente é rejeitado;
  - `setSetting('whatsapp_channel_url', 'https://exemplo.com')` é rejeitado.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar as telas:
  - **Lista de matérias:** filtro por status, busca por título e paginação.
  - **PostForm:**
    - Texto: título, linha fina, slug editável e corpo em markdown com aba de pré-visualização (`<Markdown>`).
    - Classificação: categoria, modalidade, tags (criar na hora), origem e, se for curadoria, fonte e URL; patrocinado.
    - Imagem: upload, alt obrigatório quando há imagem e a opção "imagem gerada por IA".
    - Publicação: status e data de publicação.
    - Botões: "Salvar rascunho", "Publicar" e "Ver no site".
  - **Destaques da Home:** 5 posições com busca de matéria publicada.
  - **Páginas:** edição de Sobre e das 3 políticas.
  - **Mensagens:** lista; ao abrir, marca como lida.
  - **Configurações:** URL do Canal do WhatsApp.
- [ ] **Step 4: Write** `admin-publish.spec.ts`:
  1. Logar e criar uma matéria com imagem.
  2. Publicar e confirmar que ela aparece em `/noticias` e na Home.
  3. Mudar para rascunho e confirmar que a URL dá 404.
  4. Definir a URL do WhatsApp e confirmar que o botão aparece no cabeçalho.
- [ ] **Step 5:** Run `npm test && npm run test:e2e`. Expected: tudo PASS.
- [ ] **Step 6: Commit** `feat: painel para publicar matérias, destaques, páginas e configurações`.

### Task 11: Publicação na Vercel

**Files:**
- Create: `vercel.json` (só se precisar), `docs/operacao/deploy.md`
- Modify: `README.md`

- [ ] **Step 1:** Criar o banco Neon (região `sa-east-1`) e o projeto na Vercel ligado ao repositório `rafaelfildis/timagazine`, branch `main`, com o Blob store. **O usuário cola as chaves direto no painel da Vercel.** Variáveis: `DATABASE_URL`, `AUTH_SECRET` (gerar com `npx auth secret`) e `BLOB_READ_WRITE_TOKEN`.
- [ ] **Step 2:** Rodar `npm run db:migrate` contra o banco de produção e `npm run create-admin` com o e-mail do usuário. A senha é digitada pelo usuário.
- [ ] **Step 3:** Fazer push na `main` e confirmar que o deploy terminou como `READY`. Abrir a URL `*.vercel.app` e verificar Home, Notícias, uma matéria, Sobre, Contato e o login do painel.
- [ ] **Step 4:** Rodar `npx playwright test` com `BASE_URL` apontando para a URL de produção, só com os testes de leitura (smoke, navigation, home, news, seo). Expected: PASS.
- [ ] **Step 5:** Documentar em `docs/operacao/deploy.md` como fazer deploy, onde ficam as variáveis, como criar admin e como reverter um deploy. O domínio timagazine.com.br **não** é trocado neste plano (Plano 5).
- [ ] **Step 6: Commit** `docs: operação de deploy na Vercel`.
