import type { Metadata } from "next";
import { getAdminOverview } from "@/lib/admin/overview";
import { db } from "@/lib/db/client";

export const metadata: Metadata = { title: "Visão geral" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const o = await getAdminOverview(db);
  const cards = [
    { label: "Publicadas", value: o.published },
    { label: "Rascunhos", value: o.drafts },
    { label: "Mensagens não lidas", value: o.unreadMessages },
  ];
  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold">Visão geral</h1>
      <dl className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-5">
            <dt className="text-sm text-muted">{c.label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold">{c.value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="mais-lidas">
        <h2 id="mais-lidas" className="font-display text-lg font-bold">
          Mais lidas
        </h2>
        {o.topPosts.length === 0 ? (
          <p className="mt-2 text-muted">Nenhuma matéria publicada ainda.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {o.topPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0 truncate">{p.title}</span>
                <span className="shrink-0 text-sm text-muted">
                  {p.views.toLocaleString("pt-BR")} leituras
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
