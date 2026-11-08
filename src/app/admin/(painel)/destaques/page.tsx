import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { HighlightsEditor } from "@/components/admin/HighlightsEditor";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { homeHighlights, posts } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Destaques da Home" };
export const dynamic = "force-dynamic";

export default async function DestaquesPage() {
  await requireRole("editor");
  const rows = await db
    .select({ position: homeHighlights.position, id: posts.id, title: posts.title })
    .from(homeHighlights)
    .innerJoin(posts, eq(posts.id, homeHighlights.postId))
    .orderBy(asc(homeHighlights.position));
  const initial = Array.from({ length: 5 }, (_, i) => {
    const row = rows.find((r) => r.position === i + 1);
    return row ? { id: row.id, title: row.title } : null;
  });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Destaques da Home</h1>
        <p className="mt-2 text-muted">
          Escolha até 5 matérias publicadas. A posição 1 é o destaque principal. Posições vazias são
          preenchidas com as matérias mais recentes.
        </p>
      </div>
      <HighlightsEditor initial={initial} />
    </div>
  );
}
