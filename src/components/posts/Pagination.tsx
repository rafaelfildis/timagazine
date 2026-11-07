import Link from "next/link";
import { filtersToSearchParams, type PostFilters } from "@/lib/posts/filters";

function hrefFor(filters: PostFilters, pagina: number) {
  const qs = filtersToSearchParams({ ...filters, pagina }).toString();
  return qs ? `/noticias?${qs}` : "/noticias";
}

/** Páginas visíveis: primeira, última e a vizinhança da atual, com `null` = reticências. */
export function pageWindow(current: number, total: number): (number | null)[] {
  const keep = new Set([1, total, current - 1, current, current + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

const BASE = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-semibold";
const IDLE = `${BASE} border-border bg-surface text-text hover:border-primary hover:text-primary`;

export function Pagination({ filters, pages }: { filters: PostFilters; pages: number }) {
  if (pages <= 1) return null;
  const current = Math.min(filters.pagina, pages);
  return (
    <nav aria-label="Paginação" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {current > 1 && (
          <li>
            <Link href={hrefFor(filters, current - 1)} rel="prev" className={IDLE}>
              Anterior
            </Link>
          </li>
        )}
        {pageWindow(current, pages).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : n === current ? (
            <li key={n}>
              <span aria-current="page" className={`${BASE} border-primary bg-primary text-bg`}>
                {n}
              </span>
            </li>
          ) : (
            <li key={n}>
              <Link href={hrefFor(filters, n)} aria-label={`Página ${n}`} className={IDLE}>
                {n}
              </Link>
            </li>
          ),
        )}
        {current < pages && (
          <li>
            <Link href={hrefFor(filters, current + 1)} rel="next" className={IDLE}>
              Próxima
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
