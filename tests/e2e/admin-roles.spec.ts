import { solidPng } from "./png";
import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const EDITOR = { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD };

async function entrar(page: Page, who: { email?: string; password?: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(who.email!);
  await page.getByLabel("Senha").fill(who.password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const PNG = solidPng();

test.describe("editor (papel insuficiente para Páginas e Configurações)", () => {
  test.skip(
    !EDITOR.email || !EDITOR.password,
    "E2E_EDITOR_EMAIL/E2E_EDITOR_PASSWORD ausentes: veja .env.test.example.",
  );

  test("o menu esconde Páginas e Configurações; essas rotas respondem 403", async ({ page }) => {
    await entrar(page, EDITOR);
    const menu = page.getByRole("navigation", { name: "Painel" });
    for (const item of ["Matérias", "Destaques da Home", "Mensagens"]) {
      await expect(menu.getByRole("link", { name: item })).toBeVisible();
    }
    for (const item of ["Páginas", "Configurações"]) {
      await expect(menu.getByRole("link", { name: item })).toHaveCount(0);
    }

    for (const rota of ["/admin/configuracoes", "/admin/paginas", "/admin/paginas/sobre"]) {
      const res = await page.goto(rota);
      expect(res?.status(), rota).toBe(403);
      await expect(page.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
    }
    // As áreas de editor seguem abertas.
    for (const rota of ["/admin/materias", "/admin/materias/nova", "/admin/destaques", "/admin/mensagens"]) {
      const res = await page.goto(rota);
      expect(res?.status(), rota).toBe(200);
    }
  });

  test("editor consegue enviar imagem", async ({ page }) => {
    await entrar(page, EDITOR);
    const res = await page.request.post("/api/upload", {
      headers: { "sec-fetch-site": "same-origin" },
      multipart: { file: { name: "a.png", mimeType: "image/png", buffer: PNG } },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe("POST /api/upload", () => {
  test.skip(!ADMIN.email || !ADMIN.password, "E2E_ADMIN_* ausentes.");

  const same = { "sec-fetch-site": "same-origin" };
  const upload = (page: Page, file: { name: string; mimeType: string; buffer: Buffer }, headers: Record<string, string> = same) =>
    page.request.post("/api/upload", { headers, multipart: { file }, maxRedirects: 0 });

  test("sem sessão não envia (redireciona ao login)", async ({ page }) => {
    const res = await upload(page, { name: "a.png", mimeType: "image/png", buffer: PNG });
    expect([303, 307]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/admin/login");
  });

  test("com sessão: origem diferente é recusada", async ({ page, baseURL }) => {
    await entrar(page, ADMIN);
    const file = { name: "a.png", mimeType: "image/png", buffer: PNG };
    expect((await upload(page, file, { "sec-fetch-site": "cross-site" })).status()).toBe(403);
    expect((await upload(page, file, { origin: "https://evil.example" })).status()).toBe(403);
    expect((await upload(page, file, {})).status()).toBe(403); // sem Origin nem Sec-Fetch-Site
    expect((await upload(page, file, { origin: new URL(baseURL!).origin })).status()).toBe(200);
  });

  test("valida o conteúdo: aceita imagem real, recusa o resto e arquivo grande", async ({ page }) => {
    await entrar(page, ADMIN);

    const ok = await upload(page, { name: "foto.png", mimeType: "image/png", buffer: PNG });
    expect(ok.status()).toBe(200);
    const { url } = (await ok.json()) as { url: string };
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/); // nome aleatório, extensão pelo conteúdo

    // O arquivo enviado é servido pelo site.
    const servido = await page.request.get(url);
    expect(servido.status()).toBe(200);
    expect(servido.headers()["content-type"]).toContain("image/png");

    // Conteúdo que não é imagem, mesmo declarado como imagem.
    const texto = await upload(page, { name: "x.png", mimeType: "image/png", buffer: Buffer.from("não sou imagem") });
    expect(texto.status()).toBe(415);
    const svg = await upload(page, {
      name: "x.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    });
    expect(svg.status()).toBe(415);
    // PNG verdadeiro declarado com outro tipo.
    const trocado = await upload(page, { name: "x.jpg", mimeType: "image/jpeg", buffer: PNG });
    expect(trocado.status()).toBe(415);
    // Maior que 5 MB.
    const grande = await upload(page, {
      name: "g.png",
      mimeType: "image/png",
      buffer: Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]),
    });
    expect(grande.status()).toBe(413);
    // Sem arquivo.
    const vazio = await page.request.post("/api/upload", { headers: same, multipart: { outro: "x" }, maxRedirects: 0 });
    expect(vazio.status()).toBe(400);
  });
});
