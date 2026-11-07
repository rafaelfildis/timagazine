import { desc } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { isPublished } from "./queries";

/** Slug e data de atualização de todas as matérias visíveis ao público. */
export async function listSitemapPosts(db: Db) {
  return db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(isPublished)
    .orderBy(desc(posts.publishedAt));
}
