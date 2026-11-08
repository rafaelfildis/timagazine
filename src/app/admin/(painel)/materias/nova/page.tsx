import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { EMPTY_POST, PostForm } from "@/components/admin/PostForm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Nova matéria" };
export const dynamic = "force-dynamic";

export default async function NovaMateriaPage() {
  await requireRole("editor");
  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position));
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Nova matéria</h1>
      <PostForm initial={EMPTY_POST} categories={cats} />
    </div>
  );
}
