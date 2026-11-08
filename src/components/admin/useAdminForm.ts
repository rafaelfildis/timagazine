"use client";

import { startTransition, useActionState, useSyncExternalStore, type FormEvent } from "react";
import type { FormState } from "@/app/admin/(painel)/actions";

const noopSubscribe = () => () => {};

/**
 * Envia o formulário pela server action SEM usar `action={...}`: assim o React não limpa
 * os campos depois do envio e quem digitou não perde o texto quando há erro de validação.
 * `ready` só fica true depois da hidratação (antes, o envio nativo não passa pela action).
 */
export function useAdminForm(action: (prev: FormState, data: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(
      form,
      submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter : null,
    );
    startTransition(() => dispatch(data));
  }

  return { state, pending, ready, onSubmit };
}
