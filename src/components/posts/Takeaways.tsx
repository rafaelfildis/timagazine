import { Markdown } from "@/lib/markdown";

/** Caixa opcional "O que fazer agora"; sem texto, não renderiza nada. */
export function Takeaways({ source }: { source: string | null | undefined }) {
  if (!source?.trim()) return null;
  return (
    <aside
      aria-labelledby="o-que-fazer-agora"
      className="rounded-xl border border-primary/50 bg-deep/40 p-5"
    >
      <h2 id="o-que-fazer-agora" className="font-display text-lg font-bold text-primary">
        O que fazer agora
      </h2>
      <div className="mt-3">
        <Markdown source={source} />
      </div>
    </aside>
  );
}
