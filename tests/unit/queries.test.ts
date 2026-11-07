// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { categories, postTags, posts, tags, users } from "@/lib/db/schema";
import { seed } from "@/lib/db/seed";
import { createTestDb } from "@/lib/db/test-db";
import { parseFilters, type PostFilters } from "@/lib/posts/filters";
import { getPostBySlug, getRelated, listPosts } from "@/lib/posts/queries";

let db: Db;
let close: () => Promise<void>;
const catId: Record<string, number> = {};
let authorId: string;

const DAY = 86_400_000;
const f = (sp: Record<string, string | string[] | undefined> = {}): PostFilters => parseFilters(sp);

async function add(
  slug: string,
  title: string,
  opts: Partial<typeof posts.$inferInsert> & { cat?: string } = {},
) {
  const { cat = "ciberseguranca", ...rest } = opts;
  const [row] = await db
    .insert(posts)
    .values({
      slug,
      title,
      categoryId: catId[cat],
      modality: "noticia",
      origin: "propria",
      status: "published",
      publishedAt: new Date(Date.now() - DAY),
      ...rest,
    })
    .returning();
  return row;
}

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seed(db, { posts: 0 });
  for (const c of await db.select().from(categories)) catId[c.slug] = c.id;
  [{ id: authorId }] = await db
    .insert(users)
    .values({ name: "Maria Autora", email: "maria@example.com", passwordHash: "x" })
    .returning({ id: users.id });
});
afterAll(() => close());

describe("busca", () => {
  it("encontra 'Segurança em nuvem' com e sem acento e em maiúsculas", async () => {
    await add("seguranca-em-nuvem", "Segurança em nuvem");
    await add("outra", "Outro assunto qualquer");
    for (const q of ["seguranca", "SEGURANÇA", "segurança"]) {
      const r = await listPosts(db, f({ q }));
      expect(r.items.map((i) => i.slug)).toEqual(["seguranca-em-nuvem"]);
    }
  });

  it("relevância: título pesa mais que corpo", async () => {
    await add("rel-corpo", "Assunto neutro alfa", { body: "blockchain blockchain blockchain" });
    await add("rel-titulo", "Blockchain no setor público");
    const r = await listPosts(db, f({ q: "blockchain" }));
    expect(r.items[0].slug).toBe("rel-titulo");
    expect(r.total).toBe(2);
  });
});

describe("visibilidade", () => {
  it("rascunho e publicação futura ficam fora de listPosts e getPostBySlug", async () => {
    await add("rascunho-x", "Zzvisib rascunho", { status: "draft", publishedAt: null });
    await add("futura-x", "Zzvisib futura", { publishedAt: new Date(Date.now() + DAY) });
    await add("publicada-x", "Zzvisib publicada");
    const r = await listPosts(db, f({ q: "zzvisib" }));
    expect(r.items.map((i) => i.slug)).toEqual(["publicada-x"]);
    expect(await getPostBySlug(db, "rascunho-x")).toBeNull();
    expect(await getPostBySlug(db, "futura-x")).toBeNull();
    expect(await getPostBySlug(db, "inexistente")).toBeNull();
    expect((await getPostBySlug(db, "publicada-x"))?.title).toBe("Zzvisib publicada");
  });
});

