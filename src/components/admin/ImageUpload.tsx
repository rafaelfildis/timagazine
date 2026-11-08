"use client";

import { useRef, useState } from "react";
import { Field } from "./Field";
import { BTN_SECONDARY, FIELD, LABEL } from "./styles";

type Props = {
  defaultUrl?: string;
  defaultAlt?: string;
  defaultAi?: boolean;
  urlError?: string;
  altError?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 5 * 1024 * 1024;

/** Envio de imagem (POST /api/upload) + texto alternativo e opção "gerada por IA". Preenche imageUrl/imageAlt/imageAi no form. */
export function ImageUpload({ defaultUrl = "", defaultAlt = "", defaultAi = false, urlError, altError }: Props) {
  const [url, setUrl] = useState(defaultUrl);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error" | "ok"; text: string }>({
    kind: "idle",
    text: "",
  });
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setStatus({ kind: "error", text: "A imagem passa de 5 MB." });
      return;
    }
    setStatus({ kind: "busy", text: "Enviando imagem…" });
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (res.redirected || res.status === 401) {
        setStatus({ kind: "error", text: "Sua sessão expirou. Entre de novo para enviar imagens." });
        return;
      }
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setStatus({ kind: "error", text: data?.error ?? "Não foi possível enviar a imagem." });
        return;
      }
      setUrl(data.url);
      setStatus({ kind: "ok", text: "Imagem enviada." });
    } catch {
      setStatus({ kind: "error", text: "Falha de conexão ao enviar a imagem." });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="imageUrl" value={url} />
      <div>
        <label htmlFor="f-imageFile" className={LABEL}>
          Imagem de capa
        </label>
        <p id="f-imageFile-hint" className="mt-0.5 text-sm text-muted">
          JPEG, PNG, WebP ou AVIF, até 5 MB.
        </p>
        <input
          ref={input}
          id="f-imageFile"
          type="file"
          accept={ACCEPT}
          aria-describedby={["f-imageFile-hint", "f-imageFile-status", urlError ? "f-imageUrl-error" : ""]
            .filter(Boolean)
            .join(" ")}
          onChange={(e) => void onFile(e.target.files?.[0])}
          className={`${FIELD} file:mr-3 file:rounded file:border-0 file:bg-surface file:px-3 file:py-1 file:text-text`}
        />
        <p
          id="f-imageFile-status"
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-1.5 min-h-5 text-sm ${status.kind === "error" ? "text-red-300" : "text-muted"}`}
        >
          {status.text}
        </p>
        {urlError && (
          <p id="f-imageUrl-error" className="text-sm text-red-300">
            {urlError}
          </p>
        )}
      </div>

      {url && (
        <div className="flex items-start gap-4">
          {/* Prévia do arquivo recém-enviado (origem controlada pelo painel); next/image não agrega aqui. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Prévia da imagem de capa" className="h-24 w-40 rounded-md border border-border object-cover" />
          <button type="button" className={BTN_SECONDARY} onClick={() => setUrl("")}>
            Remover imagem
          </button>
        </div>
      )}

      <Field
        id="f-imageAlt"
        label="Texto alternativo da imagem"
        hint="Descreva o que aparece na imagem. Obrigatório quando há imagem."
        error={altError}
        required={!!url}
      >
        {(p) => <input {...p} name="imageAlt" type="text" maxLength={300} defaultValue={defaultAlt} />}
      </Field>

      <label className="flex min-h-11 items-center gap-3 text-sm text-text">
        <input type="checkbox" name="imageAi" defaultChecked={defaultAi} className="size-5 accent-primary" />
        Imagem gerada por IA (a matéria mostra &quot;Ilustração gerada por IA&quot;)
      </label>
    </div>
  );
}
