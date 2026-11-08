import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home responde 200, usa pt-BR e não tem violações críticas de acessibilidade", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator('html[lang="pt-BR"]')).toHaveCount(1);

  const { violations } = await new AxeBuilder({ page }).analyze();
  const graves = violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(graves).toEqual([]);
});

test("cabeçalhos de segurança em páginas, painel, API e arquivos estáticos", async ({ request }) => {
  for (const path of ["/", "/noticias", "/admin/login", "/feed.xml", "/brand/capa-padrao.jpg"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    const h = res.headers();
    expect(h["x-frame-options"], path).toBe("DENY");
    expect(h["content-security-policy"], path).toBe("frame-ancestors 'none'");
    expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(h["x-content-type-options"], path).toBe("nosniff");
  }
});
