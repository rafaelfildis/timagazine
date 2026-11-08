import { and, eq, inArray, like, ne, or } from "drizzle-orm";
import { z } from "zod";
import { MODALITY_VALUES } from "@/config/taxonomy";
import type { Db } from "@/lib/db/client";
import {
  categories,
  homeHighlights,
  pages,
  postTags,
  posts,
  settings,
  tags,
} from "@/lib/db/schema";
import type { SettingKey } from "@/lib/settings";
import { readingMinutes } from "./reading-time";
import { slugify } from "./slug";

/*
 * Invalidação de cache: este módulo só fala com o banco (e é testado com PGlite).
 * Quem chama (as server actions em src/app/admin/(painel)/actions.ts) faz, depois de
 * CADA mutação, `revalidatePath("/", "layout")`: isso renova a leitura do WhatsApp no
 * layout (site) e todas as páginas públicas (Home, /noticias, matéria, políticas) de
 * uma vez, sem precisar listar o caminho de cada matéria.
 */

/** Erros de validação com mensagem por campo (chave = nome do campo do formulário). */
export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super(Object.values(fieldErrors)[0] ?? "Dados inválidos.");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

// --- helpers de schema -----------------------------------------------------

/** Texto opcional: vazio vira undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .max(max, `Use no máximo ${max} caracteres.`)
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : undefined));

const isHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/** Imagens: enviadas pelo painel (/uploads ou Vercel Blob) ou da pasta /brand. next/image só tem essas origens liberadas. */
const BLOB_HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;
export function isAllowedImageUrl(value: string): boolean {
  if (/^\/(uploads|brand)\/[A-Za-z0-9._/-]+$/.test(value) && !value.includes("..")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && BLOB_HOST.test(u.hostname) && !u.username && !u.password;
  } catch {
    return false;
  }
}

const ENUM_MSG = "Escolha uma opção válida.";

export const PostInput = z
  .object({
    id: z
      .uuid("Matéria inválida.")
      .nullish()
      .transform((v) => v ?? undefined),
    title: z.string().trim().min(1, "Informe o título.").max(200, "Use no máximo 200 caracteres."),
    dek: z.string().trim().max(400, "Use no máximo 400 caracteres."),
    slug: optionalText(120),
    body: z.string().max(200_000, "O texto está grande demais."),
    categoryId: z.number({ error: "Escolha a categoria." }).int(ENUM_MSG),
    modality: z.enum(MODALITY_VALUES, { error: ENUM_MSG }),
    origin: z.enum(["curadoria", "propria"], { error: ENUM_MSG }),
    sourceName: optionalText(200),
    sourceUrl: optionalText(2000),
    sponsored: z.boolean(),
    imageUrl: optionalText(2000),
    imageAlt: optionalText(300),
    imageAi: z.boolean(),
    takeaways: optionalText(20_000),
    correctionNote: optionalText(2000),
    tagNames: z
      .array(z.string().trim().max(40, "Cada tag tem no máximo 40 caracteres."))
      .max(10, "Use no máximo 10 tags."),
    status: z.enum(["draft", "published"], { error: ENUM_MSG }),
    publishedAt: z
      .date()
      .nullish()
      .transform((v) => v ?? undefined),
  })
  .superRefine((v, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (v.origin === "curadoria") {
      if (!v.sourceName) add("sourceName", "Informe o nome da fonte da curadoria.");
      if (!v.sourceUrl) add("sourceUrl", "Informe o link da fonte da curadoria.");
    }
    if (v.sourceUrl && !isHttpUrl(v.sourceUrl)) {
      add("sourceUrl", "Use um link completo que comece com http:// ou https://.");
    }
    if (v.imageUrl) {
      if (!isAllowedImageUrl(v.imageUrl)) add("imageUrl", "Envie a imagem pelo painel.");
      if (!v.imageAlt) add("imageAlt", "Descreva a imagem (texto alternativo).");
    }
    if (v.slug !== undefined && !slugify(v.slug)) add("slug", "Use letras ou números no endereço.");
    if (v.status === "published") {
      if (!v.dek) add("dek", "Escreva a linha fina antes de publicar.");
      if (!v.body.trim()) add("body", "Escreva o texto antes de publicar.");
    }
  });

