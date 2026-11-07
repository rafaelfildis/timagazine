// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { categories, homeHighlights, posts } from "@/lib/db/schema";
import { seed } from "@/lib/db/seed";
import { createTestDb } from "@/lib/db/test-db";
import { getHomeData } from "@/lib/posts/home";

let db: Db;
let close: () => Promise<void>;
let categoryId: number;
const DAY = 86_400_000;

async function add(slug: string, daysAgo: number, status: "published" | "draft" = "published") {
  const [row] = await db
    .insert(posts)
    .values({
      slug,
      title: `Título ${slug}`,
      categoryId,
      modality: "noticia",
      origin: "propria",
      status,
      publishedAt: status === "published" ? new Date(Date.now() - daysAgo * DAY) : null,
    })
    .returning();
  return row;
}

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seed(db, { posts: 0 });
  [{ id: categoryId }] = await db.select({ id: categories.id }).from(categories).limit(1);
});
afterAll(() => close());
beforeEach(async () => {
  await db.delete(homeHighlights);
  await db.execute(sql`delete from posts`);
});

describe("getHomeData", () => {
  it("sem posts, highlights e latest ficam vazios", async () => {
    expect(await getHomeData(db)).toEqual({ highlights: [], latest: [] });
  });

  it("com 3 posts e nenhum destaque manual, highlights traz os 3 mais recentes", async () => {
    await add("a", 3);
    await add("b", 1);
    await add("c", 2);
    const { highlights, latest } = await getHomeData(db);
    expect(highlights.map((p) => p.slug)).toEqual(["b", "c", "a"]);
    expect(latest).toEqual([]);
  });

  it("destaque manual na posição 1 apontando para um post antigo vem primeiro", async () => {
    const old = await add("antigo", 30);
    await add("novo-1", 1);
    await add("novo-2", 2);
    await db.insert(homeHighlights).values({ position: 1, postId: old.id });
    const { highlights } = await getHomeData(db);
    expect(highlights.map((p) => p.slug)).toEqual(["antigo", "novo-1", "novo-2"]);
  });

  it("destaque manual que aponta para um rascunho é ignorado", async () => {
    const draft = await add("rascunho", 0, "draft");
    await add("publicado", 1);
    await db.insert(homeHighlights).values({ position: 1, postId: draft.id });
    const { highlights } = await getHomeData(db);
    expect(highlights.map((p) => p.slug)).toEqual(["publicado"]);
  });

  it("highlights tem no máximo 5, latest tem 9 e nunca repete destaques", async () => {
    const old = await add("antigo", 100);
    for (let i = 1; i <= 15; i++) await add(`p-${i}`, i);
    await db.insert(homeHighlights).values({ position: 2, postId: old.id });
    const { highlights, latest } = await getHomeData(db);
    expect(highlights).toHaveLength(5);
    expect(highlights[0].slug).toBe("antigo");
    expect(latest).toHaveLength(9);
    const ids = new Set(highlights.map((p) => p.id));
    expect(latest.some((p) => ids.has(p.id))).toBe(false);
    expect(new Set([...highlights, ...latest].map((p) => p.id)).size).toBe(14);
  });
});
