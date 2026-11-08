import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Só confere se há um JWT de sessão válido (sem banco). O papel é checado por
 * requireRole() em cada página e server action.
 *
 * Não usa o wrapper `auth(...)` do Auth.js de propósito: ele reemite o cookie de sessão
 * (Set-Cookie) em TODA requisição que passa pelo proxy, inclusive prefetch das ligações do
 * menu. Uma resposta dessas chegando depois do "Sair" devolvia o cookie ao navegador e
 * desfazia o logout. `getToken` apenas lê e valida o cookie.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  // Em https o Auth.js usa o cookie com prefixo __Secure- (e o nome é o sal do JWT).
  const secure =
    req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: secure });
  if (token) return NextResponse.next();

  const login = new URL("/admin/login", req.nextUrl.origin);
  if (pathname !== "/admin") login.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/admin/:path*"] };