/** Dados aceitos pelo formulário (antes da validação). */
export type PostInputData = z.input<typeof PostInput>;

function fromZod(error: z.ZodError): ValidationError {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return new ValidationError(fieldErrors);
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw fromZod(result.error);
  return result.data;
}

// --- matérias --------------------------------------------------------------

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

async function uniqueSlug(tx: Tx, base: string, selfId?: string): Promise<string> {
  const rows = await tx
    .select({ slug: posts.slug })
    .from(posts)
    .where(
      and(
        or(eq(posts.slug, base), like(posts.slug, `${base}-%`)),
        selfId ? ne(posts.id, selfId) : undefined,
      ),
    );
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

async function syncTags(tx: Tx, postId: string, names: string[]) {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  await tx.delete(postTags).where(eq(postTags.postId, postId));
  if (bySlug.size === 0) return;
  await tx
    .insert(tags)
    .values([...bySlug].map(([slug, name]) => ({ slug, name })))
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.slug, [...bySlug.keys()]));
  await tx.insert(postTags).values(rows.map((t) => ({ postId, tagId: t.id })));
}

/**
 * Cria ou edita uma matéria (com `id`). Valida, gera o slug único (-2, -3…), recalcula o
 * tempo de leitura e grava tags e matéria na mesma transação. Edição mantém o slug a menos
 * que um slug seja informado; `publishedAt` já existente é preservado quando não vem outro.
 */
export async function savePost(
  db: Db,
  input: PostInputData,
  userId: string,
): Promise<{ id: string; slug: string }> {
  const data = parse(PostInput, input);

  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [category] = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, data.categoryId))
          .limit(1);
        if (!category) throw new ValidationError({ categoryId: "Escolha a categoria." });

        const existing = data.id
          ? (await tx.select().from(posts).where(eq(posts.id, data.id)).limit(1))[0]
          : undefined;
        if (data.id && !existing) throw new ValidationError({ form: "Matéria não encontrada." });

        const wanted = data.slug ? slugify(data.slug) : existing ? existing.slug : slugify(data.title);
        const slug = await uniqueSlug(tx, wanted || "materia", existing?.id);

        const now = new Date();
        const publishedAt =
          data.publishedAt ?? existing?.publishedAt ?? (data.status === "published" ? now : null);

        const values = {
          slug,
          title: data.title,
          dek: data.dek,
          body: data.body,
          categoryId: data.categoryId,
          modality: data.modality,
          origin: data.origin,
          sponsored: data.sponsored,
          // Fonte só faz sentido (e só é exibida) em curadoria.
          sourceName: data.origin === "curadoria" ? (data.sourceName ?? null) : null,
          sourceUrl: data.origin === "curadoria" ? (data.sourceUrl ?? null) : null,
          imageUrl: data.imageUrl ?? null,
          imageAlt: data.imageUrl ? (data.imageAlt ?? null) : null,
          imageAi: data.imageUrl ? data.imageAi : false,
          takeaways: data.takeaways ?? null,
          correctionNote: data.correctionNote ?? null,
          status: data.status,
          publishedAt,
          updatedAt: now,
          readingMinutes: readingMinutes(`${data.body}\n${data.takeaways ?? ""}`),
        };

        let id: string;
        if (existing) {
          await tx.update(posts).set(values).where(eq(posts.id, existing.id));
          id = existing.id;
        } else {
          [{ id }] = await tx
            .insert(posts)
            .values({ ...values, authorId: userId })
            .returning({ id: posts.id });
        }
        await syncTags(tx, id, data.tagNames);
        return { id, slug };
      });
    } catch (error) {
      // Duas gravações simultâneas com o mesmo título: tenta de novo e pega o próximo sufixo.
      if (isUniqueViolation(error) && attempt < 4) continue;
      throw error;
    }
  }
}

