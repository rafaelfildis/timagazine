import type { Modality } from "@/config/taxonomy";

type Props = { sponsored: boolean; modality: Modality };

export function PostBadges({ sponsored, modality }: Props) {
  if (!sponsored && modality !== "opiniao") return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {sponsored && (
        <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-bg">
          Patrocinado
        </span>
      )}
      {modality === "opiniao" && (
        <span className="rounded border border-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">
          Opinião
        </span>
      )}
    </span>
  );
}
