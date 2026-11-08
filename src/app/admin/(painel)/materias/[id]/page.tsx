import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostForm, type PostFormValues } from "@/components/admin/PostForm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { categories, postTags, posts, tags } from "@/lib/db/schema";
import { dateToBahiaInput } from "@/lib/posts/datetime";

export const metadata: Metadata = { title: "Editar matéria" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditarMateriaPage({ params, searchParams }: Props) {
  await requireRole("editor");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) notFound();

  const [cats, postTagRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position)),
    db
      .select({ name: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, id))
      .orderBy(asc(tags.name)),
  ]);

  const initial: PostFormValues = {
    id: post.id,
    title: post.title,
    dek: post.dek,
    slug: post.slug,
    body: post.body,
    categoryId: post.categoryId,
    modality: post.modality,
    origin: post.origin,
    sourceName: post.sourceName ?? "",
    sourceUrl: post.sourceUrl ?? "",
    sponsored: post.sponsored,
    imageUrl: post.imageUrl ?? "",
    imageAlt: post.imageAlt ?? "",
    imageAi: post.imageAi,
    takeaways: post.takeaways ?? "",
    correctionNote: post.correctionNote ?? "",
    tags: postTagRows.map((t) => t.name).join(", "),
    status: post.status,
    publishedAt: post.publishedAt ? dateToBahiaInput(post.publishedAt) : "",
  };
  const live = post.status === "published" && !!post.publishedAt && post.publishedAt <= new Date();
  const sp = await searchParams;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Editar matéria</h1>
      <PostForm
        initial={initial}
        categories={cats}
        publicUrl={live ? `/noticias/${post.slug}` : undefined}
        justCreated={sp.salvo === "1"}
      />
    </div>
  );
}
