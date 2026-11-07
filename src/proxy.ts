import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

// Só confere se há um JWT de sessão válido (sem banco). O papel é checado por
// requireRole() no layout do painel.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login" || req.auth) return;
  const login = new URL("/admin/login", req.nextUrl.origin);
  if (pathname !== "/admin") login.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(login);
});

export const config = { matcher: ["/admin/:path*"] };
