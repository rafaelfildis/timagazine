import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/lib/markdown";

describe("<Markdown>", () => {
  it("não gera script nem onerror", () => {
    const { container } = render(
      <Markdown source={"<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\ntexto"} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("onerror");
    expect(container.textContent).toContain("texto");
  });

  it("bloqueia javascript: em links", () => {
    const { container } = render(<Markdown source={"[x](javascript:alert(1))"} />);
    const a = container.querySelector("a");
    expect(a?.getAttribute("href") ?? "").not.toContain("javascript");
  });

  it("links externos abrem em nova aba com rel seguro", () => {
    const { container } = render(<Markdown source={"[fonte](https://example.com/x)"} />);
    const a = container.querySelector("a")!;
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links internos não ganham target", () => {
    const { container } = render(<Markdown source={"[sobre](/sobre)"} />);
    const a = container.querySelector("a")!;
    expect(a).not.toHaveAttribute("target");
  });

  it("suporta tabelas GFM e rebaixa h1 para h2", () => {
    const { container } = render(<Markdown source={"# Título\n\n| a | b |\n|---|---|\n| 1 | 2 |"} />);
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("h2")).not.toBeNull();
    expect(container.querySelector("table")).not.toBeNull();
  });
});
