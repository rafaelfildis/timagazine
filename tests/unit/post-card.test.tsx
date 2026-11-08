import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostCard } from "@/components/posts/PostCard";
import { SourceCredit } from "@/components/posts/SourceCredit";
import type { PostCard as PostCardData } from "@/lib/posts/queries";

const base: PostCardData = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "exemplo",
  title: "Título de exemplo",
  dek: "Linha fina",
  categoryName: "Cibersegurança",
  categorySlug: "ciberseguranca",
  modality: "noticia",
  origin: "propria",
  sponsored: false,
  imageUrl: "/brand/og-default.png",
  imageAlt: "Alt",
  imageAi: false,
  publishedAt: new Date("2026-11-01T12:00:00-03:00"),
  readingMinutes: 4,
};

describe("<PostCard>", () => {
  it("sem imageUrl usa a capa padrão", () => {
    const { container } = render(<PostCard post={{ ...base, imageUrl: null }} size="md" />);
    const src = decodeURIComponent(container.querySelector("img")!.getAttribute("src")!);
    expect(src).toContain("/brand/capa-padrao.jpg");
  });

  it("título de 300 caracteres recebe line-clamp-3", () => {
    render(<PostCard post={{ ...base, title: "x".repeat(300) }} size="md" />);
    expect(screen.getByRole("heading").className).toContain("line-clamp-3");
  });

  it("zoom da imagem no hover só com movimento permitido (motion-safe)", () => {
    const { container } = render(<PostCard post={base} size="md" />);
    const classes = container.querySelector("img")!.className.split(/\s+/);
    expect(classes).toEqual(
      expect.arrayContaining(["motion-safe:transition-transform", "motion-safe:group-hover:scale-105"]),
    );
    expect(classes.filter((c) => /(^|:)(scale-|transition)/.test(c) && !c.startsWith("motion-safe:"))).toEqual([]);
  });

  it("mostra selo Patrocinado", () => {
    render(<PostCard post={{ ...base, sponsored: true }} size="sm" />);
    expect(screen.getByText("Patrocinado")).toBeInTheDocument();
  });

  it("mostra selo Opinião", () => {
    render(<PostCard post={{ ...base, modality: "opiniao" }} size="lg" />);
    expect(screen.getByText("Opinião")).toBeInTheDocument();
  });

  it("mostra chapéu, data e tempo de leitura e link para a matéria", () => {
    render(<PostCard post={base} size="md" />);
    expect(screen.getByText("Cibersegurança · Notícia")).toBeInTheDocument();
    expect(screen.getByText("01/11/2026")).toBeInTheDocument();
    expect(screen.getByText("4 min de leitura")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/noticias/exemplo");
  });
});

describe("<SourceCredit>", () => {
  it("mostra 'Com informações de' com link para a fonte", () => {
    render(<SourceCredit sourceName="Agência X" sourceUrl="https://example.com/o" />);
    expect(screen.getByText(/Com informações de/)).toBeInTheDocument();
    const a = screen.getByRole("link", { name: "Agência X" });
    expect(a).toHaveAttribute("href", "https://example.com/o");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });
});
