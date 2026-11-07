import Link from "next/link";
import { filtersToSearchParams, type PostFilters } from "@/lib/posts/filters";

const LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-md border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary/10";

/** Estado vazio: sem resultados para os filtros, ou página além da última. */
export function ResultsState({
  kind,
  filters,
}: {
  kind: "empty" | "out-of-range";
  filters: PostFilters;
}) {
  const firstPage = filtersToSearchParams({ ...filters, pagina: 1 }).toString();
  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
      {kind === "empty" ? (
        <>
          <p className="font-display text-lg font-bold">Nenhuma matéria encontrada</p>
          <p className="mt-2 text-sm text-muted">
            Tente outros termos ou limpe os filtros para ver todas as notícias.
          </p>
          <Link href="/noticias" className={`${LINK_CLASS} mt-5`}>
            Limpar todos os filtros
          </Link>
        </>
      ) : (
        <>
          <p className="font-display text-lg font-bold">Esta página não existe</p>
          <p className="mt-2 text-sm text-muted">Não há matérias tão adiante na lista.</p>
          <Link href={firstPage ? `/noticias?${firstPage}` : "/noticias"} className={`${LINK_CLASS} mt-5`}>
            Voltar à primeira página
          </Link>
        </>
      )}
    </div>
  );
}
