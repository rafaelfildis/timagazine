"use client";

import { useEffect, useId, useRef, useState } from "react";

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Buscar"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-md text-text hover:text-primary"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      <form
        id={id}
        role="search"
        action="/noticias"
        method="get"
        hidden={!open}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            buttonRef.current?.focus();
          }
        }}
        className="absolute right-0 top-full z-50 mt-2 flex w-72 gap-2 rounded-md border border-border bg-surface p-2 shadow-lg"
      >
        <label htmlFor={`${id}-q`} className="sr-only">
          Buscar notícias
        </label>
        <input
          id={`${id}-q`}
          ref={inputRef}
          name="q"
          type="search"
          required
          placeholder="Buscar notícias"
          className="min-h-10 w-full rounded bg-bg px-3 text-sm text-text placeholder:text-muted"
        />
        <button type="submit" className="min-h-10 rounded bg-primary px-3 text-sm font-semibold text-bg">
          Buscar
        </button>
      </form>
    </div>
  );
}
