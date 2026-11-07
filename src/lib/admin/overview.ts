import { desc, isNull, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { contactMessages, posts } from "@/lib/db/schema";
import { isPublished } from "@/lib/posts/queries";

export type AdminOverview = {
  published: number;
  drafts: number;
  unreadMessages: number;
  topPosts: { id: string; slug: string; title: string; views: number }[];
};

/** Números da visão geral do painel (somente leitura). */
export async function getAdminOverview(db: Db): Promise<AdminOverview> {
  const [counts] = await db
    .select({
      published: sql<number>`count(*) filter (where ${isPublished})::int`,
      drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
    })
    .from(posts);
  const [unread] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(isNull(contactMessages.readAt));
  const topPosts = await db
    .select({ id: posts.id, slug: posts.slug, title: posts.title, views: posts.views })
    .from(posts)
    .where(isPublished)
    .orderBy(desc(posts.views), desc(posts.publishedAt))
    .limit(5);
  return {
    published: counts.published,
    drafts: counts.drafts,
    unreadMessages: unread.n,
    topPosts,
  };
}
