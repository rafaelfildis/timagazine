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
