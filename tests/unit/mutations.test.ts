// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { categories, homeHighlights, pages, postTags, posts, settings, tags, users } from "@/lib/db/schema";
import { seed } from "@/lib/db/seed";
import { createTestDb } from "@/lib/db/test-db";
import {
  ValidationError,
  savePage,
  savePost,
  setHighlights,
  setSetting,
  type PostInputData,
} from "@/lib/posts/mutations";
import { getPostBySlug } from "@/lib/posts/queries";

let db: Db;
let close: () => Promise<void>;
let categoryId: number;
let userId: string;

const base = (over: Partial<PostInputData> = {}): PostInputData => ({
  title: "Teste",
  dek: "Linha fina",
  body: "Corpo da matéria.",
  categoryId,
  modality: "noticia",
  origin: "propria",
  sponsored: false,
  imageAi: false,
  tagNames: [],
  status: "draft",
  ...over,
});

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seed(db, { posts: 0 });
  [{ id: categoryId }] = await db.select({ id: categories.id }).from(categories).limit(1);
  [{ id: userId }] = await db
    .insert(users)
    .values({ name: "Edu Editor", email: "edu@example.com", passwordHash: "x" })
    .returning({ id: users.id });
});
afterAll(() => close());

const rejected = async (p: Promise<unknown>) => {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ValidationError);
  return (err as ValidationError).fieldErrors;
};

describe("savePost: slug", () => {
  it("dois posts com o título 'Teste' ficam 'teste' e 'teste-2'", async () => {
    const a = await savePost(db, base(), userId);
    const b = await savePost(db, base(), userId);
    const c = await savePost(db, base(), userId);
    expect([a.slug, b.slug, c.slug]).toEqual(["teste", "teste-2", "teste-3"]);
  });

  it("editar mantém o slug, a menos que seja alterado de forma explícita", async () => {
    const { id, slug } = await savePost(db, base({ title: "Título original" }), userId);
    const edited = await savePost(db, base({ id, title: "Título novo" }), userId);
    expect(edited.slug).toBe(slug);
    const renamed = await savePost(db, base({ id, title: "Título novo", slug: "Outro Endereço" }), userId);
    expect(renamed.slug).toBe("outro-endereco");
    // salvar de novo com o mesmo slug explícito não vira "-2" (não colide consigo mesmo)
    const again = await savePost(db, base({ id, title: "Título novo", slug: "outro-endereco" }), userId);
    expect(again.slug).toBe("outro-endereco");
  });

  it("slug explícito que colide com outra matéria recebe sufixo", async () => {
    await savePost(db, base({ title: "Ocupado" }), userId);
    const other = await savePost(db, base({ title: "Outra", slug: "ocupado" }), userId);
    expect(other.slug).toBe("ocupado-2");
  });
});