// --- destaques da Home -----------------------------------------------------

export const HIGHLIGHT_POSITIONS = 5;

/** Define as 5 posições da Home (`null` = vazio, completa com as mais recentes). Só matérias publicadas, sem repetir. */
export async function setHighlights(db: Db, ids: (string | null)[]): Promise<void> {
  if (ids.length !== HIGHLIGHT_POSITIONS) {
    throw new ValidationError({ form: `Informe as ${HIGHLIGHT_POSITIONS} posições.` });
  }
  const chosen = ids.filter((id): id is string => !!id);
  if (new Set(chosen).size !== chosen.length) {
    throw new ValidationError({ form: "A mesma matéria não pode ocupar duas posições." });
  }
  if (!chosen.every((id) => z.uuid().safeParse(id).success)) {
    throw new ValidationError({ form: "Matéria inválida." });
  }
  await db.transaction(async (tx) => {
    if (chosen.length) {
      const found = await tx
        .select({ id: posts.id })
        .from(posts)
        .where(and(inArray(posts.id, chosen), eq(posts.status, "published")));
      if (found.length !== chosen.length) {
        throw new ValidationError({ form: "Escolha apenas matérias publicadas que existam." });
      }
    }
    await tx.delete(homeHighlights);
    const rows = ids.flatMap((postId, i) => (postId ? [{ position: i + 1, postId }] : []));
    if (rows.length) await tx.insert(homeHighlights).values(rows);
  });
}

// --- páginas institucionais ------------------------------------------------

export const PAGE_SLUGS = [
  "sobre",
  "politica-de-privacidade",
  "termos-de-uso",
  "politica-editorial",
] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

const PageInput = z.object({
  slug: z.enum(PAGE_SLUGS, { error: "Página desconhecida." }),
  title: z.string().trim().min(1, "Informe o título.").max(200, "Use no máximo 200 caracteres."),
  body: z
    .string()
    .trim()
    .min(1, "Escreva o texto da página.")
    .max(200_000, "O texto está grande demais."),
});

export async function savePage(
  db: Db,
  slug: string,
  input: { title: string; body: string },
): Promise<void> {
  const data = parse(PageInput, { slug, ...input });
  await db
    .insert(pages)
    .values({ slug: data.slug, title: data.title, body: data.body })
    .onConflictDoUpdate({
      target: pages.slug,
      set: { title: data.title, body: data.body, updatedAt: new Date() },
    });
}

// --- configurações ---------------------------------------------------------

/** Canal do WhatsApp: https://whatsapp.com/channel/<id> (ou www.), ou vazio. Devolve null se inválido. */
function whatsappChannelUrl(value: string): string | null {
  if (value === "") return "";
  try {
    const u = new URL(value);
    const ok =
      u.protocol === "https:" &&
      (u.hostname === "whatsapp.com" || u.hostname === "www.whatsapp.com") &&
      !u.username &&
      !u.password &&
      !u.port &&
      /^\/channel\/[A-Za-z0-9_-]+\/?$/.test(u.pathname);
    return ok ? value : null;
  } catch {
    return null;
  }
}

const SETTING_RULES: Record<SettingKey, (value: string) => string | null> = {
  whatsapp_channel_url: whatsappChannelUrl,
};
const SETTING_ERRORS: Record<SettingKey, string> = {
  whatsapp_channel_url:
    "Use o link do canal, no formato https://whatsapp.com/channel/…, ou deixe vazio.",
};

export async function setSetting(db: Db, key: SettingKey, value: string): Promise<void> {
  const rule = Object.hasOwn(SETTING_RULES, key) ? SETTING_RULES[key] : undefined;
  if (!rule) throw new ValidationError({ form: "Configuração desconhecida." });
  const clean = rule(value.trim());
  if (clean === null) throw new ValidationError({ [key]: SETTING_ERRORS[key] });
  await db
    .insert(settings)
    .values({ key, value: clean })
    .onConflictDoUpdate({ target: settings.key, set: { value: clean } });
}
