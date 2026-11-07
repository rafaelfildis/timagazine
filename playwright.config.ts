import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Com BASE_URL definido, os testes rodam contra um ambiente já no ar.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run e2e:prepare && npm run build && npm run start -- -p ${PORT}`,
        env: { DATABASE_URL: "pglite:./.data/e2e" },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
