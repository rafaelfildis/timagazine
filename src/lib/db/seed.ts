import { eq } from "drizzle-orm";
import { CATEGORIES, MODALITIES } from "@/config/taxonomy";
import type { Db } from "./client";
import { categories, homeHighlights, postTags, posts, tags } from "./schema";

/** Data-base fixa: os dados de exemplo são determinísticos (sem aleatoriedade). */
export const SEED_BASE_DATE = new Date("2026-11-01T12:00:00-03:00");
const HOUR = 3_600_000;

const TAGS = [
  { slug: "ia-generativa", name: "IA generativa" },
  { slug: "lgpd", name: "LGPD" },
  { slug: "nuvem", name: "Nuvem" },
  { slug: "governo-digital", name: "Governo digital" },
  { slug: "lideranca", name: "Liderança" },
  { slug: "automacao", name: "Automação" },
];

const TOPICS = [
  "Modelos de linguagem chegam ao atendimento corporativo",
  "Arquitetura multicloud ganha espaço nas grandes empresas",
  "Ataques de ransomware pressionam orçamentos de segurança",
  "Painéis de dados aceleram decisões na gestão pública",
  "Plataformas de baixo código mudam o ritmo das entregas",
  "Governança de TI entra na pauta dos conselhos",
  "Transformação digital exige mudança de cultura, não só de sistema",
  "Prefeituras adotam serviços digitais integrados",
  "Prontuário eletrônico avança nos hospitais regionais",
  "Startups de tecnologia buscam rodadas menores e mais focadas",
  "CIOs redesenham carreiras para reter talentos de TI",
  "Redes privadas 5G chegam à indústria",
];

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bodyFor(title: string, i: number) {
  return [
    `${title}. Este é um texto de exemplo para o portal TI MAGAZINE, usado em desenvolvimento e testes.`,
    "## Contexto",
    "Executivos de tecnologia vêm reavaliando prioridades diante de novas exigências de segurança, custo e produtividade. O tema aparece com frequência nas pautas de comitês e nas decisões de investimento.",
    "## O que muda na prática",
    `Equipes relatam ganhos de eficiência quando alinham tecnologia e processo. Em ${2 + (i % 5)} de cada 10 iniciativas de exemplo, o principal desafio citado é a integração com sistemas legados.`,
    "- Defina responsáveis e indicadores desde o início\n- Comece por um piloto de escopo reduzido\n- Documente as decisões e os aprendizados",
  ].join("\n\n");
}

/**
 * Dados de EXEMPLO (dev/testes): tags e `posts` matérias publicadas, de forma determinística
 * (dados fixos; o post i é publicado i*6h antes de SEED_BASE_DATE).
 *
 * Categorias, páginas institucionais e a chave `whatsapp_channel_url` NÃO são criadas aqui:
 * vêm da migração `drizzle/0002_bootstrap_data.sql` (as mesmas em dev, e2e e produção), por
 * isso o banco precisa estar migrado antes.
 *
 * Cobertura (índice i começa em 0; presente quando `posts` > i):
 * categoria = i % 12 e modalidade = i % 9; i=3 é opinião; i=4 é patrocinado; i=5 não tem
 * imagem; curadoria (com fonte) em i % 3 == 2. Não cria usuários (autor nulo =
 * "Redação TI MAGAZINE"). Os 5 primeiros posts viram os destaques da Home.
 * Pode ser executado de novo sem duplicar (usa `onConflictDoNothing`).
 */
export async function seed(db: Db, opts: { posts: number }) {
  const cats = await db.select().from(categories);
  if (cats.length < CATEGORIES.length) {
    throw new Error("Categorias ausentes: rode as migrações (npm run db:migrate) antes do seed.");
  }
  await db.insert(tags).values(TAGS).onConflictDoNothing();

  if (opts.posts <= 0) return;

  const tagRows = await db.select().from(tags);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  const values = Array.from({ length: opts.posts }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length];
    const modality = MODALITIES[i % MODALITIES.length];
    const round = Math.floor(i / TOPICS.length);
    const title = TOPICS[i % TOPICS.length] + (round > 0 ? ` (parte ${round + 1})` : "");
    const curadoria = i % 3 === 2;
    const hasImage = i !== 5;
    const publishedAt = new Date(SEED_BASE_DATE.getTime() - i * 6 * HOUR);
    return {
      slug: slugify(title),
      title,
      dek: `Linha fina de exemplo ${i + 1}: o que líderes de TI precisam saber sobre ${category.name.toLowerCase()}.`,
      body: bodyFor(title, i),
      categoryId: catId(category.slug),
      modality: modality.value,
      origin: curadoria ? ("curadoria" as const) : ("propria" as const),
      sponsored: i === 4,
      sourceName: curadoria ? "Agência Exemplo" : null,
      sourceUrl: curadoria ? "https://example.com/materia-original" : null,
      imageUrl: hasImage ? "/brand/capa-padrao.jpg" : null,
      imageAlt: hasImage ? `Imagem ilustrativa da matéria ${i + 1}` : null,
      imageAi: hasImage && i % 4 === 1,
      status: "published" as const,
      publishedAt,
      updatedAt: publishedAt,
      readingMinutes: 3 + (i % 6),
    };
  });

  const inserted = await db
    .insert(posts)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: posts.id, slug: posts.slug });
  const idBySlug = new Map(inserted.map((p) => [p.slug, p.id]));

  const links = values.flatMap((v, i) => {
    const postId = idBySlug.get(v.slug);
    if (!postId) return [];
    return [i % tagRows.length, (i + 2) % tagRows.length].map((t) => ({
      postId,
      tagId: tagRows[t].id,
    }));
  });
  if (links.length) await db.insert(postTags).values(links).onConflictDoNothing();

  const highlights = values.slice(0, 5).flatMap((v, i) => {
    const postId = idBySlug.get(v.slug);
    return postId ? [{ position: i + 1, postId }] : [];
  });
  if (highlights.length) await db.insert(homeHighlights).values(highlights).onConflictDoNothing();
}

/**
 * Insere um rascunho (`rascunho-de-exemplo`) e um post agendado (`agendada-de-exemplo`:
 * status published com publishedAt = amanhã em relação a `now`). Usado pelos testes e2e;
 * fica separado de `seed` para manter as contagens estáveis.
 */
export async function seedDraftAndScheduled(db: Db, now: Date = new Date()) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, CATEGORIES[0].slug));
  const common = {
    categoryId: cat.id,
    modality: "noticia" as const,
    origin: "propria" as const,
    dek: "Texto de exemplo.",
    body: "Texto de exemplo.\n\nSegundo parágrafo.",
    readingMinutes: 2,
  };
  await db
    .insert(posts)
    .values([
      { ...common, slug: "rascunho-de-exemplo", title: "Rascunho de exemplo", status: "draft" },
      {
        ...common,
        slug: "agendada-de-exemplo",
        title: "Matéria agendada de exemplo",
        status: "published",
        publishedAt: new Date(now.getTime() + 24 * HOUR),
      },
    ])
    .onConflictDoNothing();
}
