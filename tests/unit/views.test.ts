// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, lte } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { seed, seedDraftAndScheduled } from "@/lib/db/seed";
import { createTestDb } from "@/lib/db/test-db";
import { incrementViews } from "@/lib/posts/queries";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seed(db, { posts: 2 });
  await seedDraftAndScheduled(db);
});
afterAll(() => close());

const viewsOf = async (slug: string) =>
  (await db.select({ v: posts.views }).from(posts).where(eq(posts.slug, slug)))[0].v;

describe("incrementViews", () => {
  it("soma 1 em matéria publicada", async () => {
    const [p] = await db.select().from(posts).where(lte(posts.publishedAt, new Date())).limit(1);
    expect(await incrementViews(db, p.id)).toBe(true);
    expect(await viewsOf(p.slug)).toBe(p.views + 1);
  });

  it("ignora rascunho, agendada e id inexistente", async () => {
    for (const slug of ["rascunho-de-exemplo", "agendada-de-exemplo"]) {
      const [p] = await db.select().from(posts).where(eq(posts.slug, slug));
      expect(await incrementViews(db, p.id)).toBe(false);
      expect(await viewsOf(slug)).toBe(0);
    }
    expect(await incrementViews(db, "22222222-2222-4222-8222-222222222222")).toBe(false);
  });
});
