import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/PageForm";
import { getPageForEdit, isPageSlug } from "@/lib/admin/pages";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";

export const metadata: Metadata = { title: "Editar página" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function EditarPaginaPage({ params }: Props) {
  await requireRole("admin");
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  // Página sem linha no banco: formulário vazio; salvar cria.
  const page = await getPageForEdit(db, slug);
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Editar página</h1>
      {!page.exists && (
        <p className="rounded-md border border-border bg-surface p-3 text-sm text-muted">
          Esta página ainda não existe no banco. Preencha o título e o texto e salve para criá-la.
        </p>
      )}
      <PageForm slug={page.slug} title={page.title} body={page.body} publicPath={`/${page.slug}`} />
    </div>
  );
}
