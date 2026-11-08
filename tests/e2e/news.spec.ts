import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Seed: 14 matérias publicadas; categoria = i % 12, modalidade = i % 9.
// Cibersegurança (i=2) -> 1 matéria; Análise (i=2, 11) -> 2; as duas juntas -> só i=2.
const TOTAL = 14;

async function open(page: Page, url: string) {
  await page.goto(url);
  // Só interage depois da hidratação (antes disso o formulário age como GET sem JS).
  await expect(page.locator('form[data-hydrated="true"]')).toBeAttached();
}

test("filtros vão para a URL e a contagem bate com o seed", async ({ page }) => {
  await open(page, "/noticias");
  await expect(page.getByRole("heading", { level: 1, name: "Notícias" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: `${TOTAL} resultados` })).toBeVisible();

  await page.getByLabel("Categoria").selectOption("ciberseguranca");
  await expect(page).toHaveURL(/categoria=ciberseguranca/);
  await page.getByLabel("Modalidade").selectOption("analise");
  await expect(page).toHaveURL(/categoria=ciberseguranca&modalidade=analise/);
  await expect(page.getByRole("heading", { level: 2, name: "1 resultado" })).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator('[aria-live="polite"]')).toContainText("1 resultado");
});

test("abrir uma matéria e voltar mantém filtros e página", async ({ page }) => {
  await open(page, "/noticias");
  await page.getByLabel("Modalidade").selectOption("analise");
  await expect(page).toHaveURL(/modalidade=analise/);
  await expect(page.getByRole("heading", { level: 2, name: "2 resultados" })).toBeVisible();
  const url = page.url();
  await page.locator("main article h3 a").first().click();
  await expect(page).toHaveURL(/\/noticias\/[^/?]+$/);
  await page.goBack();
  await expect(page).toHaveURL(url);
  await expect(page.getByLabel("Modalidade")).toHaveValue("analise");
  await expect(page.getByRole("heading", { level: 2, name: "2 resultados" })).toBeVisible();

  // Segunda página (12 por página; 14 no seed).
  await page.goto("/noticias?pagina=2");
  await expect(page.locator("main article")).toHaveCount(2);
  await page.locator("main article h3 a").first().click();
  await expect(page).toHaveURL(/\/noticias\/[^/?]+$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/noticias\?pagina=2$/);
  await expect(page.locator("main article")).toHaveCount(2);
});

test("paginação: 12 por página, nav acessível e links preservam filtros", async ({ page }) => {
  await open(page, "/noticias");
  await expect(page.locator("main article")).toHaveCount(12);
  const nav = page.getByRole("navigation", { name: "Paginação" });
  await expect(nav.getByRole("link", { name: "Página 2" })).toHaveAttribute("href", "/noticias?pagina=2");
  await expect(nav.locator('[aria-current="page"]')).toHaveText("1");
  await nav.getByRole("link", { name: "Próxima" }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(page.locator("main article")).toHaveCount(2);
});

test("limpar filtros leva de volta a /noticias", async ({ page }) => {
  await open(page, "/noticias?categoria=ciberseguranca&modalidade=analise");
  await page.getByRole("link", { name: "Limpar filtros", exact: true }).click();
  await expect(page).toHaveURL(/\/noticias$/);
  await expect(page.getByRole("heading", { level: 2, name: `${TOTAL} resultados` })).toBeVisible();
  await expect(page.getByLabel("Categoria")).toHaveValue("");
});

test("Enter sem mudança, busca e 'Limpar filtros': os campos voltam ao vazio e q não é reaplicado", async ({ page }) => {
  await open(page, "/noticias");
  const busca = page.locator('form[aria-label="Filtros"]').getByLabel("Buscar");
  await busca.press("Enter");
  await busca.fill("ia");
  await expect(page).toHaveURL(/[?&]q=ia(&|$)/);
  await page.getByRole("link", { name: "Limpar filtros", exact: true }).click();
  await expect(page).toHaveURL(/\/noticias$/);
  await expect(busca).toHaveValue("");
  await expect(page.getByLabel("Ordenar por")).toHaveValue("recentes");
  await page.getByLabel("Categoria").selectOption("ciberseguranca");
  await expect(page).toHaveURL(/\/noticias\?categoria=ciberseguranca$/);
});

test("mudar um filtro volta para a primeira página", async ({ page }) => {
  await open(page, "/noticias?pagina=2");
  await page.getByLabel("Modalidade").selectOption("noticia");
  await expect(page).toHaveURL(/modalidade=noticia/);
  await expect(page).not.toHaveURL(/pagina=/);
});

test("busca com debounce coloca q na URL e ordena por relevância", async ({ page }) => {
  await open(page, "/noticias");
  await page.locator('form[aria-label="Filtros"]').getByLabel("Buscar").fill("ransomware");
  await expect(page).toHaveURL(/q=ransomware/);
  await expect(page.getByLabel("Ordenar por")).toHaveValue("relevancia");
  await expect(page.locator("main article").first()).toContainText(/ransomware/i);
});

test("busca sem resultado mostra o estado vazio com sugestão de limpar filtros", async ({ page }) => {
  await open(page, "/noticias?q=zzzzz");
  await expect(page.getByRole("heading", { level: 2, name: "0 resultados" })).toBeVisible();
  await expect(page.getByText("Nenhuma matéria encontrada")).toBeVisible();
  const clear = page.getByRole("link", { name: "Limpar todos os filtros" });
  await expect(clear).toHaveAttribute("href", "/noticias");
  await expect(page.locator("main article")).toHaveCount(0);
});

test("página inexistente mostra o estado vazio, sem erro", async ({ page }) => {
  const res = await page.goto("/noticias?pagina=99");
  expect(res?.status()).toBe(200);
  await expect(page.getByText("Esta página não existe")).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(0);
});

test("parâmetro inválido responde 200", async ({ page }) => {
  const res = await page.goto("/noticias?pagina=abc");
  expect(res?.status()).toBe(200);
  await expect(page.locator("main article")).toHaveCount(12);
});

test("filtros ativos não são indexados; paginação simples continua indexável", async ({ page }) => {
  await page.goto("/noticias?categoria=ciberseguranca");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/noticias$/);
  await page.goto("/noticias?pagina=2");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/noticias\?pagina=2$/);
  await expect(page).toHaveTitle("Notícias | TI MAGAZINE");
});

test.describe("acessibilidade", () => {
  const serious = (r: Awaited<ReturnType<AxeBuilder["analyze"]>>) =>
    r.violations.filter((v) => v.impact === "critical" || v.impact === "serious");

  test("lista, filtros abertos, vazio e mobile sem violações críticas/sérias", async ({ page }) => {
    await open(page, "/noticias");
    await page.getByText("Tags", { exact: true }).click();
    expect(serious(await new AxeBuilder({ page }).analyze())).toEqual([]);

    await open(page, "/noticias?q=zzzzz&de=2026-01-01&ate=2026-12-31");
    expect(serious(await new AxeBuilder({ page }).analyze())).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, "/noticias?pagina=2");
    expect(serious(await new AxeBuilder({ page }).analyze())).toEqual([]);
  });
});
