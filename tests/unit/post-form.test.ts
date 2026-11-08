import { describe, expect, it } from "vitest";
import { postFormToInput, resolveStatus } from "@/lib/posts/form";

const fd = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

const BASE = { title: "Olá", dek: "d", body: "b", categoryId: "3", modality: "noticia", origin: "propria", status: "draft" };

describe("postFormToInput", () => {
  it("converte campos de texto, número, checkbox e tags", () => {
    const { input, errors } = postFormToInput(
      fd({ ...BASE, sponsored: "on", imageAi: "on", tagNames: "IA, Nuvem ,,LGPD\nSegurança", id: "" }),
    );
    expect(errors).toEqual({});
    expect(input).toMatchObject({
      title: "Olá",
      categoryId: 3,
      sponsored: true,
      imageAi: false, // sem imagem, "gerada por IA" não vale (o servidor também zera)
      tagNames: ["IA", "Nuvem", "LGPD", "Segurança"],
      status: "keep",
      id: undefined,
    });
  });

  it("checkbox ausente vira false", () => {
    expect(postFormToInput(fd(BASE)).input).toMatchObject({ sponsored: false, imageAi: false });
  });

  it("intent publish e draft forçam o status; keep ignora o campo status enviado", () => {
    expect(postFormToInput(fd({ ...BASE, status: "draft", intent: "publish" })).input.status).toBe("published");
    expect(postFormToInput(fd({ ...BASE, status: "published", intent: "draft" })).input.status).toBe("draft");
    // keep nunca usa o status do formulário (a action preenche com o gravado)
    expect(postFormToInput(fd({ ...BASE, status: "published", intent: "keep" })).input.status).toBe("keep");
    expect(postFormToInput(fd({ ...BASE, status: "draft" })).input.status).toBe("keep");
  });

  it("resolveStatus: keep preserva o status gravado e nunca o inverte", () => {
    expect(resolveStatus("keep", "published")).toBe("published");
    expect(resolveStatus("keep", "draft")).toBe("draft");
    expect(resolveStatus("keep", undefined)).toBe("draft");
    expect(resolveStatus("publish", "draft")).toBe("published");
    expect(resolveStatus("draft", "published")).toBe("draft");
  });

  it("publishedAt vem do datetime-local no fuso da Bahia", () => {
    const { input } = postFormToInput(fd({ ...BASE, publishedAt: "2026-12-01T09:00" }));
    expect((input.publishedAt as Date).toISOString()).toBe("2026-12-01T12:00:00.000Z");
  });

  it("publishedAt preenchido mas inválido vira erro de campo", () => {
    const { errors } = postFormToInput(fd({ ...BASE, publishedAt: "ontem" }));
    expect(errors.publishedAt).toBeTruthy();
  });

  it("categoria vazia fica fora do número (o schema acusa)", () => {
    expect(postFormToInput(fd({ ...BASE, categoryId: "" })).input.categoryId).toBeUndefined();
  });
});