describe("filtros combinados", () => {
  it("categoria + modalidade + período retornam só a interseção", async () => {
    const d = (s: string) => new Date(`${s}T12:00:00-03:00`);
    await add("c-hit", "Combo hit", { cat: "dados-analytics", modality: "analise", publishedAt: d("2026-03-15") });
    await add("c-cat", "Combo outra cat", { cat: "ciberseguranca", modality: "analise", publishedAt: d("2026-03-15") });
    await add("c-mod", "Combo outra mod", { cat: "dados-analytics", modality: "tutorial", publishedAt: d("2026-03-15") });
    await add("c-dt", "Combo fora do período", { cat: "dados-analytics", modality: "analise", publishedAt: d("2026-05-01") });
    const r = await listPosts(
      db,
      f({ categoria: "dados-analytics", modalidade: "analise", de: "2026-03-01", ate: "2026-03-31" }),
    );
    expect(r.items.map((i) => i.slug)).toEqual(["c-hit"]);
    expect(r.total).toBe(1);
  });

  it("período é inclusivo e usa o fuso America/Bahia (UTC-3)", async () => {
    // 23:30 de 10/04 em Bahia = 02:30Z do dia 11, mas ainda é dia 10 em Bahia
    await add("p-tarde", "Periodo tarde", { cat: "hardware-conectividade", publishedAt: new Date("2026-04-10T23:30:00-03:00") });
    await add("p-cedo", "Periodo cedo", { cat: "hardware-conectividade", publishedAt: new Date("2026-04-10T00:30:00-03:00") });
    await add("p-depois", "Periodo depois", { cat: "hardware-conectividade", publishedAt: new Date("2026-04-11T00:30:00-03:00") });
    await add("p-antes", "Periodo antes", { cat: "hardware-conectividade", publishedAt: new Date("2026-04-09T23:30:00-03:00") });
    const r = await listPosts(db, f({ categoria: "hardware-conectividade", de: "2026-04-10", ate: "2026-04-10" }));
    expect(r.items.map((i) => i.slug).sort()).toEqual(["p-cedo", "p-tarde"]);
  });

  it("tags são combinadas com E", async () => {
    const [ta, tb] = await db
      .insert(tags)
      .values([
        { slug: "t-alfa", name: "Alfa" },
        { slug: "t-beta", name: "Beta" },
      ])
      .returning();
    const both = await add("tg-both", "Tag both", { cat: "carreiras-lideranca" });
    const one = await add("tg-one", "Tag one", { cat: "carreiras-lideranca" });
    await db.insert(postTags).values([
      { postId: both.id, tagId: ta.id },
      { postId: both.id, tagId: tb.id },
      { postId: one.id, tagId: ta.id },
    ]);
    const r = await listPosts(db, f({ tag: ["t-alfa", "t-beta"] }));
    expect(r.items.map((i) => i.slug)).toEqual(["tg-both"]);
    const r2 = await listPosts(db, f({ tag: "t-alfa" }));
    expect(r2.total).toBe(2);
  });

  it("filtra por autor e devolve 'Redação TI MAGAZINE' quando não há autor", async () => {
    await add("au-com", "Autor com", { cat: "tecnologia-saude", authorId });
    await add("au-sem", "Autor sem", { cat: "tecnologia-saude" });
    const r = await listPosts(db, f({ autor: authorId }));
    expect(r.items.map((i) => i.slug)).toEqual(["au-com"]);
    expect((await getPostBySlug(db, "au-com"))?.authorName).toBe("Maria Autora");
    expect((await getPostBySlug(db, "au-sem"))?.authorName).toBe("Redação TI MAGAZINE");
  });
});

describe("ordenação", () => {
  it("'lidas' ordena por views desc; 'antigas' por data asc", async () => {
    const t = (n: number) => new Date(Date.UTC(2026, 5, n, 15));
    await add("o-a", "Ord a", { cat: "startups-negocios", views: 5, publishedAt: t(1) });
    await add("o-b", "Ord b", { cat: "startups-negocios", views: 50, publishedAt: t(2) });
    await add("o-c", "Ord c", { cat: "startups-negocios", views: 20, publishedAt: t(3) });
    const lidas = await listPosts(db, f({ categoria: "startups-negocios", ordem: "lidas" }));
    expect(lidas.items.map((i) => i.slug)).toEqual(["o-b", "o-c", "o-a"]);
    const antigas = await listPosts(db, f({ categoria: "startups-negocios", ordem: "antigas" }));
    expect(antigas.items.map((i) => i.slug)).toEqual(["o-a", "o-b", "o-c"]);
    const recentes = await listPosts(db, f({ categoria: "startups-negocios" }));
    expect(recentes.items.map((i) => i.slug)).toEqual(["o-c", "o-b", "o-a"]);
  });
});

