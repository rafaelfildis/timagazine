import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { PAGE_SLUGS } from "@/lib/posts/mutations";

export const metadata: Metadata = { title: "Páginas" };
export const dynamic = "force-dynamic";

export default async function PaginasPage() {
  // Páginas institucionais e políticas: só administradores.
  await requireRole("admin");
  const rows = await db.select({ slug: pages.slug, title: pages.title }).from(pages);
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Páginas</h1>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {PAGE_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={`/admin/paginas/${slug}`}
              className="flex min-h-11 items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            >
              <span>{rows.find((r) => r.slug === slug)?.title ?? slug}</span>
              <span className="text-sm text-muted">Editar</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
