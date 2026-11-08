import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/PageForm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { PAGE_SLUGS, type PageSlug } from "@/lib/posts/mutations";

export const metadata: Metadata = { title: "Editar página" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function EditarPaginaPage({ params }: Props) {
  await requireRole("admin");
  const { slug } = await params;
  if (!(PAGE_SLUGS as readonly string[]).includes(slug)) notFound();
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug as PageSlug))
    .limit(1);
  if (!page) notFound();
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Editar página</h1>
      <PageForm slug={page.slug} title={page.title} body={page.body} publicPath={`/${page.slug}`} />
    </div>
  );
}
