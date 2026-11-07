import { and, asc, desc, eq, gte, inArray, lt, ne, or, sql, type SQL } from "drizzle-orm";
import type { Modality, Origin } from "@/config/taxonomy";
import type { Db } from "@/lib/db/client";
import { categories, postTags, posts, tags, users } from "@/lib/db/schema";
import type { PostFilters } from "./filters";

export const DEFAULT_AUTHOR_NAME = "Redação TI MAGAZINE";

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  categoryName: string;
  categorySlug: string;
  modality: Modality;
  origin: Origin;
  sponsored: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  imageAi: boolean;
  publishedAt: Date;
  readingMinutes: number;
};

export type PostFull = PostCard & {
  body: string;
  authorName: string;
  updatedAt: Date;
  sourceName: string | null;
  sourceUrl: string | null;
  tags: { slug: string; name: string }[];
};

/** Visível ao público: publicada e com data de publicação já alcançada. */
const isPublished = sql`${posts.status} = 'published' and ${posts.publishedAt} <= now()`;

const cardColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  dek: posts.dek,
  categoryName: categories.name,
  categorySlug: categories.slug,
  modality: posts.modality,
  origin: posts.origin,
  sponsored: posts.sponsored,
  imageUrl: posts.imageUrl,
  imageAlt: posts.imageAlt,
  imageAi: posts.imageAi,
  publishedAt: posts.publishedAt,
  readingMinutes: posts.readingMinutes,
};

type CardRow = Omit<PostCard, "publishedAt"> & { publishedAt: Date | null };
/** Só chega aqui o que passou por `isPublished`, logo publishedAt nunca é nulo. */
const toCard = <T extends CardRow>(r: T): Omit<T, "publishedAt"> & { publishedAt: Date } => ({
  ...r,
  publishedAt: r.publishedAt as Date,
});

/** Início do dia seguinte (America/Bahia, UTC-3 fixo, sem horário de verão). */
function nextDayStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.toISOString().slice(0, 10)}T00:00:00-03:00`;
}

export async function listPosts(db: Db, f: PostFilters, pageSize = 12) {
  const conds: (SQL | undefined)[] = [isPublished];
  const tsQuery = f.q ? sql`plainto_tsquery('portuguese', f_unaccent(${f.q}))` : null;

  if (tsQuery) conds.push(sql`${posts.searchVector} @@ ${tsQuery}`);
  if (f.categoria) conds.push(eq(categories.slug, f.categoria));
  if (f.modalidade) conds.push(eq(posts.modality, f.modalidade));
  if (f.autor) conds.push(eq(posts.authorId, f.autor));
  if (f.de) conds.push(gte(posts.publishedAt, new Date(`${f.de}T00:00:00-03:00`)));
  if (f.ate) conds.push(lt(posts.publishedAt, new Date(nextDayStart(f.ate))));
  if (f.tag?.length) {
    const wanted = [...new Set(f.tag)];
    conds.push(
      inArray(
        posts.id,
        sql`(select ${postTags.postId} from ${postTags} inner join ${tags} on ${tags.id} = ${postTags.tagId} where ${inArray(tags.slug, wanted)} group by ${postTags.postId} having count(distinct ${tags.slug}) = ${wanted.length})`,
      ),
    );
  }
  const where = and(...conds);

  const orderBy: SQL[] = (() => {
    switch (f.ordem) {
      case "antigas":
        return [asc(posts.publishedAt), asc(posts.id)];
      case "lidas":
        return [desc(posts.views), desc(posts.publishedAt), asc(posts.id)];
      case "relevancia":
        if (tsQuery) {
          return [
            sql`ts_rank_cd(${posts.searchVector}, ${tsQuery}) desc`,
            desc(posts.publishedAt),
            asc(posts.id),
          ];
        }
        return [desc(posts.publishedAt), asc(posts.id)];
      default:
        return [desc(posts.publishedAt), asc(posts.id)];
    }
  })();

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posts)
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .where(where);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = f.pagina;
  const rows =
    page > pages
      ? []
      : await db
          .select(cardColumns)
          .from(posts)
          .innerJoin(categories, eq(categories.id, posts.categoryId))
          .where(where)
          .orderBy(...orderBy)
          .limit(pageSize)
          .offset((page - 1) * pageSize);

  return { items: rows.map(toCard), total, page, pages };
}

export async function getPostBySlug(db: Db, slug: string): Promise<PostFull | null> {
  const [row] = await db
    .select({
      ...cardColumns,
      body: posts.body,
      updatedAt: posts.updatedAt,
      sourceName: posts.sourceName,
      sourceUrl: posts.sourceUrl,
      authorName: users.name,
    })
    .from(posts)
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.slug, slug), isPublished))
    .limit(1);
  if (!row) return null;

  const postTagRows = await db
    .select({ slug: tags.slug, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, row.id))
    .orderBy(asc(tags.name));

  const { authorName, ...rest } = row;
  return { ...toCard(rest), authorName: authorName ?? DEFAULT_AUTHOR_NAME, tags: postTagRows };
}

/** Mesma categoria primeiro, depois quem compartilha mais tags; desempate por data. */
export async function getRelated(
  db: Db,
  post: Pick<PostFull, "id" | "categorySlug" | "tags">,
  n = 3,
): Promise<PostCard[]> {
  const tagSlugs = post.tags.map((t) => t.slug);
  const sameCategory = eq(categories.slug, post.categorySlug);
  // Sem tags no post, a lista vazia vira [""] (nenhum slug real é vazio): contagem 0, SQL válido.
  const sharedTags = sql<number>`(select count(*) from ${postTags} inner join ${tags} on ${tags.id} = ${postTags.tagId} where ${postTags.postId} = ${posts.id} and ${inArray(tags.slug, tagSlugs.length ? tagSlugs : [""])})`;

  const rows = await db
    .select(cardColumns)
    .from(posts)
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .where(
      and(
        isPublished,
        ne(posts.id, post.id),
        tagSlugs.length ? or(sameCategory, sql`${sharedTags} > 0`) : sameCategory,
      ),
    )
    .orderBy(
      sql`case when ${categories.slug} = ${post.categorySlug} then 0 else 1 end`,
      sql`${sharedTags} desc`,
      desc(posts.publishedAt),
      asc(posts.id),
    )
    .limit(n);
  return rows.map(toCard);
}
