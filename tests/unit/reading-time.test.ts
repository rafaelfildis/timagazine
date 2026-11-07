import { describe, expect, it } from "vitest";
import { readingMinutes } from "@/lib/posts/reading-time";

describe("readingMinutes", () => {
  it("vale 1 para texto vazio", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("   \n ")).toBe(1);
  });
  it("arredonda para cima (200 palavras por minuto)", () => {
    expect(readingMinutes("palavra ".repeat(200))).toBe(1);
    expect(readingMinutes("palavra ".repeat(201))).toBe(2);
    expect(readingMinutes("palavra ".repeat(401))).toBe(3);
  });
});
