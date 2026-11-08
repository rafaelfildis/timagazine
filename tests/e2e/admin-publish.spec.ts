import AxeBuilder from "@axe-core/playwright";
import { solidPng } from "./png";
import { expect, test, type Page } from "@playwright/test";

// Credenciais do admin de teste: só em .env.test (ignorado pelo git; ver .env.test.example).
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD ausentes: crie .env.test a partir de .env.test.example.");

const PNG = solidPng();

const STAMP = String(Date.now());
const TITLE = `Publicação de teste ${STAMP}`;
const WHATSAPP = "https://whatsapp.com/channel/0029VaE2eTestChannel";

async function entrar(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(EMAIL!);
  await page.getByLabel("Senha").fill(PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** O formulário só envia pela server action depois de hidratado. */
const pronto = (page: Page, nome: string) =>
  expect(page.locator(`form[aria-label="${nome}"][data-ready="true"]`)).toBeAttached();

async function abrirEdicao(page: Page) {
  await page.goto(`/admin/materias?q=${STAMP}`);
  await page.getByRole("link", { name: TITLE }).first().click();
  await expect(page.getByRole("heading", { name: "Editar matéria" })).toBeVisible();
  await pronto(page, "Matéria");
}

let slug = "";

test.describe.configure({ mode: "serial" });

test("cria uma matéria com imagem, extras e publica: aparece na Home, em /noticias e na matéria", async ({ page }) => {
  await entrar(page);
  await page.goto("/admin/materias/nova");
  await pronto(page, "Matéria");

  // Erro de validação: acessível, sem perder o que foi digitado.
  await page.getByRole("textbox", { name: /^Título/ }).fill(TITLE);
  await page.getByRole("button", { name: "Publicar" }).click();
  const resumo = page.getByRole("main").getByRole("alert").filter({ hasText: "Corrija" });
  await expect(resumo).toBeVisible();
  await expect(resumo).toContainText("Escolha a categoria.");
  await expect(page.getByRole("combobox", { name: /^Categoria/ })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: /^Título/ })).toHaveValue(TITLE);

  await page.getByRole("textbox", { name: /^Linha fina/ }).fill("Linha fina da publicação de teste.");
  await page
    .getByRole("textbox", { name: /^Texto da matéria/ })
    .fill("Primeiro parágrafo do teste.\n\n## Intertítulo de teste\n\nSegundo parágrafo com **destaque**.");
  await page.getByRole("combobox", { name: /^Categoria/ }).selectOption({ label: "Cibersegurança" });
  await page.getByRole("textbox", { name: /^Tags/ }).fill("Tag E2E, Nuvem");
  await page.getByRole("textbox", { name: /^O que fazer agora/ }).fill("- Primeira ação do teste\n- Segunda ação do teste");
  await page.getByRole("textbox", { name: /^Nota de correção/ }).fill("O nome da empresa foi corrigido.");

  // Pré-visualização usa o mesmo renderizador do site.
  await page.getByRole("tab", { name: "Pré-visualizar" }).first().click();
  await expect(page.getByRole("heading", { name: "Intertítulo de teste" })).toBeVisible();
  await page.getByRole("tab", { name: "Escrever" }).first().click();

  // Imagem sem texto alternativo é recusada.
  await page.locator("#f-imageFile").setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Imagem enviada.")).toBeVisible();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("main").getByRole("alert").filter({ hasText: "Corrija" })).toContainText(
    "Descreva a imagem",
  );
  await page.getByRole("textbox", { name: /^Texto alternativo da imagem/ }).fill("Quadrado de teste");
  await page.getByRole("checkbox", { name: /Imagem gerada por IA/ }).check();

  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/admin\/materias\/[0-9a-f-]{36}\?salvo=1$/);
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Matéria criada." })).toBeVisible();
  await pronto(page, "Matéria");

  const ver = page.getByRole("link", { name: /Ver no site/ });
  await expect(ver).toHaveAttribute("target", "_blank");
  const href = await ver.getAttribute("href");
  expect(href).toMatch(/^\/noticias\/publicacao-de-teste-\d+$/);
  slug = href!.split("/").pop()!;

  // Matéria pública: corpo, extras, legenda de IA, imagem carregada.
  const res = await page.goto(`/noticias/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Intertítulo de teste" })).toBeVisible();
  const corrigida = page.getByRole("note");
  await expect(corrigida).toContainText("Correção: O nome da empresa foi corrigido.");
  await expect(corrigida).toContainText("Atualizado em");
  const caixa = page.getByRole("complementary").filter({ has: page.getByRole("heading", { name: "O que fazer agora" }) });
  await expect(caixa).toContainText("Segunda ação do teste");
  await expect(page.getByText("Ilustração gerada por IA")).toBeVisible();
  await expect
    .poll(() => page.locator("main > article figure img").evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(page.getByRole("link", { name: "Tag E2E" })).toBeVisible();
  // Ordem: corpo, depois a caixa "O que fazer agora"; correção no topo do corpo.
  const ordem = await page.locator("main > article").evaluate((el) => {
    const pos = (t: string) => (el.textContent ?? "").indexOf(t);
    return [pos("O nome da empresa foi corrigido."), pos("Primeiro parágrafo do teste."), pos("Primeira ação do teste")];
  });
  expect(ordem).toEqual([...ordem].sort((a, b) => a - b));

  // Listagem pública e Home (cache invalidado pela mutação).
  await page.goto(`/noticias?q=${STAMP}`);
  await expect(page.getByRole("link", { name: TITLE }).first()).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: TITLE }).first()).toBeVisible();

  // Painel: a matéria está na lista como publicada.
  await page.goto(`/admin/materias?q=${STAMP}&status=published`);
  await expect(page.getByRole("row", { name: new RegExp(TITLE) })).toContainText("Publicada");
});

test("as telas do painel não têm violações graves de acessibilidade", async ({ page }) => {
  await entrar(page);
  for (const rota of [
    "/admin",
    "/admin/materias",
    "/admin/materias/nova",
    "/admin/destaques",
    "/admin/paginas",
    "/admin/paginas/sobre",
    "/admin/mensagens",
    "/admin/configuracoes",
  ]) {
    await page.goto(rota);
    await expect(page.getByRole("main")).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(
      violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => `${rota}: ${v.id}`),
    ).toEqual([]);
  }
});

test("no celular a lista e o formulário não estouram a largura", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrar(page);
  for (const rota of ["/admin/materias", "/admin/materias/nova", "/admin/destaques"]) {
    await page.goto(rota);
    await expect(page.getByRole("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, rota).toBeLessThanOrEqual(0);
  }
});

test("volta para rascunho: a URL pública passa a dar 404", async ({ page }) => {
  await entrar(page);
  await abrirEdicao(page);
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Rascunho salvo." })).toBeVisible();

  const res = await page.goto(`/noticias/${slug}`);
  expect(res?.status()).toBe(404);
  await page.goto(`/noticias?q=${STAMP}`);
  await expect(page.getByRole("heading", { level: 2, name: "0 resultados" })).toBeVisible();

  await page.goto(`/admin/materias?q=${STAMP}&status=draft`);
  await expect(page.getByRole("row", { name: new RegExp(TITLE) })).toContainText("Rascunho");
});

test("destaques da Home: escolhe uma matéria publicada na posição 1 e depois restaura", async ({ page }) => {
  await entrar(page);
  // Publica de novo (a data original é preservada).
  await abrirEdicao(page);
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Matéria salva e publicada." })).toBeVisible();

  await page.goto("/admin/destaques");
  await pronto(page, "Destaques da Home");
  const escolhida = page.getByTestId("slot-1-escolhida");
  const original = (await escolhida.textContent())!;

  await page.getByLabel("Buscar matéria publicada").first().fill(STAMP);
  await page.getByRole("button", { name: /Buscar para a posição 1/ }).click();
  await page.getByRole("list", { name: "Resultados para a posição 1" }).getByRole("button", { name: TITLE }).click();
  await expect(escolhida).toHaveText(TITLE);
  await page.getByRole("button", { name: "Salvar destaques" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Destaques da Home salvos." })).toBeVisible();

  await page.goto("/");
  const principal = page.locator('section[aria-labelledby="destaques"] article h3 a').first();
  await expect(principal).toHaveText(TITLE);

  // Restaura a posição 1 original.
  await page.goto("/admin/destaques");
  await pronto(page, "Destaques da Home");
  await page.getByLabel("Buscar matéria publicada").first().fill(original.slice(0, 20));
  await page.getByRole("button", { name: /Buscar para a posição 1/ }).click();
  await page
    .getByRole("list", { name: "Resultados para a posição 1" })
    .getByRole("button", { name: original, exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar destaques" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Destaques da Home salvos." })).toBeVisible();
  await page.goto("/");
  await expect(page.locator('section[aria-labelledby="destaques"] article h3 a').first()).toHaveText(original);

  // Volta a matéria de teste para rascunho: o estado público fica como antes do spec.
  await abrirEdicao(page);
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Rascunho salvo." })).toBeVisible();
});

test("WhatsApp: URL inválida é recusada; a válida mostra o botão no cabeçalho; vazia remove", async ({ page }) => {
  await entrar(page);
  await page.goto("/admin/configuracoes");
  await pronto(page, "Configurações");
  const campo = page.getByRole("textbox", { name: /URL do Canal do WhatsApp/ });

  await campo.fill("https://exemplo.com");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByRole("main").getByRole("alert").filter({ hasText: "Corrija" })).toContainText(
    "https://whatsapp.com/channel/",
  );
  await expect(campo).toHaveAttribute("aria-invalid", "true");
  await expect(campo).toHaveValue("https://exemplo.com");

  await campo.fill(WHATSAPP);
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Configurações salvas." })).toBeVisible();

  await page.goto("/");
  const botao = page.getByRole("banner").getByRole("link", { name: "Assine no WhatsApp" });
  await expect(botao).toBeVisible();
  await expect(botao).toHaveAttribute("href", WHATSAPP);

  await page.goto("/admin/configuracoes");
  await pronto(page, "Configurações");
  await expect(campo).toHaveValue(WHATSAPP);
  await campo.fill("");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Configurações salvas." })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Assine no WhatsApp" })).toHaveCount(0);
});

test("página institucional: edita 'Sobre' e a mudança aparece no site", async ({ page }) => {
  await entrar(page);
  await page.goto("/admin/paginas/sobre");
  await pronto(page, "Página");
  const corpo = page.getByRole("textbox", { name: /^Texto \(markdown\)/ });
  const antes = await corpo.inputValue();
  await corpo.fill(`${antes}\n\nLinha de teste ${STAMP}.`);
  await page.getByRole("button", { name: "Salvar página" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Página salva." })).toBeVisible();
  await page.goto("/sobre");
  await expect(page.getByText(`Linha de teste ${STAMP}.`)).toBeVisible();

  // Restaura o texto original.
  await page.goto("/admin/paginas/sobre");
  await pronto(page, "Página");
  await corpo.fill(antes);
  await page.getByRole("button", { name: "Salvar página" }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Página salva." })).toBeVisible();
});

test("mensagens: abrir marca como lida", async ({ page }) => {
  // Cria a mensagem pelo formulário público de contato.
  await page.goto("/contato");
  await page.getByLabel("Nome").fill(`Leitora ${STAMP}`);
  await page.getByLabel("E-mail").fill("leitora@example.com");
  await page.getByLabel("Assunto").selectOption({ label: "Pauta" });
  await page.getByLabel("Mensagem").fill("Sugestão de pauta para o teste e2e.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Enviar/ }).click();
  await expect(page.getByText("Mensagem enviada")).toBeVisible();

  await entrar(page);
  await page.goto("/admin/mensagens");
  const item = page.getByRole("link", { name: new RegExp(`Leitora ${STAMP}`) });
  await expect(item).toContainText("não lida");
  await item.click();
  await expect(page.getByRole("heading", { name: `Leitora ${STAMP}` })).toBeVisible();
  await expect(page.getByText("Sugestão de pauta para o teste e2e.")).toBeVisible();
  await page.goto("/admin/mensagens");
  await expect(page.getByRole("link", { name: new RegExp(`Leitora ${STAMP}`) })).not.toContainText("não lida");
});
