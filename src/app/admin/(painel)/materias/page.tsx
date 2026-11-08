import type { Metadata } from "next";
import Link from "next/link";
import { AdminPager } from "@/components/admin/AdminPager";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, LABEL } from "@/components/admin/styles";
import { ADMIN_STATUS_OPTIONS, listAdminPosts, parseAdminPostFilters } from "@/lib/admin/lists";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { dateToBahiaInput } from "@/lib/posts/datetime";

export const metadata: Metadata = { title: "Matérias" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const dateTime = (d: Date) => {
  const [day, time] = dateToBahiaInput(d).split("T");
  const [y, m, dd] = day.split("-");
  return `${dd}/${m}/${y} ${time}`;
};

export default async function MateriasPage({ searchParams }: Props) {
  await requireRole("editor");
  const filters = parseAdminPostFilters(await searchParams);
  const { items, total, page, pages } = await listAdminPosts(db, filters);

  const params: Record<string, string> = {};
  if (filters.status !== "all") params.status = filters.status;
  if (filters.q) params.q = filters.q;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Matérias</h1>
        <Link href="/admin/materias/nova" className={BTN_PRIMARY}>
          Nova matéria
        </Link>
      </div>

      <form method="get" role="search" aria-label="Filtrar matérias" className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="busca" className={LABEL}>
            Buscar pelo título
          </label>
          <input id="busca" name="q" type="search" defaultValue={filters.q} maxLength={100} className={FIELD} />
        </div>
        <div>
          <label htmlFor="status" className={LABEL}>
            Status
          </label>
          <select id="status" name="status" defaultValue={filters.status} className={FIELD}>
            {ADMIN_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={BTN_SECONDARY}>
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted" aria-live="polite">
        {total === 0 ? "Nenhuma matéria encontrada." : `${total} ${total === 1 ? "matéria" : "matérias"}`}
      </p>

      {items.length > 0 && (
        <div className="relative overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Matérias, da mais recente para a mais antiga</caption>
            <thead className="border-b border-border text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Título</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Data</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => {
                const live = p.status === "published" && !p.scheduled;
                return (
                  <tr key={p.id}>
                    <td className="max-w-xs px-4 py-3">
                      <Link
                        href={`/admin/materias/${p.id}`}
                        className="font-medium text-text underline-offset-2 hover:text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.categoryName}</td>
                    <td className="px-4 py-3">
                      {p.status === "draft" ? "Rascunho" : p.scheduled ? "Agendada" : "Publicada"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {p.publishedAt ? dateTime(p.publishedAt) : `Editada em ${dateTime(p.updatedAt)}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {live && (
                        <a
                          href={`/noticias/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          Ver no site<span className="sr-only">: {p.title} (abre em nova aba)</span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPager basePath="/admin/materias" params={params} page={page} pages={pages} />
    </div>
  );
}
