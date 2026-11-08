"use client";

import { saveSettingsAction } from "@/app/admin/(painel)/actions";
import { Field } from "./Field";
import { FormMessages } from "./FormMessages";
import { useAdminForm } from "./useAdminForm";
import { BTN_PRIMARY } from "./styles";

export function SettingsForm({ whatsapp }: { whatsapp: string }) {
  const { state, pending, ready, onSubmit } = useAdminForm(saveSettingsAction);
  const errors = state?.errors ?? {};
  return (
    <form method="post" onSubmit={onSubmit} noValidate data-ready={ready ? "true" : undefined} className="space-y-6" aria-label="Configurações">
      <FormMessages state={state} labels={{ whatsapp_channel_url: "Canal do WhatsApp" }} />
      <Field
        id="f-whatsapp_channel_url"
        label="URL do Canal do WhatsApp"
        hint="Formato https://whatsapp.com/channel/… Deixe vazio para esconder o botão “Assine no WhatsApp” do site."
        error={errors.whatsapp_channel_url}
      >
        {(p) => (
          <input
            {...p}
            name="whatsapp_channel_url"
            type="url"
            inputMode="url"
            maxLength={300}
            defaultValue={whatsapp}
            placeholder="https://whatsapp.com/channel/…"
          />
        )}
      </Field>
      <button type="submit" disabled={pending || !ready} className={BTN_PRIMARY}>
        {pending ? "Salvando…" : "Salvar configurações"}
      </button>
    </form>
  );
}
