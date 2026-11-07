"use client";

export default function NewsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center lg:px-6" role="alert">
      <h1 className="font-display text-3xl font-bold">Não foi possível carregar as notícias</h1>
      <p className="mt-3 text-muted">Ocorreu um erro inesperado. Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-bg hover:brightness-110"
      >
        Tentar novamente
      </button>
    </div>
  );
}
