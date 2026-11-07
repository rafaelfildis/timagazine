import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("tokens da marca", () => {
  it.each([
    "--color-primary: #16E65C",
    "--color-deep: #0B3320",
    "--color-bg: #070A07",
    "--color-text: #FFFFFF",
    "--color-muted: #A7B0A5",
  ])("globals.css contém %s", (token) => {
    expect(css).toContain(token);
  });

  it.each([
    "--color-surface: #0D130E",
    "--color-surface-2: #121A13",
    "--color-border: #1E2A20",
  ])("globals.css contém a superfície %s", (token) => {
    expect(css).toContain(token);
  });
});
