import { cache } from "react";
import { eq } from "drizzle-orm";
import { forbidden, redirect } from "next/navigation";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { authConfig } from "@/lib/auth/config";
import { checkCredentials, hasRole, type Role } from "@/lib/auth/core";

export { hasRole, verifyCredentials } from "@/lib/auth/core";
export type { Role } from "@/lib/auth/core";

/** Código devolvido na URL de erro quando o limite de tentativas é atingido. */
export class LockedOutError extends CredentialsSignin {
  code = "locked";
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    // Senha errada é fluxo normal: sem stack trace no log a cada tentativa.
    error(error) {
      if (error instanceof CredentialsSignin) return;
      console.error(error);
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? raw.email : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        const result = await checkCredentials(db, email, password);
        if (!result.ok) {
          if (result.reason === "locked") throw new LockedOutError();
          return null;
        }
        const { id, name, email: userEmail, role } = result.user;
        return { id, name, email: userEmail, role };
      },
    }),
  ],
});

/**
 * Usuário da sessão conferido no banco (papel atual, conta ainda existente).
 * O JWT vale 8 h; sem esta conferência, um usuário removido ou rebaixado
 * continuaria com o acesso antigo até o token expirar.
 */
export const getSessionUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
});

/**
 * Exige sessão válida com papel suficiente (admin inclui editor).
 * Sem sessão: redireciona para /admin/login. Papel insuficiente: 403.
 */
export async function requireRole(role: Role) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!hasRole(user.role, role)) forbidden();
  return { user };
}
