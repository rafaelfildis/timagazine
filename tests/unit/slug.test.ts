import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/posts/slug";
import { formatDate } from "@/lib/format";

describe("slugify", () => {
  it("remove acentos e pontuação", () => {
    expect(slugify("Cibersegurança: o que muda em 2026?")).toBe("ciberseguranca-o-que-muda-em-2026");
  });
  it("limita a 80 caracteres cortando em palavra inteira", () => {
    const s = slugify("palavra ".repeat(30));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s).toMatch(/^(palavra-)*palavra$/);
  });
  it("não deixa hífens nas pontas", () => {
    expect(slugify("  --Olá, mundo!--  ")).toBe("ola-mundo");
  });
});

describe("formatDate", () => {
  it("usa dd/MM/yyyy no fuso America/Bahia", () => {
    expect(formatDate(new Date("2026-11-01T12:00:00-03:00"))).toBe("01/11/2026");
    // 01:00 UTC do dia 2 ainda é dia 1 na Bahia (UTC-3)
    expect(formatDate(new Date("2026-11-02T01:00:00Z"))).toBe("01/11/2026");
  });
});
