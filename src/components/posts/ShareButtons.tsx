"use client";

import { useState } from "react";

type Props = { url: string; title: string };

const linkClass =
  "inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-text hover:border-primary hover:text-primary";

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        className={linkClass}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <a
        className={linkClass}
        href={`https://wa.me/?text=${t}%20${u}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <a
        className={linkClass}
        href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X
      </a>
      <button type="button" onClick={copy} className={linkClass}>
        Copiar link
      </button>
      <span role="status" className="text-sm text-muted">
        {copied ? "Link copiado" : ""}
      </span>
    </div>
  );
}
