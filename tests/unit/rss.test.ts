import { describe, expect, it } from "vitest";
import { buildRss, escapeXml } from "@/lib/rss";
import type { PostCard } from "@/lib/posts/queries";

const post = (over: Partial<PostCard> = {}): PostCard => ({
  id: "1",
  slug: "a-b",
  title: 'Dados & "IA" <novo>',
  dek: "Linha fina",
  categoryName: "Dados e Analytics",
  categorySlug: "dados-analytics",
  modality: "noticia",
  origin: "propria",
  sponsored: false,
  imageUrl: null,
  imageAlt: null,
  imageAi: false,
  publishedAt: new Date("2026-11-01T15:00:00Z"),
  readingMinutes: 3,
  ...over,
});

describe("escapeXml", () => {
  it("escapa os 5 caracteres especiais e remove controles proibidos", () => {
    expect(escapeXml(`<a href="x">&'</a>\u0001`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;");
  });
});

describe("buildRss", () => {
  const xml = buildRss([post()], { name: "TI MAGAZINE", description: "d", baseUrl: "https://ex.com/" });
  it("gera RSS 2.0 com link absoluto e conteúdo escapado", () => {
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<link>https://ex.com/noticias/a-b</link>");
    expect(xml).toContain("<title>Dados &amp; &quot;IA&quot; &lt;novo&gt;</title>");
    expect(xml).toContain("<pubDate>Sun, 01 Nov 2026 15:00:00 GMT</pubDate>");
    expect(xml.match(/<item>/g)).toHaveLength(1);
  });
  it("feed vazio continua válido", () => {
    expect(buildRss([], { name: "x", description: "y", baseUrl: "https://ex.com" })).toContain("</channel>");
  });
});
