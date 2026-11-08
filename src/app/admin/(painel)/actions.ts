"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { searchPublishedPosts } from "@/lib/admin/lists";
import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { posts } from "@/lib/db/schema";
import { postFormToInput, resolveStatus } from "@/lib/posts/form";
import {
  HIGHLIGHT_POSITIONS,
  ValidationError,
  savePage,
  savePost,
  setHighlights,
  setSetting,
} from "@/lib/posts/mutations";

/*
 * Regra do painel: TODA server action começa com requireRole (o layout e o proxy não
 * bastam). Matérias, destaques e mensagens pedem `editor`; páginas institucionais e
 * configurações pedem `admin`. Depois de cada mutação: revalidatePath("/", "layout"),
 * que renova o layout do site (botão do WhatsApp) e todas as páginas públicas.
 */

export type FormState = {
  ok?: boolean;
  /** Status da matéria depois de salvar (para o formulário refletir o real). */
  status?: "draft" | "published";
  message?: string;
  errors?: Record<string, string>;
} | null;

const refreshSite = () => revalidatePath("/", "layout");

/** Erros de validação viram estado do formulário; qualquer outro erro sobe. */
function asFormState(error: unknown): FormState {
  if (error instanceof ValidationError) return { errors: error.fieldErrors };
  throw error;
}

export async function savePostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireRole("editor");
  const { input, errors } = postFormToInput(formData);
  if (Object.keys(errors).length) return { errors };

  if ((input.status as string) === "keep") {
    const [row] = input.id
      ? await db.select({ status: posts.status }).from(posts).where(eq(posts.id, input.id)).limit(1)
      : [];
    input.status = resolveStatus("keep", row?.status);
  }

  let saved: { id: string; slug: string };
  try {
    saved = await savePost(db, input, user.id);
  } catch (error) {
    return asFormState(error);
  }
  refreshSite();
  if (!input.id) redirect(`/admin/materias/${saved.id}?salvo=1`);
  return {
    ok: true,
    status: input.status,
    message: input.status === "published" ? "Matéria salva e publicada." : "Rascunho salvo.",
  };
}

export async function saveHighlightsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("editor");
  const ids = Array.from({ length: HIGHLIGHT_POSITIONS }, (_, i) => {
    const v = formData.get(`slot${i + 1}`);
    return typeof v === "string" && v ? v : null;
  });
  try {
    await setHighlights(db, ids);
  } catch (error) {
    return asFormState(error);
  }
  refreshSite();
  return { ok: true, message: "Destaques da Home salvos." };
}

/** Busca para os Destaques: lê o banco, mas só para quem é do painel. */
export async function searchPostsAction(q: string): Promise<{ id: string; title: string }[]> {
  await requireRole("editor");
  return searchPublishedPosts(db, typeof q === "string" ? q : "");
}

export async function savePageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const slug = String(formData.get("slug") ?? "");
  try {
    await savePage(db, slug, {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
  } catch (error) {
    return asFormState(error);
  }
  refreshSite();
  return { ok: true, message: "Página salva." };
}

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  try {
    await setSetting(db, "whatsapp_channel_url", String(formData.get("whatsapp_channel_url") ?? ""));
  } catch (error) {
    return asFormState(error);
  }
  refreshSite();
  return { ok: true, message: "Configurações salvas." };
}
