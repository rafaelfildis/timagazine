import type { NextAuthConfig } from "next-auth";
import type { Role } from "./core";

export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/**
 * Parte da configuração do Auth.js que não toca o banco nem o argon2:
 * o proxy usa só isto para validar o cookie de sessão (JWT).
 */
export const authConfig = {
  providers: [],
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/admin/login" },
  // Atrás de proxy/CDN a origem vem do cabeçalho; ver AUTH_TRUST_HOST no .env.example.
  trustHost: process.env.AUTH_TRUST_HOST === "true",
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
