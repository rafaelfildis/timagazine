import Link from "next/link";

export function NotFoundContent() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-4 px-4 py-20 lg:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Erro 404</p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Página não encontrada</h1>
      <p className="max-w-prose text-muted">
        O endereço pode ter sido digitado errado ou a página saiu do ar. Volte para a Home ou
        veja as últimas notícias.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-bg hover:brightness-110"
        >
          Ir para a Home
        </Link>
        <Link
          href="/noticias"
          className="inline-flex min-h-11 items-center rounded-md border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          Ver notícias
        </Link>
      </div>
    </section>
  );
}
