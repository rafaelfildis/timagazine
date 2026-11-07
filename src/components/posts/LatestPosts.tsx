import Link from "next/link";
import { CATEGORIES } from "@/config/taxonomy";
import type { PostCard as PostCardData } from "@/lib/posts/queries";
import { PostCard } from "./PostCard";

/** `pageSize`: com todas as vagas cheias, provavelmente há mais para ver em /noticias. */
export function LatestPosts({ posts, pageSize }: { posts: PostCardData[]; pageSize: number }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="ultimas" className="mx-auto w-full max-w-7xl px-4 pt-12 lg:px-6">
      <h2 id="ultimas" className="font-display text-2xl font-bold">
        Últimas notícias
      </h2>
      <nav aria-label="Filtrar por categoria" className="mt-4">
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/noticias?categoria=${c.slug}`}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3 text-sm text-text hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <li key={p.id} className="flex">
            <div className="flex w-full [&>article]:w-full">
              <PostCard post={p} size="md" />
            </div>
          </li>
        ))}
      </ul>
      {posts.length >= pageSize && (
        <div className="mt-8 flex justify-center">
          <Link
            href="/noticias?pagina=2"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary px-6 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Carregar mais
          </Link>
        </div>
      )}
    </section>
  );
}
