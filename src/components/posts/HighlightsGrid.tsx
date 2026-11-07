import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PostCard as PostCardData } from "@/lib/posts/queries";
import { PostCard } from "./PostCard";

export function HighlightsGrid({ highlights }: { highlights: PostCardData[] }) {
  const [main, ...rest] = highlights;
  return (
    <section aria-labelledby="destaques" className="mx-auto w-full max-w-7xl px-4 pt-10 lg:px-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="destaques" className="font-display text-2xl font-bold">
          Destaques da Edição
        </h2>
        <Link
          href="/noticias"
          className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Ver todas as notícias <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {!main ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          As primeiras matérias estão a caminho.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex sm:col-span-2 lg:row-span-2 [&>article]:w-full">
            <PostCard post={main} size="lg" priority />
          </div>
          {rest.map((p) => (
            <div key={p.id} className="flex [&>article]:w-full">
              <PostCard post={p} size="sm" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
