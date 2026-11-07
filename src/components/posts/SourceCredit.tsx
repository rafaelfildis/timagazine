type Props = { sourceName: string; sourceUrl: string | null };

export function SourceCredit({ sourceName, sourceUrl }: Props) {
  const safeUrl = sourceUrl && /^https?:\/\//i.test(sourceUrl) ? sourceUrl : null;
  return (
    <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
      Com informações de{" "}
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-2"
        >
          {sourceName}
        </a>
      ) : (
        <span className="font-semibold text-text">{sourceName}</span>
      )}
    </p>
  );
}
