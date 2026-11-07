import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Seed: i=2 é curadoria (Agência Exemplo), i=4 patrocinada, i=3 opinião.
const CURADORIA = "/noticias/ataques-de-ransomware-pressionam-orcamentos-de-seguranca";

test("matéria de curadoria mostra o crédito com link para a fonte", async ({ page }) => {
  const res = await page.goto(CURADORIA);
  expect(res?.status()).toBe(200);
  await expect(page.getByText("Com informações de")).toBeVisible();
  const link = page.getByRole("link", { name: "Agência Exemplo" });
  await expect(link).toHaveAttribute("href", "https://example.com/materia-original");
  await expect(link).toHaveAttribute("rel", /noopener/);
});

test("slug de rascunho, de matéria agendada e inexistente dão 404", async ({ page }) => {
  for (const slug of ["rascunho-de-exemplo", "agendada-de-exemplo", "nao-existe"]) {
    const res = await page.goto(`/noticias/${slug}`);
    expect(res?.status(), slug).toBe(404);
  }
});

test("tem JSON-LD NewsArticle com autor Organization", async ({ page }) => {
  await page.goto(CURADORIA);
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(raw).toContain('"@type":"NewsArticle"');
  const data = JSON.parse(raw!);
  expect(data.author).toEqual({ "@type": "Organization", name: "TI MAGAZINE" });
  expect(data.mainEntityOfPage["@id"]).toMatch(/\/noticias\/ataques-de-ransomware/);
});

test("canonical e Open Graph da matéria", async ({ page }) => {
  await page.goto(CURADORIA);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/noticias\/ataques-de-ransomware/);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test("mostra tags, compartilhar e relacionadas", async ({ page }) => {
  await page.goto(CURADORIA);
  await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar link" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Leia também" })).toBeVisible();
  await expect(page.locator('a[href^="/noticias?tag="]').first()).toBeVisible();
});

test("a visita conta uma leitura (204) e id inválido dá 404", async ({ page, request }) => {
  const pings: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/views/")) pings.push(r.status());
  });
  await page.goto(CURADORIA);
  await expect.poll(() => pings).toEqual([204]);
  const bad = await request.post("/api/views/nao-e-uuid");
  expect(bad.status()).toBe(404);
  const bot = await request.post("/api/views/11111111-1111-4111-8111-111111111111", {
    headers: { "user-agent": "Googlebot/2.1" },
  });
  expect(bot.status()).toBe(204);
});

test("sem violações críticas ou sérias de acessibilidade", async ({ page }) => {
  await page.goto(CURADORIA);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const graves = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(graves).toEqual([]);
});