describe("savePost: publicação e campos calculados", () => {
  it("publicar sem data preenche publishedAt com agora", async () => {
    const before = Date.now();
    const { id } = await savePost(db, base({ title: "Publicada agora", status: "published" }), userId);
    const [row] = await db.select().from(posts).where(eq(posts.id, id));
    expect(row.status).toBe("published");
    expect(row.publishedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(row.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    expect(row.authorId).toBe(userId);
  });

  it("rascunho sem data fica sem publishedAt; republicar preserva a data original", async () => {
    const { id } = await savePost(db, base({ title: "Rascunho sem data" }), userId);
    expect((await db.select().from(posts).where(eq(posts.id, id)))[0].publishedAt).toBeNull();

    const first = await savePost(db, base({ id, title: "Rascunho sem data", status: "published" }), userId);
    const [pub] = await db.select().from(posts).where(eq(posts.id, first.id));
    await savePost(db, base({ id, title: "Rascunho sem data", status: "draft" }), userId);
    await savePost(db, base({ id, title: "Rascunho sem data", status: "published" }), userId);
    const [again] = await db.select().from(posts).where(eq(posts.id, id));
    expect(again.publishedAt!.getTime()).toBe(pub.publishedAt!.getTime());
  });

  it("aceita publishedAt futuro (agendada): não aparece em getPostBySlug até chegar a hora", async () => {
    const future = new Date(Date.now() + 2 * 86_400_000);
    const { slug, id } = await savePost(
      db,
      base({ title: "Agendada", status: "published", publishedAt: future }),
      userId,
    );
    const [row] = await db.select().from(posts).where(eq(posts.id, id));
    expect(row.publishedAt!.getTime()).toBe(future.getTime());
    expect(await getPostBySlug(db, slug)).toBeNull();
  });

  it("recalcula readingMinutes e atualiza updatedAt ao editar", async () => {
    const { id } = await savePost(db, base({ title: "Leitura", body: "uma duas três" }), userId);
    const [first] = await db.select().from(posts).where(eq(posts.id, id));
    expect(first.readingMinutes).toBe(1);
    await new Promise((r) => setTimeout(r, 15));
    await savePost(db, base({ id, title: "Leitura", body: "palavra ".repeat(450) }), userId);
    const [second] = await db.select().from(posts).where(eq(posts.id, id));
    expect(second.readingMinutes).toBe(3);
    expect(second.updatedAt.getTime()).toBeGreaterThan(first.updatedAt.getTime());
    expect(second.authorId).toBe(userId); // editar não troca o autor
  });

  it("cria tags na hora, sem duplicar, e substitui o conjunto ao editar", async () => {
    const { id } = await savePost(
      db,
      base({ title: "Com tags", tagNames: ["Nova Tag", "nova tag", " IA generativa ", ""] }),
      userId,
    );
    const names = async () =>
      (
        await db
          .select({ name: tags.name })
          .from(postTags)
          .innerJoin(tags, eq(tags.id, postTags.tagId))
          .where(eq(postTags.postId, id))
      )
        .map((r) => r.name)
        .sort();
    // "IA generativa" já existia na seed: reaproveita o nome cadastrado
    expect(await names()).toEqual(["IA generativa", "Nova Tag"]);
    await savePost(db, base({ id, title: "Com tags", tagNames: ["LGPD"] }), userId);
    expect(await names()).toEqual(["LGPD"]);
    expect((await db.select().from(tags).where(eq(tags.slug, "nova-tag"))).length).toBe(1);
  });

  it("guarda 'O que fazer agora' e a nota de correção, e getPostBySlug devolve os dois", async () => {
    const { slug } = await savePost(
      db,
      base({
        title: "Com extras",
        status: "published",
        takeaways: "- Faça isto\n- Faça aquilo",
        correctionNote: "Corrigimos o nome da empresa.",
      }),
      userId,
    );
    const post = await getPostBySlug(db, slug);
    expect(post?.takeaways).toBe("- Faça isto\n- Faça aquilo");
    expect(post?.correctionNote).toBe("Corrigimos o nome da empresa.");
    const plain = await savePost(db, base({ title: "Sem extras", status: "published" }), userId);
    expect((await getPostBySlug(db, plain.slug))?.takeaways).toBeNull();
  });
});

describe("savePost: validação", () => {
  it("curadoria sem sourceUrl (ou sem sourceName) é rejeitada", async () => {
    const e1 = await rejected(savePost(db, base({ origin: "curadoria", sourceName: "Agência" }), userId));
    expect(e1.sourceUrl).toBeTruthy();
    const e2 = await rejected(
      savePost(db, base({ origin: "curadoria", sourceUrl: "https://example.com/a" }), userId),
    );
    expect(e2.sourceName).toBeTruthy();
  });

  it("sourceUrl precisa ser http(s)", async () => {
    for (const sourceUrl of ["javascript:alert(1)", "ftp://x.com/a", "não é url"]) {
      const e = await rejected(
        savePost(db, base({ origin: "curadoria", sourceName: "Agência", sourceUrl }), userId),
      );
      expect(e.sourceUrl).toBeTruthy();
    }
    const ok = await savePost(
      db,
      base({ title: "Curadoria ok", origin: "curadoria", sourceName: "Agência", sourceUrl: "https://example.com/a" }),
      userId,
    );
    expect(ok.id).toBeTruthy();
  });

  it("imagem exige texto alternativo e só aceita origens conhecidas", async () => {
    const e1 = await rejected(savePost(db, base({ imageUrl: "/uploads/a.png" }), userId));
    expect(e1.imageAlt).toBeTruthy();
    const e2 = await rejected(
      savePost(db, base({ imageUrl: "https://evil.example/x.png", imageAlt: "x" }), userId),
    );
    expect(e2.imageUrl).toBeTruthy();
    const e3 = await rejected(savePost(db, base({ imageUrl: "javascript:alert(1)", imageAlt: "x" }), userId));
    expect(e3.imageUrl).toBeTruthy();
    const ok = await savePost(
      db,
      base({ title: "Com imagem", imageUrl: "/uploads/a.png", imageAlt: "Descrição" }),
      userId,
    );
    expect(ok.id).toBeTruthy();
    const blob = await savePost(
      db,
      base({
        title: "Com imagem blob",
        imageUrl: "https://abc123.public.blob.vercel-storage.com/x-1.png",
        imageAlt: "Descrição",
      }),
      userId,
    );
    expect(blob.id).toBeTruthy();
  });

  it("título vazio, categoria inexistente e publicar sem corpo são rejeitados; nada é gravado", async () => {
    const before = (await db.select({ id: posts.id }).from(posts)).length;
    expect((await rejected(savePost(db, base({ title: "   " }), userId))).title).toBeTruthy();
    expect((await rejected(savePost(db, base({ categoryId: 9999 }), userId))).categoryId).toBeTruthy();
    expect(
      (await rejected(savePost(db, base({ title: "Sem corpo", status: "published", body: "" }), userId))).body,
    ).toBeTruthy();
    expect((await db.select({ id: posts.id }).from(posts)).length).toBe(before);
  });

  it("editar uma matéria inexistente é rejeitado", async () => {
    await rejected(savePost(db, base({ id: "00000000-0000-4000-8000-000000000000" }), userId));
  });
});

describe("setHighlights", () => {
  it("rejeita id inexistente e não altera os destaques", async () => {
    const a = await savePost(db, base({ title: "Dest A", status: "published" }), userId);
    await setHighlights(db, [a.id, null, null, null, null]);
    await expect(
      setHighlights(db, ["00000000-0000-4000-8000-000000000000", null, null, null, null]),
    ).rejects.toBeInstanceOf(ValidationError);
    const rows = await db.select().from(homeHighlights);
    expect(rows).toEqual([{ position: 1, postId: a.id }]);
  });

  it("grava as posições 1–5, ignora vazios e substitui o conjunto anterior", async () => {
    const a = await savePost(db, base({ title: "Pos A", status: "published" }), userId);
    const b = await savePost(db, base({ title: "Pos B", status: "published" }), userId);
    await setHighlights(db, [null, b.id, null, a.id, null]);
    const rows = await db.select().from(homeHighlights).orderBy(homeHighlights.position);
    expect(rows).toEqual([
      { position: 2, postId: b.id },
      { position: 4, postId: a.id },
    ]);
    await setHighlights(db, [null, null, null, null, null]);
    expect(await db.select().from(homeHighlights)).toEqual([]);
  });

  it("rejeita repetição, rascunho e quantidade de posições diferente de 5", async () => {
    const a = await savePost(db, base({ title: "Rep A", status: "published" }), userId);
    const d = await savePost(db, base({ title: "Rep rascunho" }), userId);
    await expect(setHighlights(db, [a.id, a.id, null, null, null])).rejects.toBeInstanceOf(ValidationError);
    await expect(setHighlights(db, [d.id, null, null, null, null])).rejects.toBeInstanceOf(ValidationError);
    await expect(setHighlights(db, [a.id])).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("savePage", () => {
  it("atualiza título, texto e updatedAt", async () => {
    const [before] = await db.select().from(pages).where(eq(pages.slug, "sobre"));
    await new Promise((r) => setTimeout(r, 15));
    await savePage(db, "sobre", { title: "Sobre nós", body: "Texto novo." });
    const [after] = await db.select().from(pages).where(eq(pages.slug, "sobre"));
    expect(after.title).toBe("Sobre nós");
    expect(after.body).toBe("Texto novo.");
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });

  it("rejeita slug desconhecido e título ou texto vazios", async () => {
    await expect(savePage(db, "contato", { title: "x", body: "y" })).rejects.toBeInstanceOf(ValidationError);
    await expect(savePage(db, "sobre", { title: " ", body: "y" })).rejects.toBeInstanceOf(ValidationError);
    await expect(savePage(db, "sobre", { title: "x", body: "" })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("setSetting", () => {
  const read = async () =>
    (await db.select().from(settings).where(eq(settings.key, "whatsapp_channel_url")))[0]?.value;

  it("rejeita URL que não é de canal do WhatsApp", async () => {
    await expect(setSetting(db, "whatsapp_channel_url", "https://exemplo.com")).rejects.toBeInstanceOf(
      ValidationError,
    );
    for (const v of [
      "http://whatsapp.com/channel/abc",
      "https://whatsapp.com.evil.com/channel/abc",
      "https://whatsapp.com@evil.com/channel/abc",
      "https://evil.com/?https://whatsapp.com/channel/abc",
      "https://whatsapp.com/channel/",
      "https://whatsapp.com/outra/abc",
      "javascript:alert(1)",
    ]) {
      await expect(setSetting(db, "whatsapp_channel_url", v)).rejects.toBeInstanceOf(ValidationError);
    }
    expect(await read()).toBe("");
  });

  it("aceita as duas formas do domínio e o valor vazio (que desliga o botão)", async () => {
    await setSetting(db, "whatsapp_channel_url", "https://whatsapp.com/channel/0029VaAbc123");
    expect(await read()).toBe("https://whatsapp.com/channel/0029VaAbc123");
    await setSetting(db, "whatsapp_channel_url", "  https://www.whatsapp.com/channel/0029VaAbc123  ");
    expect(await read()).toBe("https://www.whatsapp.com/channel/0029VaAbc123");
    await setSetting(db, "whatsapp_channel_url", "");
    expect(await read()).toBe("");
  });

  it("rejeita chave desconhecida", async () => {
    // @ts-expect-error chave fora de SettingKey
    await expect(setSetting(db, "outra_chave", "x")).rejects.toBeInstanceOf(ValidationError);
  });
});
