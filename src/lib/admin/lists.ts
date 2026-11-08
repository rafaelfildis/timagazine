import { and, asc, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { categories, contactMessages, posts } from "@/lib/db/schema";
import { isPublished } from "@/lib/posts/queries";

export const ADMIN_PAGE_SIZE = 20;

export const ADMIN_STATUS_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "draft", label: "Rascunhos" },
  { value: "published", label: "Publicadas" },
  { value: "scheduled", label: "Agendadas" },
] as const;
export type AdminStatus = (typeof ADMIN_STATUS_OPTIONS)[number]["value"];

export type AdminPostFilters = { status: AdminStatus; q: string; pagina: number };

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
}

export function parseAdminPostFilters(sp: Raw): AdminPostFilters {
  const status = first(sp.status);
  return {
    status: ADMIN_STATUS_OPTIONS.some((o) => o.value === status) ? (status as AdminStatus) : "all",
    q: (first(sp.q) ?? "").trim().slice(0, 100),
    pagina: parsePage(first(sp.pagina)),
  };
}

/** Escapa % _ \ para o ILIKE tratar a busca como texto literal. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export type AdminPostRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  /** Publicada com data futura. */
  scheduled: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  categoryName: string;
};

export async function listAdminPosts(db: Db, f: AdminPostFilters, pageSize = ADMIN_PAGE_SIZE) {
  const conds: (SQL | undefined)[] = [];
  if (f.status === "draft") conds.push(eq(posts.status, "draft"));
  if (f.status === "published") conds.push(isPublished);
  if (f.status === "scheduled") {
    conds.push(sql`${posts.status} = 'published' and ${posts.publishedAt} > now()`);
  }
  if (f.q) conds.push(ilike(posts.title, `%${likeEscape(f.q)}%`));
  const where = and(...conds);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posts)
    .where(where);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const rows =
    f.pagina > pages
      ? []
      : await db
          .select({
            id: posts.id,
            slug: posts.slug,
            title: posts.title,
            status: posts.status,
            publishedAt: posts.publishedAt,
            updatedAt: posts.updatedAt,
            categoryName: categories.name,
            scheduled: sql<boolean>`(${posts.status} = 'published' and ${posts.publishedAt} > now())`,
          })
          .from(posts)
          .innerJoin(categories, eq(categories.id, posts.categoryId))
          .where(where)
          .orderBy(desc(sql`coalesce(${posts.publishedAt}, ${posts.updatedAt})`), asc(posts.id))
          .limit(pageSize)
          .offset((f.pagina - 1) * pageSize);
  return { items: rows as AdminPostRow[], total, page: f.pagina, pages };
}

/** Busca de matérias já no ar para os Destaques da Home (máx. 8; vazio = as mais recentes). */
export async function searchPublishedPosts(db: Db, q: string) {
  const term = q.trim().slice(0, 100);
  return db
    .select({ id: posts.id, title: posts.title })
    .from(posts)
    .where(and(isPublished, term ? ilike(posts.title, `%${likeEscape(term)}%`) : undefined))
    .orderBy(desc(posts.publishedAt), asc(posts.id))
    .limit(8);
}

// --- mensagens de contato --------------------------------------------------

export type MessageRow = typeof contactMessages.$inferSelect;
type MessageListItem = Pick<
  MessageRow,
  "id" | "name" | "email" | "subject" | "createdAt" | "readAt"
>;

/** Não lidas primeiro; dentro de cada grupo, as mais novas. */
export async function listMessages(db: Db, pagina: number, pageSize = ADMIN_PAGE_SIZE) {
  const [{ total, unread }] = await db
    .select({
      total: sql<number>`count(*)::int`,
      unread: sql<number>`count(*) filter (where ${contactMessages.readAt} is null)::int`,
    })
    .from(contactMessages);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const items: MessageListItem[] =
    pagina > pages
      ? []
      : await db
          .select({
            id: contactMessages.id,
            name: contactMessages.name,
            email: contactMessages.email,
            subject: contactMessages.subject,
            createdAt: contactMessages.createdAt,
            readAt: contactMessages.readAt,
          })
          .from(contactMessages)
          .orderBy(
            sql`(${contactMessages.readAt} is null) desc`,
            desc(contactMessages.createdAt),
            desc(contactMessages.id),
          )
          .limit(pageSize)
          .offset((pagina - 1) * pageSize);
  return { items, total, unread, page: pagina, pages };
}

/** Devolve a mensagem e a marca como lida (a primeira abertura define o horário). */
export async function openMessage(db: Db, id: number): Promise<MessageRow | null> {
  const [row] = await db
    .update(contactMessages)
    .set({ readAt: sql`coalesce(${contactMessages.readAt}, now())` })
    .where(eq(contactMessages.id, id))
    .returning();
  return row ?? null;
}

