"use client";

import { useState, type KeyboardEvent } from "react";
import { Markdown } from "@/lib/markdown";
import { FIELD, LABEL } from "./styles";

type Props = {
  /** Nome do campo no formulário; o id vira `f-${name}`. */
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  error?: string;
  required?: boolean;
};

const TAB =
  "min-h-11 rounded-t-md border border-b-0 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Textarea de markdown com aba "Pré-visualizar" (mesmo renderizador do site). A textarea fica sempre montada. */
export function MarkdownField({ name, label, defaultValue = "", rows = 14, hint, error, required }: Props) {
  const id = `f-${name}`;
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = tab === "write" ? "preview" : "write";
      setTab(next);
      document.getElementById(`${id}-tab-${next}`)?.focus();
    }
  }

  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && <span className="text-muted"> (obrigatório)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <div role="tablist" aria-label={`Modo de edição: ${label}`} className="mt-2 flex gap-1" onKeyDown={onKeyDown}>
        {(
          [
            ["write", "Escrever"],
            ["preview", "Pré-visualizar"],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`${id}-panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            className={`${TAB} ${tab === key ? "border-border bg-surface-2 text-primary" : "border-transparent text-muted hover:text-text"}`}
          >
            {text}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel-write`} aria-labelledby={`${id}-tab-write`} hidden={tab !== "write"}>
        <textarea
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={required ? true : undefined}
          className={`${FIELD} mt-0 rounded-tl-none font-mono text-sm`}
        />
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-preview`}
        aria-labelledby={`${id}-tab-preview`}
        hidden={tab !== "preview"}
        className="min-h-40 rounded-md rounded-tl-none border border-border bg-surface-2 p-4"
      >
        {tab === "preview" &&
          (value.trim() ? <Markdown source={value} /> : <p className="text-muted">Nada para pré-visualizar ainda.</p>)}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
