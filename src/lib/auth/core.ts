import { and, eq, gte, lt, sql } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import type { Db } from "@/lib/db/client";
import { loginAttempts, users } from "@/lib/db/schema";

export type Role = "admin" | "editor";
export type User = typeof users.$inferSelect;

/** Limite de falhas de login por e-mail dentro da janela. */
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60_000;
export const MIN_PASSWORD_LENGTH = 12;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** admin inclui editor. */
export function hasRole(userRole: Role, required: Role): boolean {
  return userRole === "admin" || userRole === required;
}

// `@node-rs/argon2` usa argon2id por padrão (algoritmo e parâmetros OWASP).
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

// Hash descartável: quando o e-mail não existe, ainda pagamos o custo de um verify
// para o tempo de resposta não revelar quais e-mails têm conta.
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  dummyHash ??= hash("senha-descartavel-para-igualar-o-tempo");
  return dummyHash;
}

export async function createUser(
  db: Db,
  input: { email: string; name: string; password: string; role: Role },
): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({
      email: normalizeEmail(input.email),
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
    })
    .returning();
  return row;
}

export type CredentialsResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid" | "locked" };

/**
 * Confere e-mail e senha aplicando o limite de tentativas (5 falhas por e-mail em 15 min).
 * Toda tentativa é registrada antes da conferência (e apagada no sucesso); acima do limite a senha nem é conferida.
 */
export async function checkCredentials(
  db: Db,
  email: string,
  password: string,
): Promise<CredentialsResult> {
  const normalized = normalizeEmail(email);
  if (
    !normalized ||
    normalized.length > MAX_EMAIL_LENGTH ||
    !password ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return { ok: false, reason: "invalid" };
  }

  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  // Limpeza oportunista das tentativas vencidas deste e-mail.
  await db
    .delete(loginAttempts)
    .where(and(eq(loginAttempts.email, normalized), lt(loginAttempts.attemptedAt, since)));
  // Registra a tentativa ANTES de conferir a senha e conta incluindo-a: requisições
  // paralelas não escapam do limite enquanto o argon2 roda. Sucesso apaga as tentativas.
  await db.insert(loginAttempts).values({ email: normalized });
  const [{ attempts }] = await db
    .select({ attempts: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, normalized), gte(loginAttempts.attemptedAt, since)));
  if (attempts > LOGIN_MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  const valid = await verify(user?.passwordHash ?? (await getDummyHash()), password).catch(
    () => false,
  );
  if (!user || !valid) return { ok: false, reason: "invalid" };

  await db.delete(loginAttempts).where(eq(loginAttempts.email, normalized));
  return { ok: true, user };
}

export async function verifyCredentials(
  db: Db,
  email: string,
  password: string,
): Promise<User | null> {
  const result = await checkCredentials(db, email, password);
  return result.ok ? result.user : null;
}
