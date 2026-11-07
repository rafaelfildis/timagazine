import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db/client";
import { listSitemapPosts } from "@/lib/posts/sitemap";

export const revalidate = 300;

// As páginas institucionais chegam na Task 8; ficam listadas desde já.
const STATIC_PATHS = [
  "/",
  "/noticias",
  "/sobre",
  "/contato",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/politica-editorial",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/+$/, "");
  const posts = await listSitemapPosts(db);
  return [
    ...STATIC_PATHS.map((p) => ({ url: p === "/" ? `${base}/` : `${base}${p}` })),
    ...posts.map((p) => ({ url: `${base}/noticias/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
