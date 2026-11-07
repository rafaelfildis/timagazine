import { asc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { categories, homeHighlights, posts } from "@/lib/db/schema";
import { parseFilters } from "./filters";
import { cardColumns, isPublished, listPosts, toCard, type PostCard } from "./queries";

export const HIGHLIGHT_SLOTS = 5;
export const LATEST_COUNT = 9;

/**
 * Destaques: as posições 1–5 de `home_highlights` (só matérias visíveis ao público),
 * completadas com as mais recentes, sem repetir. `latest` são as próximas mais
 * recentes, nunca repetindo um destaque.
 */
export async function getHomeData(db: Db): Promise<{ highlights: PostCard[]; latest: PostCard[] }> {
  const manualRows = await db
    .select(cardColumns)
    .from(homeHighlights)
    .innerJoin(posts, eq(posts.id, homeHighlights.postId))
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .where(isPublished)
    .orderBy(asc(homeHighlights.position))
    .limit(HIGHLIGHT_SLOTS);
  // A mesma matéria em duas posições aparece uma vez só.
  const manual = [...new Map(manualRows.map(toCard).map((p) => [p.id, p])).values()];

  // Basta HIGHLIGHT_SLOTS + LATEST_COUNT recentes: sobram LATEST_COUNT depois de tirar os destaques.
  const { items: recents } = await listPosts(
    db,
    parseFilters({}),
    HIGHLIGHT_SLOTS + LATEST_COUNT,
  );

  const taken = new Set(manual.map((p) => p.id));
  const fill = recents.filter((p) => !taken.has(p.id)).slice(0, HIGHLIGHT_SLOTS - manual.length);
  const highlights = [...manual, ...fill];

  const used = new Set(highlights.map((p) => p.id));
  const latest = recents.filter((p) => !used.has(p.id)).slice(0, LATEST_COUNT);
  return { highlights, latest };
}
