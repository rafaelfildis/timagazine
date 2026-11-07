import type { Metadata } from "next";
import { FilterBar } from "@/components/posts/FilterBar";
import { Pagination } from "@/components/posts/Pagination";
import { PostCard } from "@/components/posts/PostCard";
import { ResultsState } from "@/components/posts/ResultsState";
import { db } from "@/lib/db/client";
import { filtersToSearchParams, hasActiveFilters, parseFilters } from "@/lib/posts/filters";
import { getFilterOptions } from "@/lib/posts/filter-options";
import { listPosts } from "@/lib/posts/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const description =
    "Reportagens, análises, entrevistas e curadoria sobre tecnologia, inovação e negócios.";
  if (hasActiveFilters(f)) {
    // Combinações de filtros são infinitas: não indexar, e apontar para a lista base.
    return {
      title: "Notícias",
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: "/noticias" },
    };
  }
  const qs = filtersToSearchParams(f).toString();
  return { title: "Notícias", description, alternates: { canonical: qs ? `/noticias?${qs}` : "/noticias" } };
}

const countLabel = (n: number) => (n === 1 ? "1 resultado" : `${n} resultados`);

export default async function NoticiasPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [result, options] = await Promise.all([listPosts(db, filters), getFilterOptions(db)]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Notícias</h1>
      <div className="mt-6">
        <FilterBar filters={filters} options={options} />
      </div>

      <div aria-live="polite" aria-atomic="true" className="mt-8">
        <h2 className="font-display text-xl font-bold">{countLabel(result.total)}</h2>
        {result.pages > 1 && result.items.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            Página {result.page} de {result.pages}
          </p>
        )}
      </div>

      {result.items.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((p, i) => (
            <li key={p.id} className="flex">
              <div className="flex w-full [&>article]:w-full">
                <PostCard post={p} size="md" priority={i < 3} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ResultsState kind={result.total === 0 ? "empty" : "out-of-range"} filters={filters} />
      )}

      <Pagination filters={filters} pages={result.pages} />
    </div>
  );
}
