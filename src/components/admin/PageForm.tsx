"use client";

import { savePageAction } from "@/app/admin/(painel)/actions";
import { Field } from "./Field";
import { FormMessages } from "./FormMessages";
import { MarkdownField } from "./MarkdownField";
import { useAdminForm } from "./useAdminForm";
import { BTN_PRIMARY, BTN_SECONDARY } from "./styles";

export function PageForm({
  slug,
  title,
  body,
  publicPath,
}: {
  slug: string;
  title: string;
  body: string;
  publicPath: string;
}) {
  const { state, pending, ready, onSubmit } = useAdminForm(savePageAction);
  const errors = state?.errors ?? {};
  return (
    <form method="post" onSubmit={onSubmit} noValidate data-ready={ready ? "true" : undefined} className="space-y-6" aria-label="Página">
      <input type="hidden" name="slug" value={slug} />
      <FormMessages state={state} labels={{ title: "Título", body: "Texto" }} />
      <Field id="f-title" label="Título" required error={errors.title}>
        {(p) => <input {...p} name="title" type="text" maxLength={200} defaultValue={title} />}
      </Field>
      <MarkdownField name="body" label="Texto (markdown)" defaultValue={body} rows={20} required error={errors.body} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !ready} className={BTN_PRIMARY}>
          {pending ? "Salvando…" : "Salvar página"}
        </button>
        <a href={publicPath} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
          Ver no site<span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </form>
  );
}
