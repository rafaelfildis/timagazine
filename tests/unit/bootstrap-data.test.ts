// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asc, eq, sql } from "drizzle-orm";
import { CATEGORIES } from "@/config/taxonomy";
import type { Db } from "@/lib/db/client";
import { categories, pages, settings } from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";
import { getPageForEdit } from "@/lib/admin/pages";
import { PAGE_SLUGS, savePage } from "@/lib/posts/mutations";

const MIGRATION = join(process.cwd(), "drizzle", "0002_bootstrap_data.sql");

/** Reaplica a migração de dados como o migrador faz (um comando por breakpoint). */
async function rerunBootstrap(db: Db) {
  for (const statement of readFileSync(MIGRATION, "utf8").split("--> statement-breakpoint")) {
    await db.execute(sql.raw(statement));
  }
}

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  // Só as migrações: nenhum seed de exemplo.
  ({ db, close } = await createTestDb());
});
afterAll(() => close());

describe("migração 0002_bootstrap_data (banco novo de produção)", () => {
  it("cria as 12 categorias exatamente como em CATEGORIES (slug, nome e ordem)", async () => {
    const rows = await db
      .select({ slug: categories.slug, name: categories.name, position: categories.position })
      .from(categories)
      .orderBy(asc(categories.position));
    expect(rows).toEqual(CATEGORIES.map((c, position) => ({ slug: c.slug, name: c.name, position })));
  });

  it("cria as 4 páginas institucionais com texto inicial", async () => {
    const rows = await db.select().from(pages);
    expect(rows.map((r) => r.slug).sort()).toEqual([...PAGE_SLUGS].sort());
    for (const r of rows) {
      expect(r.title.trim()).not.toBe("");
      expect(r.body.trim().length).toBeGreaterThan(100);
      expect(r.body).not.toContain("\r");
    }
    const editorial = rows.find((r) => r.slug === "politica-editorial")!;
    expect(editorial.title).toBe("Política Editorial e de Correções");
    expect(editorial.body).toContain("## Aprovação humana obrigatória");
    expect(editorial.body).toContain('"Ilustração gerada por IA"');
    expect(editorial.body).toContain("[Contato](/contato)");
  });

  it("cria a chave whatsapp_channel_url vazia", async () => {
    expect(await db.select().from(settings)).toEqual([{ key: "whatsapp_channel_url", value: "" }]);
  });

  it("é idempotente e não sobrescreve o que a equipe editou", async () => {
    await savePage(db, "sobre", { title: "Sobre (editado)", body: "Texto revisado pela equipe." });
    await db.update(settings).set({ value: "https://whatsapp.com/channel/abc" });
    await rerunBootstrap(db);
    expect(await db.select().from(categories)).toHaveLength(CATEGORIES.length);
    expect(await db.select().from(pages)).toHaveLength(PAGE_SLUGS.length);
    const [sobre] = await db.select().from(pages).where(eq(pages.slug, "sobre"));
    expect(sobre).toMatchObject({ title: "Sobre (editado)", body: "Texto revisado pela equipe." });
    expect((await db.select().from(settings))[0].value).toBe("https://whatsapp.com/channel/abc");
  });
});

describe("editor de páginas sem a linha no banco", () => {
  it("abre com campos vazios e salvar cria a página", async () => {
    await db.delete(pages).where(eq(pages.slug, "termos-de-uso"));
    expect(await getPageForEdit(db, "termos-de-uso")).toEqual({
      slug: "termos-de-uso",
      title: "",
      body: "",
      exists: false,
    });
    await savePage(db, "termos-de-uso", { title: "Termos de Uso", body: "Texto novo." });
    expect(await getPageForEdit(db, "termos-de-uso")).toEqual({
      slug: "termos-de-uso",
      title: "Termos de Uso",
      body: "Texto novo.",
      exists: true,
    });
  });
});
