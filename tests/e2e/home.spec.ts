import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("desktop (1440x900)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("um único h1 com o título fixo e o primeiro destaque visível sem rolar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(
      "Tecnologia, inovação e negócios para quem lidera a transformação.",
    );
    const primeiro = page.locator('section[aria-labelledby="destaques"]').locator("article").first();
    await expect(primeiro).toBeInViewport();
  });

  test("hero com os textos fixos e botão para /noticias", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(
        "Informação qualificada, tendências de mercado e as vozes de CIOs, líderes e especialistas em um só lugar.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Leia as últimas notícias" })).toHaveAttribute(
      "href",
      "/noticias",
    );
  });

  test("destaques: 1 grande + 4 secundárias; últimas: 9 sem repetir destaques", async ({ page }) => {
    await page.goto("/");
    const destaques = page.locator('section[aria-labelledby="destaques"]');
    await expect(destaques.locator("article")).toHaveCount(5);
    const ultimas = page.locator('section[aria-labelledby="ultimas"]');
    await expect(ultimas.locator("article")).toHaveCount(9);
    const hrefs = async (loc: typeof destaques) =>
      loc.locator("article h3 a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const a = await hrefs(destaques);
    const b = await hrefs(ultimas);
    expect(a.filter((h) => b.includes(h))).toEqual([]);
  });

  test("links de categoria, 'Ver todas' e 'Carregar mais'", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Ver todas as notícias" })).toHaveAttribute("href", "/noticias");
    await expect(page.getByRole("link", { name: "Cibersegurança", exact: true })).toHaveAttribute(
      "href",
      "/noticias?categoria=ciberseguranca",
    );
    await expect(page.getByRole("link", { name: "Carregar mais" })).toHaveAttribute("href", "/noticias?pagina=2");
  });

  test("atalhos de planos futuros e seções futuras não aparecem; sem URL, não há chamada do WhatsApp", async ({
    page,
  }) => {
    await page.goto("/");
    const atalhos = page.getByRole("navigation", { name: "Atalhos" });
    await expect(atalhos.getByRole("link", { name: /Notícias diárias/ })).toHaveAttribute("href", "/noticias");
    await expect(atalhos.getByRole("link")).toHaveCount(1);
    for (const t of ["Relatório Oficial de TI", "Mural de Empresas", "Eventos e CIO Talks", "Newsletter", "Academia"]) {
      await expect(page.getByText(t)).toHaveCount(0);
    }
    await expect(page.getByText("Receba as notícias no WhatsApp")).toHaveCount(0);
    await expect(page.getByText("Assine no WhatsApp")).toHaveCount(0);
  });

  test("matéria também não mostra a chamada do WhatsApp sem URL", async ({ page }) => {
    await page.goto("/noticias/ataques-de-ransomware-pressionam-orcamentos-de-seguranca");
    await expect(page.getByRole("heading", { name: "Leia também" })).toBeVisible();
    await expect(page.getByText("Receba as notícias no WhatsApp")).toHaveCount(0);
  });

  test("sem violações críticas ou sérias de acessibilidade", async ({ page }) => {
    await page.goto("/");
    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(graves).toEqual([]);
  });
});

test.describe("celular (375 px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("sem rolagem horizontal", async ({ page }) => {
    await page.goto("/");
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test("sem violações críticas ou sérias de acessibilidade", async ({ page }) => {
    await page.goto("/");
    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(graves).toEqual([]);
  });
});

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("o globo não anima", async ({ page }) => {
    await page.goto("/");
    const name = await page.locator(".globe-strip").evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe("none");
  });
});

test.describe("movimento permitido", () => {
  test.use({ reducedMotion: "no-preference" });

  test("o globo gira", async ({ page }) => {
    await page.goto("/");
    const name = await page.locator(".globe-strip").evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe("globe-spin");
  });
});

test("o globo é decorativo (aria-hidden)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("div[aria-hidden='true']:has(svg .globe-strip)")).toHaveCount(1);
});
