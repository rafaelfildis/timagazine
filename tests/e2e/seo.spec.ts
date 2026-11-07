import { expect, test } from "@playwright/test";

test("sitemap lista matérias publicadas e não o rascunho nem a agendada", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain("/noticias</loc>");
  expect(xml).toContain("/sobre</loc>");
  expect(xml).toContain("/politica-editorial</loc>");
  expect(xml).toContain("/noticias/modelos-de-linguagem-chegam-ao-atendimento-corporativo</loc>");
  expect(xml).not.toContain("rascunho-de-exemplo");
  expect(xml).not.toContain("agendada-de-exemplo");
  expect(xml).not.toContain("/admin");
});

test("robots bloqueia /admin e /api e aponta o sitemap", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toMatch(/Disallow: \/admin/);
  expect(txt).toMatch(/Disallow: \/api/);
  expect(txt).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test("feed.xml é RSS válido com no máximo 30 itens", async ({ request, page }) => {
  const res = await request.get("/feed.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await res.text();
  const info = await page.evaluate((src) => {
    const doc = new DOMParser().parseFromString(src, "application/xml");
    return {
      error: doc.getElementsByTagName("parsererror").length,
      root: doc.documentElement.tagName,
      version: doc.documentElement.getAttribute("version"),
      items: doc.getElementsByTagName("item").length,
      links: Array.from(doc.querySelectorAll("item > link")).map((n) => n.textContent ?? ""),
    };
  }, xml);
  expect(info.error).toBe(0);
  expect(info.root).toBe("rss");
  expect(info.version).toBe("2.0");
  expect(info.items).toBeGreaterThan(0);
  expect(info.items).toBeLessThanOrEqual(30);
  for (const l of info.links) expect(l).toMatch(/^https?:\/\/.+\/noticias\/[a-z0-9-]+$/);
  expect(xml).not.toContain("rascunho-de-exemplo");
  expect(xml).not.toContain("agendada-de-exemplo");
});

test("rota inexistente responde 404 com a página de erro", async ({ page }) => {
  const res = await page.goto("/rota-que-nao-existe");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Ir para a Home" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("main").getByRole("link", { name: "Ver notícias" })).toHaveAttribute("href", "/noticias");
  await expect(page.getByRole("banner")).toBeVisible();
});

test("matéria inexistente também mostra a página 404", async ({ page }) => {
  const res = await page.goto("/noticias/nao-existe-mesmo");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
});
