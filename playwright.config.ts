import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Credenciais do admin de teste (E2E_ADMIN_*): só em .env.test, que o git ignora.
loadEnv({ path: ".env.test", quiet: true });

const PORT = 3100;
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    // Leitura do site: assume o banco semeado (14 matérias, sem WhatsApp).
    {
      name: "chromium",
      testIgnore: /admin-(publish|roles)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Os specs do painel alteram o banco (publicam, mudam destaques e WhatsApp); por isso
    // rodam só depois que todos os de leitura terminam.
    {
      name: "chromium-painel",
      testMatch: /admin-(publish|roles)\.spec\.ts/,
      dependencies: ["chromium"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Com BASE_URL definido, os testes rodam contra um ambiente já no ar.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run e2e:prepare && npm run build && npm run start -- -p ${PORT}`,
        env: {
          DATABASE_URL: "pglite:./.data/e2e",
          // Valor só para teste, sem uso em produção (lá AUTH_SECRET vem do ambiente).
          AUTH_SECRET: "e2e-only-secret-not-for-production-0123456789",
          AUTH_TRUST_HOST: "true",
          // Sem Vercel Blob no e2e: libera gravar/servir imagens em public/uploads.
          ALLOW_LOCAL_UPLOADS: "1",
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
