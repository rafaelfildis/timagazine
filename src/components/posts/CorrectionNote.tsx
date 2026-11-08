import { formatDate } from "@/lib/format";

/** Nota de correção no topo do corpo da matéria; sem texto, não renderiza nada. */
export function CorrectionNote({
  note,
  updatedAt,
}: {
  note: string | null | undefined;
  updatedAt: Date;
}) {
  if (!note?.trim()) return null;
  return (
    <p role="note" className="rounded-xl border border-border border-l-4 border-l-primary bg-surface px-4 py-3 text-sm text-text">
      <strong className="font-semibold">Correção:</strong> {note}{" "}
      <span className="text-muted">
        Atualizado em <time dateTime={updatedAt.toISOString()}>{formatDate(updatedAt)}</time>
      </span>
    </p>
  );
}
