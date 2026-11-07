import { eq } from "drizzle-orm";
import { CATEGORIES, MODALITIES } from "@/config/taxonomy";
import type { Db } from "./client";
import {
  categories,
  homeHighlights,
  pages,
  postTags,
  posts,
  settings,
  tags,
} from "./schema";

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

const PAGES = [
  {
    slug: "sobre" as const,
    title: "Sobre a TI MAGAZINE",
    body: "A TI MAGAZINE é um portal de notícias sobre tecnologia, inovação e negócios, voltado a quem lidera a transformação nas organizações.\n\nPublicamos reportagens, análises, entrevistas e conteúdos de curadoria, sempre identificando a origem de cada matéria.\n\nTexto inicial: a equipe editorial deve revisar e complementar esta página.",
  },
  {
    slug: "politica-de-privacidade" as const,
    title: "Política de Privacidade",
    body: "Esta política explica como a TI MAGAZINE trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).\n\n## Dados que coletamos\n\nColetamos apenas os dados que você nos envia, como nome, e-mail e mensagem no formulário de contato. O portal não usa cookies de rastreamento; o único cookie é o de sessão do painel administrativo, essencial ao funcionamento.\n\n## Seus direitos\n\nVocê pode solicitar acesso, correção ou exclusão dos seus dados pelo formulário de contato.\n\nTexto inicial: revisar com o responsável jurídico antes da publicação definitiva.",
  },
  {
    slug: "termos-de-uso" as const,
    title: "Termos de Uso",
    body: "Ao acessar o portal TI MAGAZINE você concorda com estes termos.\n\n## Uso do conteúdo\n\nO conteúdo publicado é protegido por direitos autorais. A reprodução parcial é permitida com citação da fonte e link para a matéria original.\n\n## Responsabilidade\n\nEmpenhamo-nos em manter as informações corretas e atualizadas, mas não garantimos que estejam isentas de erros.\n\nTexto inicial: revisar com o responsável jurídico antes da publicação definitiva.",
  },
  {
    slug: "politica-editorial" as const,
    title: "Política Editorial e de Correções",
    body: 'Esta política explica como o conteúdo da TI MAGAZINE é produzido, revisado e corrigido.\n\n## Coleta em fontes\n\nAs matérias partem de fontes identificáveis: comunicados oficiais, documentos públicos, estudos, entrevistas e publicações de veículos e instituições. Cada matéria informa se é apuração própria ou curadoria. Nas curadorias, o crédito da fonte aparece no fim do texto ("Com informações de ..."), com link para o original.\n\n## Uso de inteligência artificial\n\nUsamos inteligência artificial como ferramenta de apoio na redação dos textos e na criação de imagens. Ilustrações geradas por IA recebem a legenda "Ilustração gerada por IA". A IA não publica nada sozinha.\n\n## Aprovação humana obrigatória\n\nToda matéria é revisada e aprovada por uma pessoa da equipe editorial antes de ser publicada. A responsabilidade pelo conteúdo é sempre humana.\n\n## Conteúdo patrocinado e opinião\n\nConteúdo patrocinado é sempre identificado como tal. Artigos de opinião refletem a visão de quem assina.\n\n## Como pedir uma correção\n\nViu um erro? Fale com a redação pela página de [Contato](/contato), escolhendo o assunto "Correção" e indicando a matéria e o trecho. Correções relevantes são registradas na própria matéria.\n\nTexto inicial: a equipe editorial deve revisar e complementar esta página.',
  },
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
 * Cria categorias, tags, páginas institucionais, a chave `whatsapp_channel_url` (vazia)
 * e `posts` matérias publicadas, de forma determinística (dados fixos; o post i é
 * publicado i*6h antes de SEED_BASE_DATE).
 *
 * Cobertura (índice i começa em 0; presente quando `posts` > i):
 * categoria = i % 12 e modalidade = i % 9; i=3 é opinião; i=4 é patrocinado; i=5 não tem
 * imagem; curadoria (com fonte) em i % 3 == 2. Não cria usuários (autor nulo =
 * "Redação TI MAGAZINE"). Os 5 primeiros posts viram os destaques da Home.
 * Pode ser executado de novo sem duplicar (usa `onConflictDoNothing`).
 */
export async function seed(db: Db, opts: { posts: number }) {
  await db
    .insert(categories)
    .values(CATEGORIES.map((c, position) => ({ slug: c.slug, name: c.name, position })))
    .onConflictDoNothing();
  await db.insert(tags).values(TAGS).onConflictDoNothing();
  await db.insert(pages).values(PAGES).onConflictDoNothing();
  await db
    .insert(settings)
    .values({ key: "whatsapp_channel_url", value: "" })
    .onConflictDoNothing();

  if (opts.posts <= 0) return;

  const cats = await db.select().from(categories);
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
