import Link from "next/link";

const LINK =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Paginação simples do painel: Anterior / Página X de Y / Próxima, mantendo os demais filtros da URL. */
export function AdminPager({
  basePath,
  params,
  page,
  pages,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const qs = new URLSearchParams(params);
    if (n > 1) qs.set("pagina", String(n));
    else qs.delete("pagina");
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav aria-label="Paginação" className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={LINK}>
          Anterior
        </Link>
      )}
      <span className="text-sm text-muted" aria-current="page">
        Página {page} de {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} rel="next" className={LINK}>
          Próxima
        </Link>
      )}
    </nav>
  );
}
