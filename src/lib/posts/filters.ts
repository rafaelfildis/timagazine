import { z } from "zod";
import { CATEGORIES, MODALITY_VALUES, type Modality } from "@/config/taxonomy";

export const ORDENS = ["recentes", "antigas", "lidas", "relevancia"] as const;
export type Ordem = (typeof ORDENS)[number];

export type PostFilters = {
  q?: string;
  categoria?: string;
  modalidade?: Modality;
  /** uuid de users.id */
  autor?: string;
  /** slugs; todas precisam estar presentes (E) */
  tag?: string[];
  /** yyyy-mm-dd, dia inteiro em America/Bahia */
  de?: string;
  ate?: string;
  ordem: Ordem;
  pagina: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

const qSchema = z.string().trim().min(1).max(200);
const categoriaSchema = z.enum(CATEGORY_SLUGS);
const modalidadeSchema = z.enum(MODALITY_VALUES);
const autorSchema = z.uuid();
const ordemSchema = z.enum(ORDENS);
const paginaSchema = z.coerce.number().int().min(1).max(100_000);
const tagSchema = z.string().max(80).regex(TAG_RE);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  });

/** Primeiro valor de um parâmetro (repetido vira o primeiro). */
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function pick<T>(schema: z.ZodType<T>, v: string | string[] | undefined): T | undefined {
  const raw = first(v);
  if (raw === undefined) return undefined;
  const r = schema.safeParse(raw);
  return r.success ? r.data : undefined;
}

function parseTags(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  const parts = (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(","));
  const out: string[] = [];
  for (const p of parts) {
    const r = tagSchema.safeParse(p.trim());
    if (r.success && !out.includes(r.data)) out.push(r.data);
  }
  return out.length ? out.slice(0, 10) : undefined;
}

/** Ordem padrão: relevância com busca, recentes sem. */
const defaultOrdem = (q: string | undefined): Ordem => (q ? "relevancia" : "recentes");

/** Nunca lança: valores inválidos são descartados. */
export function parseFilters(sp: SearchParams): PostFilters {
  const q = pick(qSchema, sp.q);
  let de = pick(dateSchema, sp.de);
  let ate = pick(dateSchema, sp.ate);
  if (de && ate && de > ate) [de, ate] = [ate, de];

  let ordem = pick(ordemSchema, sp.ordem) ?? defaultOrdem(q);
  if (ordem === "relevancia" && !q) ordem = "recentes";

  const f: PostFilters = { ordem, pagina: pick(paginaSchema, sp.pagina) ?? 1 };
  const categoria = pick(categoriaSchema, sp.categoria);
  const modalidade = pick(modalidadeSchema, sp.modalidade);
  const autor = pick(autorSchema, sp.autor);
  const tag = parseTags(sp.tag);
  if (q) f.q = q;
  if (categoria) f.categoria = categoria;
  if (modalidade) f.modalidade = modalidade;
  if (autor) f.autor = autor;
  if (tag) f.tag = tag;
  if (de) f.de = de;
  if (ate) f.ate = ate;
  return f;
}

/** Serializa omitindo os padrões. `tag` vai numa única chave, separada por vírgula. */
export function filtersToSearchParams(f: PostFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categoria) p.set("categoria", f.categoria);
  if (f.modalidade) p.set("modalidade", f.modalidade);
  if (f.autor) p.set("autor", f.autor);
  if (f.tag?.length) p.set("tag", f.tag.join(","));
  if (f.de) p.set("de", f.de);
  if (f.ate) p.set("ate", f.ate);
  if (f.ordem !== defaultOrdem(f.q)) p.set("ordem", f.ordem);
  if (f.pagina > 1) p.set("pagina", String(f.pagina));
  return p;
}
