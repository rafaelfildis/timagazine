import type { Metadata } from "next";
import Link from "next/link";
import { AdminPager } from "@/components/admin/AdminPager";
import { listMessages, openMessage } from "@/lib/admin/lists";
import { requireRole } from "@/lib/auth";
import { CONTACT_SUBJECTS } from "@/lib/contact";
import { db } from "@/lib/db/client";
import { dateToBahiaInput } from "@/lib/posts/datetime";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const subjectLabel = (v: string) => CONTACT_SUBJECTS.find((s) => s.value === v)?.label ?? v;

const dateTime = (d: Date) => {
  const [day, time] = dateToBahiaInput(d).split("T");
  const [y, m, dd] = day.split("-");
  return `${dd}/${m}/${y} ${time}`;
};

export default async function MensagensPage({ searchParams }: Props) {
  await requireRole("editor");
  const sp = await searchParams;
  const rawPage = Number(first(sp.pagina));
  const pagina = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 100_000 ? rawPage : 1;
  const rawId = first(sp.m);
  const id = rawId && /^\d{1,9}$/.test(rawId) ? Number(rawId) : null;

  // Abrir uma mensagem a marca como lida (antes de listar, para a contagem já refletir).
  const opened = id !== null ? await openMessage(db, id) : null;
  const { items, unread, page, pages, total } = await listMessages(db, pagina);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mensagens</h1>
        <p className="mt-2 text-muted" aria-live="polite">
          {total === 0
            ? "Nenhuma mensagem recebida."
            : `${total} ${total === 1 ? "mensagem" : "mensagens"}, ${unread} não ${unread === 1 ? "lida" : "lidas"}.`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          {items.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {items.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/admin/mensagens?m=${m.id}${page > 1 ? `&pagina=${page}` : ""}`}
                    prefetch={false}
                    aria-current={opened?.id === m.id ? "true" : undefined}
                    className={`block min-h-11 px-4 py-3 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${opened?.id === m.id ? "bg-surface-2" : ""}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className={m.readAt ? "text-text" : "font-bold text-text"}>
                        {!m.readAt && <span className="mr-2 inline-block size-2 rounded-full bg-primary" aria-hidden="true" />}
                        {m.name}
                        {!m.readAt && <span className="sr-only"> (não lida)</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted">{dateTime(m.createdAt)}</span>
                    </span>
                    <span className="block text-sm text-muted">{subjectLabel(m.subject)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <AdminPager basePath="/admin/mensagens" params={{}} page={page} pages={pages} />
        </div>

        <section aria-label="Mensagem aberta">
          {opened ? (
            <article className="space-y-4 rounded-xl border border-border bg-surface p-5">
              <header>
                <h2 className="font-display text-lg font-bold">{opened.name}</h2>
                <p className="text-sm text-muted">
                  <a href={`mailto:${opened.email}`} className="text-primary underline">
                    {opened.email}
                  </a>
                  {" · "}
                  {subjectLabel(opened.subject)}
                  {" · "}
                  {dateTime(opened.createdAt)}
                </p>
              </header>
              <p className="whitespace-pre-wrap break-words">{opened.message}</p>
            </article>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-5 text-muted">
              {id !== null ? "Mensagem não encontrada." : "Escolha uma mensagem na lista para ler."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
