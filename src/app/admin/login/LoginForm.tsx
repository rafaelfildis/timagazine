"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const LABEL = "block text-sm font-medium text-text";
const FIELD =
  "mt-1.5 block min-h-11 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-base text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {/* Região ao vivo sempre presente: o leitor de tela anuncia o erro quando ele aparece. */}
      <div role="alert">
        {state?.error && (
          <p className="rounded-md border border-red-400/60 bg-red-950/40 p-3 text-sm text-red-200">
            {state.error}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="login-email" className={LABEL}>
          E-mail
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={LABEL}>
          Senha
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={1024}
          className={FIELD}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-md bg-primary px-4 py-2 font-display text-base font-bold text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
