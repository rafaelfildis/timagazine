// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/lib/db/test-db";
import type { Db } from "@/lib/db/client";
import { loginAttempts, users } from "@/lib/db/schema";
import {
  LOGIN_MAX_ATTEMPTS,
  checkCredentials,
  createUser,
  hasRole,
  verifyCredentials,
} from "@/lib/auth/core";
import { safeCallbackUrl } from "@/lib/auth/redirect";

const PASSWORD = "senha-de-teste-bem-longa-123";

describe("autenticação", () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    await createUser(db, {
      email: "Ana@Exemplo.com",
      name: "Ana",
      password: PASSWORD,
      role: "editor",
    });
  });
  afterAll(() => close());

  it("guarda a senha como argon2id e normaliza o e-mail", async () => {
    const [row] = await db.select().from(users);
    expect(row.passwordHash).toMatch(/^\$argon2id\$/);
    expect(row.passwordHash).not.toContain(PASSWORD);
    expect(row.email).toBe("ana@exemplo.com");
  });

  it("retorna o usuário com a senha certa (e-mail com caixa/espaços diferentes)", async () => {
    const user = await verifyCredentials(db, "  ANA@exemplo.com ", PASSWORD);
    expect(user?.email).toBe("ana@exemplo.com");
    expect(user?.role).toBe("editor");
  });

  it("retorna null com a senha errada e registra a tentativa", async () => {
    await db.delete(loginAttempts);
    expect(await verifyCredentials(db, "ana@exemplo.com", "errada")).toBeNull();
    const rows = await db.select().from(loginAttempts);
    expect(rows).toHaveLength(1);
  });

  it("retorna null e registra a tentativa quando o usuário não existe", async () => {
    await db.delete(loginAttempts);
    expect(await verifyCredentials(db, "ninguem@exemplo.com", PASSWORD)).toBeNull();
    expect(await db.select().from(loginAttempts)).toHaveLength(1);
  });

  it("bloqueia a 6ª tentativa em 15 minutos mesmo com a senha certa", async () => {
    await db.delete(loginAttempts);
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      expect(await verifyCredentials(db, "ana@exemplo.com", "errada")).toBeNull();
    }
    expect(await verifyCredentials(db, "ana@exemplo.com", PASSWORD)).toBeNull();
    const result = await checkCredentials(db, "ana@exemplo.com", PASSWORD);
    expect(result).toEqual({ ok: false, reason: "locked" });
  });

  it("o bloqueio vale por e-mail e não afeta outro e-mail", async () => {
    await createUser(db, { email: "bia@exemplo.com", name: "Bia", password: PASSWORD, role: "admin" });
    expect(await verifyCredentials(db, "bia@exemplo.com", PASSWORD)).not.toBeNull();
  });

  it("tentativas com mais de 15 minutos não contam", async () => {
    await db.delete(loginAttempts);
    const old = new Date(Date.now() - 16 * 60_000);
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      await db.insert(loginAttempts).values({ email: "ana@exemplo.com", attemptedAt: old });
    }
    expect(await verifyCredentials(db, "ana@exemplo.com", PASSWORD)).not.toBeNull();
  });

  it("login com sucesso apaga as tentativas do e-mail", async () => {
    await db.delete(loginAttempts);
    await verifyCredentials(db, "ana@exemplo.com", "errada");
    await verifyCredentials(db, "ana@exemplo.com", "errada");
    expect(await verifyCredentials(db, "ana@exemplo.com", PASSWORD)).not.toBeNull();
    const left = await db.select().from(loginAttempts).where(eq(loginAttempts.email, "ana@exemplo.com"));
    expect(left).toHaveLength(0);
  });

  it("requisições paralelas não escapam do limite (tentativa registrada antes do argon2)", async () => {
    await db.delete(loginAttempts);
    const results = await Promise.all(
      Array.from({ length: 10 }, () => verifyCredentials(db, "ana@exemplo.com", "errada")),
    );
    expect(results.every((r) => r === null)).toBe(true);
    expect(await db.select().from(loginAttempts)).toHaveLength(10);
    expect(await checkCredentials(db, "ana@exemplo.com", PASSWORD)).toEqual({
      ok: false,
      reason: "locked",
    });
    await db.delete(loginAttempts);
  });

  it("hasRole: admin inclui editor, editor não inclui admin", () => {
    expect(hasRole("editor", "admin")).toBe(false);
    expect(hasRole("admin", "editor")).toBe(true);
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("editor", "editor")).toBe(true);
  });
});

describe("safeCallbackUrl", () => {
  it("aceita só caminhos relativos do mesmo site", () => {
    expect(safeCallbackUrl("/admin/materias?x=1")).toBe("/admin/materias?x=1");
    expect(safeCallbackUrl("/admin")).toBe("/admin");
  });
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "javascript:alert(1)",
    "admin",
    "",
    null,
    undefined,
    "/admin\n//evil.com",
    "/..//evil.com",
    "/.//evil.com",
    "/admin/..//evil.com",
    "/%2e%2e//evil.com",
    "/%2e//evil.com",
    "/noticias",
    "/administrador",
  ])("rejeita %j", (value) => {
    expect(safeCallbackUrl(value as string | null | undefined)).toBe("/admin");
  });
});

describe("getAdminOverview", () => {
  it("conta publicadas, rascunhos e mensagens não lidas e lista as 5 mais lidas", async () => {
    const { db, close } = await createTestDb();
    const { seed, seedDraftAndScheduled } = await import("@/lib/db/seed");
    const { getAdminOverview } = await import("@/lib/admin/overview");
    const { contactMessages } = await import("@/lib/db/schema");
    await seed(db, { posts: 8 });
    await seedDraftAndScheduled(db);
    await db.insert(contactMessages).values([
      { name: "A", email: "a@a.com", subject: "outro", message: "oi", consentAt: new Date() },
      { name: "B", email: "b@b.com", subject: "outro", message: "oi", consentAt: new Date(), readAt: new Date() },
    ]);
    const o = await getAdminOverview(db);
    expect(o.published).toBeGreaterThanOrEqual(8);
    expect(o.drafts).toBeGreaterThanOrEqual(1);
    expect(o.unreadMessages).toBe(1);
    expect(o.topPosts).toHaveLength(5);
    const views = o.topPosts.map((p) => p.views);
    expect(views).toEqual([...views].sort((a, b) => b - a));
    await close();
  });
});
