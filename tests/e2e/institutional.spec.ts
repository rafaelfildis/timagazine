import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const graves = async (page: import("@playwright/test").Page) =>
  (await new AxeBuilder({ page }).analyze()).violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );

test("Sobre: vídeo não toca ao carregar, sem autoplay, e sem violações graves", async ({ page }) => {
  const res = await page.goto("/sobre");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const video = page.locator("video");
  await expect(video).toHaveCount(1);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  expect(await video.evaluate((v: HTMLVideoElement) => v.autoplay)).toBe(false);
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("preload", "none");
  expect(await graves(page)).toEqual([]);
});

test("Contato: envio válido mostra a confirmação", async ({ page }) => {
  await page.goto("/contato");
  await page.getByLabel("Nome").fill("Maria Souza");
  await page.getByLabel("E-mail").fill("maria@example.com");
  await page.getByLabel("Assunto").selectOption("pauta");
  await page.getByLabel("Mensagem").fill("Sugestão de pauta sobre governança de TI.");
  await page.getByLabel(/Li e concordo/).check();
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByRole("status")).toContainText("Mensagem enviada");
});

test("Contato: sem consentimento mostra o erro ligado ao campo", async ({ page }) => {
  await page.goto("/contato");
  await page.getByLabel("Nome").fill("Maria Souza");
  await page.getByLabel("E-mail").fill("maria@example.com");
  await page.getByLabel("Assunto").selectOption("outro");
  await page.getByLabel("Mensagem").fill("Mensagem de teste sem consentimento.");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  const consent = page.getByLabel(/Li e concordo/);
  await expect(consent).toHaveAttribute("aria-invalid", "true");
  await expect(consent).toHaveAttribute("aria-describedby", "err-consent");
  await expect(page.locator("#err-consent")).toContainText("Política de Privacidade");
  // O que foi digitado permanece.
  await expect(page.getByLabel("Nome")).toHaveValue("Maria Souza");
  expect(await graves(page)).toEqual([]);
});

test("Contato: sem violações graves de acessibilidade", async ({ page }) => {
  await page.goto("/contato");
  expect(await graves(page)).toEqual([]);
});

for (const slug of ["politica-editorial", "politica-de-privacidade", "termos-de-uso"]) {
  test(`/${slug} responde 200 com título`, async ({ page }) => {
    const res = await page.goto(`/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await graves(page)).toEqual([]);
  });
}

test("Política Editorial cita IA, aprovação humana e o Contato", async ({ page }) => {
  await page.goto("/politica-editorial");
  await expect(page.getByRole("heading", { name: "Uso de inteligência artificial" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aprovação humana obrigatória" })).toBeVisible();
  await expect(page.locator("main a[href='/contato']")).toBeVisible();
});

test("slug desconhecido responde 404 e rotas estáticas não são engolidas", async ({ page }) => {
  const res = await page.goto("/qualquer-coisa");
  expect(res?.status()).toBe(404);
  for (const path of ["/noticias", "/sobre", "/contato"]) {
    const r = await page.goto(path);
    expect(r?.status(), path).toBe(200);
  }
});
