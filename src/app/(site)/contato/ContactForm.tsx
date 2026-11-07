"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitContact, type ContactState } from "./actions";

type Subject = { value: string; label: string };

const LABEL = "block text-sm font-medium text-text";
const FIELD =
  "mt-1.5 block min-h-11 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-base text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-red-400";
const ERROR = "mt-1.5 text-sm text-red-300";

export function ContactForm({ subjects }: { subjects: readonly Subject[] }) {
  const [state, action, pending] = useActionState<ContactState | null, FormData>(
    submitContact,
    null,
  );

  if (state?.ok) {
    return (
      <div role="status" className="rounded-xl border border-primary/40 bg-surface p-6">
        <p className="font-display text-xl font-bold">Mensagem enviada. Obrigado pelo contato!</p>
        <p className="mt-2 text-muted">Responderemos assim que possível.</p>
      </div>
    );
  }

  const errors = state?.errors ?? {};
  const v = state?.values ?? {};
  const err = (k: string) => (errors[k] ? `err-${k}` : undefined);

  return (
    <form
      action={action}
      noValidate
      className="relative space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      {errors.form && (
        <p
          role="alert"
          className="rounded-md border border-red-400/60 bg-red-950/40 p-3 text-sm text-red-200"
        >
          {errors.form}
        </p>
      )}

      <div>
        <label htmlFor="c-name" className={LABEL}>
          Nome
        </label>
        <input
          id="c-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          defaultValue={v.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={err("name")}
          className={FIELD}
        />
        {errors.name && (
          <p id="err-name" className={ERROR}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="c-email" className={LABEL}>
          E-mail
        </label>
        <input
          id="c-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={v.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={err("email")}
          className={FIELD}
        />
        {errors.email && (
          <p id="err-email" className={ERROR}>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="c-subject" className={LABEL}>
          Assunto
        </label>
        <select
          id="c-subject"
          name="subject"
          required
          defaultValue={v.subject ?? ""}
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={err("subject")}
          className={FIELD}
        >
          <option value="" disabled>
            Selecione…
          </option>
          {subjects.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p id="err-subject" className={ERROR}>
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="c-message" className={LABEL}>
          Mensagem
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={6}
          required
          maxLength={5000}
          defaultValue={v.message}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={err("message")}
          className={FIELD}
        />
        {errors.message && (
          <p id="err-message" className={ERROR}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: fora da tela, fora da ordem de tabulação e escondido de leitores de tela. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="c-website">Não preencha este campo</label>
        <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="c-consent"
            name="consent"
            type="checkbox"
            required
            defaultChecked={v.consent === "on"}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={err("consent")}
            className="mt-1 size-5 shrink-0 accent-[#16E65C]"
          />
          <label htmlFor="c-consent" className="text-sm text-text">
            Li e concordo com o tratamento dos meus dados conforme a{" "}
            <Link
              href="/politica-de-privacidade"
              className="text-primary underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
            .
          </label>
        </div>
        {errors.consent && (
          <p id="err-consent" className={ERROR}>
            {errors.consent}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-bg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  );
}
