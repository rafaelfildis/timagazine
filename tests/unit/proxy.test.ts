// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";

const SECRET = "unit-test-secret-0123456789-0123456789";
let proxy: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.stubEnv("AUTH_SECRET", SECRET);
  ({ proxy } = await import("@/proxy"));
});
afterEach(() => vi.unstubAllEnvs());

const token = (cookieName: string, maxAge = 3600) =>
  encode({ token: { id: "u1", role: "admin" }, secret: SECRET, salt: cookieName, maxAge });

const req = (url: string, cookie?: string, headers: Record<string, string> = {}) =>
  new NextRequest(url, { headers: { ...(cookie ? { cookie } : {}), ...headers } });

describe("proxy do painel", () => {
  it("sem cookie redireciona ao login guardando o destino", async () => {
    const res = await proxy(req("http://localhost:3000/admin/materias?x=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?callbackUrl=%2Fadmin%2Fmaterias%3Fx%3D1",
    );
  });

  it("/admin sem cookie vai ao login sem callbackUrl; /admin/login passa direto", async () => {
    expect((await proxy(req("http://localhost:3000/admin"))).headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );
    const res = await proxy(req("http://localhost:3000/admin/login"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("cookie válido (http) passa e NÃO reemite o cookie de sessão", async () => {
    const jwt = await token("authjs.session-token");
    const res = await proxy(req("http://localhost:3000/admin/materias", `authjs.session-token=${jwt}`));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("em https lê o cookie com prefixo __Secure-, direto ou atrás de proxy", async () => {
    const jwt = await token("__Secure-authjs.session-token");
    const cookie = `__Secure-authjs.session-token=${jwt}`;
    const direct = await proxy(req("https://portal.example/admin/materias", cookie));
    expect(direct.headers.get("location")).toBeNull();
    const behind = await proxy(
      req("http://internal:3000/admin/materias", cookie, { "x-forwarded-proto": "https" }),
    );
    expect(behind.headers.get("location")).toBeNull();
  });

  it("token expirado, adulterado ou com outro segredo é recusado", async () => {
    const expired = await token("authjs.session-token", -120);
    const other = await encode({ token: { id: "x" }, secret: "outro-segredo-0123456789", salt: "authjs.session-token" });
    for (const value of [expired, other, "lixo.lixo.lixo"]) {
      const res = await proxy(req("http://localhost:3000/admin/materias", `authjs.session-token=${value}`));
      expect(res.headers.get("location")).toContain("/admin/login");
    }
  });
});
