"use client";

import { useRef, useState } from "react";
import { saveHighlightsAction, searchPostsAction } from "@/app/admin/(painel)/actions";
import { FormMessages } from "./FormMessages";
import { useAdminForm } from "./useAdminForm";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, LABEL } from "./styles";

type Option = { id: string; title: string };

const SLOTS = [1, 2, 3, 4, 5] as const;

function Slot({ position, initial }: { position: number; initial: Option | null }) {
  const [selected, setSelected] = useState<Option | null>(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Option[] | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);
  const inputId = `slot-${position}-busca`;

  async function search() {
    const ticket = ++latest.current;
    setBusy(true);
    try {
      const found = await searchPostsAction(query);
      if (ticket === latest.current) setResults(found);
    } finally {
      if (ticket === latest.current) setBusy(false);
    }
  }

  return (
    <li className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="font-display text-base font-bold">
        Posição {position}
        {position === 1 && <span className="font-sans text-sm font-normal text-muted"> (destaque principal)</span>}
      </h2>
      <input type="hidden" name={`slot${position}`} value={selected?.id ?? ""} />
      <p>
        {selected ? (
          <>
            <span className="sr-only">Matéria escolhida: </span>
            <strong data-testid={`slot-${position}-escolhida`}>{selected.title}</strong>
          </>
        ) : (
          <span className="text-muted">Vazia: a Home usa a matéria publicada mais recente que sobrar.</span>
        )}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor={inputId} className={LABEL}>
            Buscar matéria publicada
          </label>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            className={FIELD}
          />
        </div>
        <button type="button" onClick={() => void search()} className={BTN_SECONDARY}>
          Buscar<span className="sr-only"> para a posição {position}</span>
        </button>
        {selected && (
          <button type="button" onClick={() => setSelected(null)} className={BTN_SECONDARY}>
            Remover<span className="sr-only"> a matéria da posição {position}</span>
          </button>
        )}
      </div>
      <div aria-live="polite">
        {busy && <p className="text-sm text-muted">Buscando…</p>}
        {!busy && results && results.length === 0 && (
          <p className="text-sm text-muted">Nenhuma matéria publicada encontrada.</p>
        )}
        {!busy && results && results.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border" aria-label={`Resultados para a posição ${position}`}>
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(r);
                    setResults(null);
                    setQuery("");
                  }}
                  className="flex min-h-11 w-full items-center px-3 py-2 text-left text-sm text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function HighlightsEditor({ initial }: { initial: (Option | null)[] }) {
  const { state, pending, ready, onSubmit } = useAdminForm(saveHighlightsAction);
  return (
    <form method="post" onSubmit={onSubmit} noValidate data-ready={ready ? "true" : undefined} className="space-y-6" aria-label="Destaques da Home">
      <FormMessages state={state} labels={{}} />
      <ol className="space-y-4">
        {SLOTS.map((n) => (
          <Slot key={n} position={n} initial={initial[n - 1] ?? null} />
        ))}
      </ol>
      <button type="submit" disabled={pending || !ready} className={BTN_PRIMARY}>
        {pending ? "Salvando…" : "Salvar destaques"}
      </button>
    </form>
  );
}
