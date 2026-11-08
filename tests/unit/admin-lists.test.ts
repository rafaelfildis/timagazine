// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db/client";
import { categories, contactMessages, posts } from "@/lib/db/schema";
import { seed } from "@/lib/db/seed";
import { createTestDb } from "@/lib/db/test-db";
import {
  listAdminPosts,
  listMessages,
  openMessage,
  parseAdminPostFilters,
  searchPublishedPosts,
} from "@/lib/admin/lists";

let db: Db;
let close: () => Promise<void>;
let categoryId: number;
const DAY = 86_400_000;

const add = (title: string, over: Partial<typeof posts.$inferInsert> = {}) =>
  db.insert(posts).values({
    slug: title.toLowerCase().replace(/\W+/g, "-"),
    title,
    categoryId,
    modality: "noticia",
    origin: "propria",
    status: "published",
    publishedAt: new Date(Date.now() - DAY),
    ...over,
  });

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seed(db, { posts: 0 });
  [{ id: categoryId }] = await db.select({ id: categories.id }).from(categories).limit(1);
  await add("Alfa publicada");
  await add("Beta rascunho", { status: "draft", publishedAt: null });
  await add("Gama agendada", { publishedAt: new Date(Date.now() + DAY) });
  await add("Desconto 100% garantido");
  await add("Sublinhado a_b");
  for (let i = 0; i < 25; i++) await add(`Lote ${String(i).padStart(2, "0")}`, { publishedAt: new Date(Date.now() - (i + 2) * DAY) });
});
afterAll(() => close());

describe("parseAdminPostFilters", () => {
  it("normaliza status, busca e página", () => {
    expect(parseAdminPostFilters({})).toEqual({ status: "all", q: "", pagina: 1 });
    expect(parseAdminPostFilters({ status: "draft", q: "  oi ", pagina: "3" })).toEqual({
      status: "draft",
      q: "oi",
      pagina: 3,
    });
    expect(parseAdminPostFilters({ status: "hack", pagina: "-4" })).toEqual({ status: "all", q: "", pagina: 1 });
    expect(parseAdminPostFilters({ q: ["a", "b"], pagina: "abc" })).toEqual({ status: "all", q: "a", pagina: 1 });
  });
});

describe("listAdminPosts", () => {
  it("filtra por status (rascunho, publicada, agendada)", async () => {
    const titles = async (status: "all" | "draft" | "published" | "scheduled") =>
      (await listAdminPosts(db, { status, q: "", pagina: 1 })).items.map((i) => i.title);
    expect(await titles("draft")).toEqual(["Beta rascunho"]);
    expect(await titles("scheduled")).toEqual(["Gama agendada"]);
    const published = await titles("published");
    expect(published).toContain("Alfa publicada");
    expect(published).not.toContain("Gama agendada");
    expect(published).not.toContain("Beta rascunho");
    expect((await listAdminPosts(db, { status: "all", q: "", pagina: 1 })).total).toBe(30);
  });

  it("busca por título sem diferenciar maiúsculas e tratando % e _ como texto", async () => {
    const q = async (text: string) =>
      (await listAdminPosts(db, { status: "all", q: text, pagina: 1 })).items.map((i) => i.title);
    expect(await q("ALFA")).toEqual(["Alfa publicada"]);
    expect(await q("100%")).toEqual(["Desconto 100% garantido"]);
    expect(await q("a_b")).toEqual(["Sublinhado a_b"]);
    expect(await q("%")).toEqual(["Desconto 100% garantido"]);
    expect(await q("_")).toEqual(["Sublinhado a_b"]);
  });

  it("pagina de 20 em 20, com as agendadas e as mais novas primeiro", async () => {
    const p1 = await listAdminPosts(db, { status: "all", q: "", pagina: 1 });
    const p2 = await listAdminPosts(db, { status: "all", q: "", pagina: 2 });
    expect([p1.items.length, p2.items.length, p1.total, p1.pages]).toEqual([20, 10, 30, 2]);
    expect(p1.items[0].title).toBe("Gama agendada");
    expect(new Set([...p1.items, ...p2.items].map((i) => i.id)).size).toBe(30);
    const beyond = await listAdminPosts(db, { status: "all", q: "", pagina: 9 });
    expect(beyond.items).toEqual([]);
  });
});

describe("searchPublishedPosts", () => {
  it("só devolve matérias publicadas e já no ar, no máximo 8", async () => {
    const lote = await searchPublishedPosts(db, "lote");
    expect(lote).toHaveLength(8);
    expect((await searchPublishedPosts(db, "rascunho"))).toEqual([]);
    expect((await searchPublishedPosts(db, "agendada"))).toEqual([]);
    expect((await searchPublishedPosts(db, "alfa")).map((p) => p.title)).toEqual(["Alfa publicada"]);
    expect((await searchPublishedPosts(db, "  "))).toHaveLength(8); // vazio: as mais recentes
  });
});

describe("mensagens", () => {
  it("lista não lidas primeiro; abrir marca como lida", async () => {
    const base = { email: "a@example.com", subject: "pauta" as const, message: "Olá", consentAt: new Date() };
    const [old] = await db
      .insert(contactMessages)
      .values({ ...base, name: "Antiga lida", createdAt: new Date(Date.now() - 3 * DAY), readAt: new Date() })
      .returning();
    const [unreadOld] = await db
      .insert(contactMessages)
      .values({ ...base, name: "Não lida velha", createdAt: new Date(Date.now() - 2 * DAY) })
      .returning();
    const [unreadNew] = await db
      .insert(contactMessages)
      .values({ ...base, name: "Não lida nova", createdAt: new Date(Date.now() - DAY) })
      .returning();

    let list = await listMessages(db, 1);
    expect(list.items.map((m) => m.name)).toEqual(["Não lida nova", "Não lida velha", "Antiga lida"]);
    expect(list.unread).toBe(2);

    const opened = await openMessage(db, unreadOld.id);
    expect(opened?.name).toBe("Não lida velha");
    expect(opened?.readAt).toBeInstanceOf(Date);
    list = await listMessages(db, 1);
    expect(list.unread).toBe(1);
    expect(list.items.map((m) => m.name)).toEqual(["Não lida nova", "Não lida velha", "Antiga lida"]);

    // reabrir uma já lida não muda o horário de leitura
    const first = (await openMessage(db, old.id))!.readAt!.getTime();
    expect((await openMessage(db, old.id))!.readAt!.getTime()).toBe(first);
    expect(await openMessage(db, 99999)).toBeNull();
    expect(unreadNew.readAt).toBeNull();
  });
});
