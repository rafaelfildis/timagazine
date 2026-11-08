// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { trustHostFromEnv } from "@/lib/auth/config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadConfig() {
  vi.resetModules();
  return (await import("@/lib/auth/config")).authConfig;
}

describe("authConfig.trustHost", () => {
  it("sem AUTH_TRUST_HOST fica undefined (nunca false), para a detecção da Vercel valer", async () => {
    vi.stubEnv("AUTH_TRUST_HOST", undefined);
    const config = await loadConfig();
    expect(config.trustHost).toBeUndefined();
    expect((config as { trustHost?: boolean }).trustHost).not.toBe(false);
  });

  it("AUTH_TRUST_HOST=true liga a confiança no host", async () => {
    vi.stubEnv("AUTH_TRUST_HOST", "true");
    expect((await loadConfig()).trustHost).toBe(true);
  });

  it("na Vercel (sem AUTH_TRUST_HOST) o Auth.js passa a confiar no host", async () => {
    vi.stubEnv("AUTH_TRUST_HOST", undefined);
    // Dependência do next-auth: é ela que aplica os padrões do ambiente na inicialização.
    const { setEnvDefaults } = await import("@auth/core");
    const config = { ...(await loadConfig()) };
    setEnvDefaults({ VERCEL: "1", NODE_ENV: "production" }, config);
    expect(config.trustHost).toBe(true);
  });

  it("qualquer outro valor também deixa a decisão para o Auth.js", () => {
    for (const v of [undefined, "", "false", "1", "TRUE"]) expect(trustHostFromEnv(v)).toBeUndefined();
    expect(trustHostFromEnv("true")).toBe(true);
  });
});
