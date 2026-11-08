"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/app/admin/(painel)/actions";

/**
 * Resumo de erros (role="alert", recebe o foco) e aviso de sucesso (role="status").
 * `labels` traduz o nome do campo para o texto mostrado na lista.
 */
export function FormMessages({
  state,
  labels,
  saved,
}: {
  state: FormState;
  labels: Record<string, string>;
  /** Mensagem exibida quando a página abre logo depois de criar (?salvo=1). */
  saved?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const errors = state?.errors ? Object.entries(state.errors) : [];

  useEffect(() => {
    if (errors.length) ref.current?.focus();
    // O objeto de erros muda a cada envio; basta reagir a ele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.errors]);

  return (
    <>
      <div role="alert" ref={ref} tabIndex={-1} className="focus:outline-none">
        {errors.length > 0 && (
          <div className="rounded-md border border-red-400/60 bg-red-950/40 p-3 text-sm text-red-200">
            <p className="font-semibold">Corrija {errors.length === 1 ? "este campo" : "estes campos"}:</p>
            <ul className="mt-1 list-disc pl-5">
              {errors.map(([field, message]) => (
                <li key={field}>
                  {labels[field] ? (
                    <a href={`#f-${field}`} className="underline">
                      {labels[field]}
                    </a>
                  ) : null}
                  {labels[field] ? ": " : ""}
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div role="status">
        {state?.ok && state.message ? (
          <p className="rounded-md border border-primary/50 bg-deep/40 p-3 text-sm text-text">{state.message}</p>
        ) : !state && saved ? (
          <p className="rounded-md border border-primary/50 bg-deep/40 p-3 text-sm text-text">{saved}</p>
        ) : null}
      </div>
    </>
  );
}
