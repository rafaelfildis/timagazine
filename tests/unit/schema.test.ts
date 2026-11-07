// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asc, sql } from "drizzle-orm";
import { CATEGORIES } from "@/config/taxonomy";
import type { Db } from "@/lib/db/client";
import { categories, posts } from "@/lib/db/schema";
import { seed, seedDraftAndScheduled } from "@/lib/db/seed";
import { createTestDb } from "@/lib/db/test-db";

let db: Db;
let close: () => Promise<void>;
let categoryId: number;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seed(db, { posts: 0 });
  categoryId = (await db.select().from(categories))[0].id;
});
afterAll(() => close());

const base = (slug: string, title: string) => ({
  slug,
  title,
  categoryId,
  modality: "noticia" as const,
  origin: "propria" as const,
});

describe("schema", () => {
  it("tem as 12 categorias na ordem de CATEGORIES", async () => {
    const rows = await db.select().from(categories).orderBy(asc(categories.position));
    expect(rows.map((r) => r.slug)).toEqual(CATEGORIES.map((c) => c.slug));
  });

  it("rejeita dois posts com o mesmo slug", async () => {
    await db.insert(posts).values(base("mesmo-slug", "Primeiro"));
    await expect(db.insert(posts).values(base("mesmo-slug", "Segundo"))).rejects.toThrow();
  });

  it("gera searchVector que ignora acentos", async () => {
    await db.insert(posts).values(base("seguranca-em-nuvem", "Segurança em nuvem"));
    const rows = await db
      .select({ slug: posts.slug })
      .from(posts)
      .where(
        sql`${posts.searchVector} @@ plainto_tsquery('portuguese', f_unaccent('seguranca'))`,
      );
    expect(rows.map((r) => r.slug)).toEqual(["seguranca-em-nuvem"]);
  });
});

describe("seed", () => {
  it("cria posts variados e é idempotente", async () => {
    const t = await createTestDb();
    try {
      await seed(t.db, { posts: 14 });
      await seed(t.db, { posts: 14 });
      const rows = await t.db.select().from(posts);
      expect(rows).toHaveLength(14);
      expect(new Set(rows.map((r) => r.categoryId)).size).toBe(12);
      expect(new Set(rows.map((r) => r.modality)).size).toBe(9);
      expect(rows.filter((r) => r.sponsored)).toHaveLength(1);
      expect(rows.filter((r) => r.imageUrl === null)).toHaveLength(1);
      expect(rows.some((r) => r.origin === "curadoria" && r.sourceUrl)).toBe(true);
      expect(rows.every((r) => r.authorId === null)).toBe(true);
      await seedDraftAndScheduled(t.db, new Date("2026-11-07T12:00:00-03:00"));
      expect(await t.db.select().from(posts)).toHaveLength(16);
    } finally {
      await t.close();
    }
  });
});
