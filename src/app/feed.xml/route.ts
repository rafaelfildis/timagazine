import { siteConfig } from "@/config/site";
import { db } from "@/lib/db/client";
import { listPosts } from "@/lib/posts/queries";
import { buildRss } from "@/lib/rss";

export const revalidate = 300;

const FEED_SIZE = 30;

export async function GET() {
  const { items } = await listPosts(db, { ordem: "recentes", pagina: 1 }, FEED_SIZE);
  const xml = buildRss(items, {
    name: siteConfig.name,
    description: siteConfig.tagline,
    baseUrl: siteConfig.url,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
