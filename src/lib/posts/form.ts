import { bahiaInputToDate } from "./datetime";
import type { PostInputData } from "./mutations";

const text = (f: FormData, name: string): string => {
  const v = f.get(name);
  return typeof v === "string" ? v : "";
};
const checked = (f: FormData, name: string) => f.get(name) === "on";

/**
 * FormData do PostForm → entrada do `savePost`. Os botões mandam `intent`:
 * "draft" e "publish" forçam o status; "keep" (ou ausente) NÃO muda o status: o campo
 * `status` do formulário é ignorado e a action usa o status gravado (ver `resolveStatus`).
 * Erros que só existem na conversão (data ilegível) voltam em `errors`.
 */
/** Status final: os botões decidem; "keep" preserva o status gravado (rascunho se a matéria é nova). */
export function resolveStatus(
  intent: string,
  stored: "draft" | "published" | undefined,
): "draft" | "published" {
  if (intent === "publish") return "published";
  if (intent === "draft") return "draft";
  return stored ?? "draft";
}

export function postFormToInput(f: FormData): {
  input: PostInputData;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const intent = text(f, "intent");
  // "keep" precisa do status gravado: a action completa isso (aqui fica só o que o botão decide).
  const status = intent === "publish" ? "published" : intent === "draft" ? "draft" : "keep";

  const rawDate = text(f, "publishedAt").trim();
  const publishedAt = bahiaInputToDate(rawDate);
  if (rawDate && !publishedAt) errors.publishedAt = "Data e hora inválidas.";

  const rawCategory = text(f, "categoryId").trim();
  const imageUrl = text(f, "imageUrl");

  const input = {
    id: text(f, "id") || undefined,
    title: text(f, "title"),
    dek: text(f, "dek"),
    slug: text(f, "slug"),
    body: text(f, "body"),
    categoryId: rawCategory ? Number(rawCategory) : undefined,
    modality: text(f, "modality"),
    origin: text(f, "origin"),
    sourceName: text(f, "sourceName"),
    sourceUrl: text(f, "sourceUrl"),
    sponsored: checked(f, "sponsored"),
    imageUrl,
    imageAlt: text(f, "imageAlt"),
    imageAi: !!imageUrl.trim() && checked(f, "imageAi"),
    takeaways: text(f, "takeaways"),
    correctionNote: text(f, "correctionNote"),
    tagNames: text(f, "tagNames")
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean),
    status,
    publishedAt,
  } as unknown as PostInputData;

  return { input, errors };
}
