import { createHash } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";

export const CONTACT_SUBJECTS = [
  { value: "pauta", label: "Pauta" },
  { value: "correcao", label: "Correção" },
  { value: "imprensa", label: "Imprensa" },
  { value: "parcerias", label: "Parcerias e patrocínio" },
  { value: "outro", label: "Outro" },
] as const;

export const MAX_PER_HOUR = 5;

export type ContactResult = { ok: boolean; errors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome (mínimo 2 caracteres).").max(120, "O nome pode ter no máximo 120 caracteres."),
  email: z.string().trim().email("Informe um e-mail válido.").max(254, "E-mail muito longo."),
  subject: z.enum(["pauta", "correcao", "imprensa", "parcerias", "outro"], {
    error: "Escolha um assunto.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Escreva ao menos 10 caracteres.")
    .max(5000, "A mensagem pode ter no máximo 5000 caracteres."),
  consent: z.literal("on", { error: "É preciso concordar com a Política de Privacidade." }),
});

/** sha256(IP + AUTH_SECRET): o IP bruto nunca é gravado. */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.AUTH_SECRET ?? "dev-secret"))
    .digest("hex");
}

/** Núcleo testável do formulário de contato (sem contexto de requisição do Next). */
export async function handleContact(
  db: Db,
  input: Record<string, unknown>,
  ip: string,
): Promise<ContactResult> {
  // Honeypot: robôs preenchem; fingimos sucesso e não gravamos nada.
  if (typeof input.website === "string" && input.website.trim() !== "") return { ok: true };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }

  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(and(eq(contactMessages.ipHash, ipHash), gt(contactMessages.createdAt, since)));
  if (n >= MAX_PER_HOUR) {
    return {
      ok: false,
      errors: { form: "Muitas mensagens enviadas em pouco tempo. Tente novamente em algumas horas." },
    };
  }

  const { name, email, subject, message } = parsed.data;
  await db.insert(contactMessages).values({
    name,
    email,
    subject,
    message,
    consentAt: new Date(),
    ipHash,
  });
  return { ok: true };
}