describe("paginação", () => {
  beforeAll(async () => {
    for (let i = 0; i < 25; i++) {
      await add(`pg-${String(i).padStart(2, "0")}`, `Paginada ${i}`, {
        cat: "transformacao-digital",
        publishedAt: new Date(Date.UTC(2026, 6, 1, 12, i)),
      });
    }
  });

  it("25 posts com pageSize 12 => 3 páginas; a 3ª tem 1 item", async () => {
    const p1 = await listPosts(db, f({ categoria: "transformacao-digital" }), 12);
    expect(p1.pages).toBe(3);
    expect(p1.total).toBe(25);
    expect(p1.items).toHaveLength(12);
    const p3 = await listPosts(db, f({ categoria: "transformacao-digital", pagina: "3" }), 12);
    expect(p3.items).toHaveLength(1);
    expect(p3.page).toBe(3);
    const all = [
      ...p1.items,
      ...(await listPosts(db, f({ categoria: "transformacao-digital", pagina: "2" }), 12)).items,
      ...p3.items,
    ].map((i) => i.slug);
    expect(new Set(all).size).toBe(25);
  });

  it("página além da última => items [] com total correto, sem erro", async () => {
    const r = await listPosts(db, f({ categoria: "transformacao-digital", pagina: "99" }), 12);
    expect(r.items).toEqual([]);
    expect(r.total).toBe(25);
    expect(r.pages).toBe(3);
  });

  it("sem resultados => pages 1, total 0", async () => {
    const r = await listPosts(db, f({ q: "xqzwvk" }));
    expect(r).toMatchObject({ items: [], total: 0, pages: 1, page: 1 });
  });
});

describe("getPostBySlug / getRelated", () => {
  it("devolve PostFull com tags, fonte e atualização", async () => {
    const p = await add("full-1", "Matéria completa", {
      cat: "inteligencia-artificial",
      origin: "curadoria",
      sourceName: "Fonte X",
      sourceUrl: "https://example.com/x",
      body: "Corpo",
      imageAi: true,
    });
    const [t] = await db.select().from(tags).where(eq(tags.slug, "t-alfa"));
    await db.insert(postTags).values({ postId: p.id, tagId: t.id });
    const full = await getPostBySlug(db, "full-1");
    expect(full).toMatchObject({
      slug: "full-1",
      body: "Corpo",
      sourceName: "Fonte X",
      sourceUrl: "https://example.com/x",
      categorySlug: "inteligencia-artificial",
      categoryName: "Inteligência Artificial",
      origin: "curadoria",
      imageAi: true,
      tags: [{ slug: "t-alfa", name: "Alfa" }],
    });
    expect(full?.updatedAt).toBeInstanceOf(Date);
    expect(full?.publishedAt).toBeInstanceOf(Date);
  });

  it("getRelated prioriza a mesma categoria, exclui o próprio e respeita n", async () => {
    for (let i = 0; i < 4; i++) {
      await add(`rl-${i}`, `Rel ${i}`, { cat: "gestao-governanca", publishedAt: new Date(Date.UTC(2026, 7, 1 + i)) });
    }
    await add("rl-draft", "Rel draft", { cat: "gestao-governanca", status: "draft", publishedAt: null });
    await add("rl-outra", "Rel outra", { cat: "govtech-setor-publico" });
    const base = (await getPostBySlug(db, "rl-0"))!;
    const rel = await getRelated(db, base);
    expect(rel.map((r) => r.slug)).toEqual(["rl-3", "rl-2", "rl-1"]);
    expect((await getRelated(db, base, 2)).length).toBe(2);
  });

  it("getRelated completa com posts que compartilham tags de outras categorias", async () => {
    const x = await add("rt-x", "Rt x", { cat: "govtech-setor-publico", publishedAt: new Date(Date.UTC(2026, 8, 1)) });
    const y = await add("rt-y", "Rt y", { cat: "tecnologia-saude", publishedAt: new Date(Date.UTC(2026, 8, 2)) });
    await add("rt-z", "Rt z", { cat: "tecnologia-saude", publishedAt: new Date(Date.UTC(2026, 8, 3)) });
    const [t] = await db.insert(tags).values({ slug: "t-rel", name: "Rel" }).returning();
    await db.insert(postTags).values([
      { postId: x.id, tagId: t.id },
      { postId: y.id, tagId: t.id },
    ]);
    // rt-x é a única da categoria govtech com tag compartilhada com rt-y
    const base = (await getPostBySlug(db, "rt-x"))!;
    const rel = await getRelated(db, base);
    expect(rel.map((r) => r.slug)).toContain("rt-y");
    expect(rel.map((r) => r.slug)).not.toContain("rt-z");
  });
});
