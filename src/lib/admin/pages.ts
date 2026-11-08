import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { PAGE_SLUGS, type PageSlug } from "@/lib/posts/mutations";

export type PageForEdit = { slug: PageSlug; title: string; body: string; exists: boolean };

export function isPageSlug(slug: string): slug is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(slug);
}

/**
 * Página para o editor do painel. Sem linha no banco (ex.: alguém a apagou), devolve os campos
 * vazios em vez de 404: salvar cria a página (`savePage` faz upsert).
 */
export async function getPageForEdit(db: Db, slug: PageSlug): Promise<PageForEdit> {
  const [row] = await db
    .select({ title: pages.title, body: pages.body })
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);
  return row ? { slug, ...row, exists: true } : { slug, title: "", body: "", exists: false };
}
