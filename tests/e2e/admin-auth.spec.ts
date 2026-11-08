import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Credenciais do admin de teste: só em .env.test (ignorado pelo git; ver .env.test.example).
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const semCredenciais = !EMAIL || !PASSWORD;
const AVISO = "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD ausentes: crie .env.test a partir de .env.test.example.";

async function entrar(page: Page, email: string, password: string) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("/admin sem login redireciona para /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
});

test("subpáginas do painel sem login também redirecionam, guardando o destino", async ({ page }) => {
  await page.goto("/admin/materias");
  await expect(page).toHaveURL(/\/admin\/login\?callbackUrl=%2Fadmin%2Fmaterias$/);
});

test("6 tentativas erradas no mesmo e-mail mostram a mensagem de bloqueio", async ({ page }) => {
  await page.goto("/admin/login");
  const alerta = page.getByRole("main").getByRole("alert");
  const email = `bloqueado-${Date.now()}@ti-magazine.test`; // único: retries não herdam bloqueio
  const tentar = async () => {
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/login")),
      entrar(page, email, "senha-errada-qualquer"),
    ]);
    // O React limpa o formulário após a action; espera isso terminar e o e-mail voltar.
    await expect(page.getByLabel("Senha")).toHaveValue("");
    await expect(page.getByLabel("E-mail")).toHaveValue(email);
  };
  for (let i = 0; i < 5; i++) {
    await tentar();
    await expect(alerta).toHaveText("E-mail ou senha inválidos.");
  }
  await tentar();
  await expect(alerta).toHaveText("Muitas tentativas. Tente novamente em alguns minutos.");
});

test("a tela de login é noindex e não tem violações graves de acessibilidade", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual([]);
});

test.describe("com o usuário de teste", () => {
  test.skip(semCredenciais, AVISO);

  test("senha errada mostra a mensagem genérica e não entra", async ({ page }) => {
    await page.goto("/admin/login");
    await entrar(page, EMAIL!, "senha-errada-qualquer");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("e-mail inexistente recebe a mesma mensagem", async ({ page }) => {
    await page.goto("/admin/login");
    await entrar(page, "ninguem@ti-magazine.test", "senha-errada-qualquer");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
  });

  test("login entra no painel; o cookie de sessão é httpOnly; sair volta ao login", async ({
    page,
    context,
  }) => {
    await page.goto("/admin/login");
    await entrar(page, EMAIL!, PASSWORD!);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
    for (const item of [
      "Visão geral",
      "Matérias",
      "Destaques da Home",
      "Páginas",
      "Mensagens",
      "Configurações",
    ]) {
      await expect(page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: item })).toBeVisible();
    }
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);

    const sessao = (await context.cookies()).find((c) => c.name.includes("session-token"));
    expect(sessao?.httpOnly).toBe(true);
    expect(sessao?.sameSite).toBe("Lax");

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect
      .poll(async () => (await context.cookies()).some((c) => c.name.includes("session-token")))
      .toBe(false);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("requisições ao painel não reemitem o cookie de sessão (senão um prefetch tardio desfaz o logout)", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await entrar(page, EMAIL!, PASSWORD!);
    await expect(page).toHaveURL(/\/admin$/);
    for (const [path, headers] of [
      ["/admin/materias", {}],
      ["/admin/materias", { rsc: "1", "next-router-prefetch": "1" }],
      ["/admin", { rsc: "1" }],
    ] as const) {
      const res = await page.request.get(path, { headers });
      expect(res.status(), path).toBe(200);
      const setCookies = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
      expect(setCookies.filter((h) => h.value.includes("session-token")), path).toEqual([]);
    }
  });

  test("callbackUrl relativo é respeitado; URL externa é ignorada", async ({ page, baseURL }) => {
    await page.goto("/admin/login?callbackUrl=%2Fadmin%2Fmaterias");
    await entrar(page, EMAIL!, PASSWORD!);
    await expect(page).toHaveURL(/\/admin\/materias$/);

    await page.context().clearCookies();
    await page.goto("/admin/login?callbackUrl=https%3A%2F%2Fevil.example%2F");
    await entrar(page, EMAIL!, PASSWORD!);
    await expect(page).toHaveURL(/\/admin$/);
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);

    await page.context().clearCookies();
    await page.goto("/admin/login?callbackUrl=%2Fadmin%2F..%2F%2Fevil.example%2F");
    await entrar(page, EMAIL!, PASSWORD!);
    await expect(page).toHaveURL(/\/admin$/);
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
  });
});
