import type { NextAuthConfig } from "next-auth";
import type { Role } from "./core";

export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/**
 * `AUTH_TRUST_HOST=true` liga a confiança no cabeçalho Host (proxy/CDN que não seja a Vercel).
 * Sem a variável devolve `undefined`, NUNCA `false`: o Auth.js só faz a detecção automática
 * (VERCEL, AUTH_URL, CF_PAGES, desenvolvimento) quando `trustHost` não foi definido. Um
 * `false` explícito derrubava o /admin na Vercel com UntrustedHost.
 */
export function trustHostFromEnv(value: string | undefined): true | undefined {
  return value === "true" ? true : undefined;
}

/**
 * Parte da configuração do Auth.js que não toca o banco nem o argon2:
 * o proxy usa só isto para validar o cookie de sessão (JWT).
 */
export const authConfig = {
  providers: [],
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/admin/login" },
  // Atrás de proxy/CDN a origem vem do cabeçalho; ver AUTH_TRUST_HOST no .env.example.
  trustHost: trustHostFromEnv(process.env.AUTH_TRUST_HOST),
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
