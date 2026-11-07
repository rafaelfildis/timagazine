import type { PostCard } from "@/lib/posts/queries";

export function escapeXml(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // caracteres proibidos em XML 1.0
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type Channel = { name: string; description: string; baseUrl: string };

/** RSS 2.0 com links absolutos. `baseUrl` sem barra final. */
export function buildRss(posts: PostCard[], ch: Channel, now: Date = new Date()): string {
  const base = ch.baseUrl.replace(/\/+$/, "");
  const items = posts
    .map((p) => {
      const url = `${base}/noticias/${p.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${p.publishedAt.toUTCString()}</pubDate>`,
        `      <category>${escapeXml(p.categoryName)}</category>`,
        `      <description>${escapeXml(p.dek)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(ch.name)}</title>
    <link>${escapeXml(base)}/</link>
    <description>${escapeXml(ch.description)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(base)}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
