// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { describeDatabaseUrl, loadEnvFiles, parseSeedArgs } from "../../scripts/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("describeDatabaseUrl", () => {
  it("mostra host e banco, nunca usuário ou senha", () => {
    const shown = describeDatabaseUrl("postgresql://usuario:s3nh4-secreta@ep-x-123.sa-east-1.aws.neon.tech/neondb?sslmode=require");
    expect(shown).toBe("ep-x-123.sa-east-1.aws.neon.tech/neondb");
    expect(shown).not.toContain("s3nh4");
    expect(shown).not.toContain("usuario");
    expect(describeDatabaseUrl("pglite:./.data/dev")).toBe("PGlite local (./.data/dev)");
    expect(describeDatabaseUrl("não é url")).toBe("(DATABASE_URL inválida)");
  });
});

describe("parseSeedArgs", () => {
  it("exige --posts N", () => {
    expect(parseSeedArgs([], "pglite:./.data/dev").ok).toBe(false);
    expect(parseSeedArgs(["14"], "pglite:./.data/dev").ok).toBe(false);
    expect(parseSeedArgs(["--posts", "x"], "pglite:./.data/dev").ok).toBe(false);
    expect(parseSeedArgs(["--posts", "14"], "pglite:./.data/dev")).toEqual({ ok: true, posts: 14 });
    expect(parseSeedArgs(["--posts", "0"], "pglite:./.data/dev")).toEqual({ ok: true, posts: 0 });
  });

  it("recusa banco que não é PGlite sem --force", () => {
    const neon = "postgresql://u:p@ep-x.neon.tech/neondb";
    const refused = parseSeedArgs(["--posts", "3"], neon);
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.error).toContain("--force");
      expect(refused.error).not.toContain("u:p");
    }
    expect(parseSeedArgs(["--posts", "3", "--force"], neon)).toEqual({ ok: true, posts: 3 });
  });
});

describe("loadEnvFiles", () => {
  it(".env.local vence .env e o ambiente do processo vence os dois", () => {
    const dir = mkdtempSync(join(tmpdir(), "ti-env-"));
    try {
      writeFileSync(join(dir, ".env.local"), "TI_T_A=local\n");
      writeFileSync(join(dir, ".env"), "TI_T_A=base\nTI_T_B=base\nTI_T_C=base\n");
      vi.stubEnv("TI_T_A", undefined);
      vi.stubEnv("TI_T_B", undefined);
      vi.stubEnv("TI_T_C", "processo");
      loadEnvFiles([join(dir, ".env.local"), join(dir, ".env"), join(dir, "nao-existe")]);
      expect(process.env.TI_T_A).toBe("local");
      expect(process.env.TI_T_B).toBe("base");
      expect(process.env.TI_T_C).toBe("processo");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
