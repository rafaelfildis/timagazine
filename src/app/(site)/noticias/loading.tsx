export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6" role="status" aria-label="Carregando notícias">
      <div className="h-9 w-48 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
      <div className="mt-6 h-40 animate-pulse rounded-xl bg-surface motion-reduce:animate-none" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="h-72 animate-pulse rounded-xl bg-surface motion-reduce:animate-none" />
        ))}
      </ul>
    </div>
  );
}
