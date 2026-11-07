import { expect, test } from "@playwright/test";

test.describe("celular (375 px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("menu abre e fecha pelo botão e por Esc, e o foco volta ao botão", async ({ page }) => {
    await page.goto("/");
    const botao = page.getByRole("button", { name: "Abrir menu" });
    await expect(botao).toHaveAttribute("aria-expanded", "false");

    await botao.click();
    const aberto = page.getByRole("button", { name: "Fechar menu" });
    await expect(aberto).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Notícias" })).toBeVisible();

    await aberto.click();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("link", { name: "Notícias" })).toBeHidden();

    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("link", { name: "Notícias" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Notícias" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
  });
});

test.describe("desktop (1440 px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("link ativo tem aria-current=page", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Menu principal", exact: true });
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Notícias" })).not.toHaveAttribute("aria-current", "page");
  });

  test("itens de planos futuros não aparecem", async ({ page }) => {
    await page.goto("/");
    for (const nome of ["Empresas", "Relatórios", "Eventos", "Academia"]) {
      await expect(page.getByRole("link", { name: nome, exact: true })).toHaveCount(0);
    }
  });

  test("busca envia para /noticias?q=", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByRole("searchbox").fill("nuvem");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/noticias\?q=nuvem/);
  });

  test("sem URL de WhatsApp configurada, o botão não existe", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Assine no WhatsApp")).toHaveCount(0);
  });

  test("rodapé tem políticas e skip link existe", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Política de Privacidade" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toHaveCount(1);
  });
});
