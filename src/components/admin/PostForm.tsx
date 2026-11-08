"use client";

import { useState, type KeyboardEvent } from "react";
import { savePostAction } from "@/app/admin/(painel)/actions";
import { MODALITIES, ORIGIN_LABEL, type Modality, type Origin } from "@/config/taxonomy";
import { Field } from "./Field";
import { FormMessages } from "./FormMessages";
import { ImageUpload } from "./ImageUpload";
import { MarkdownField } from "./MarkdownField";
import { useAdminForm } from "./useAdminForm";
import { BTN_PRIMARY, BTN_SECONDARY, FIELDSET, LEGEND } from "./styles";

export type PostFormValues = {
  id?: string;
  title: string;
  dek: string;
  slug: string;
  body: string;
  categoryId?: number;
  modality: Modality;
  origin: Origin;
  sourceName: string;
  sourceUrl: string;
  sponsored: boolean;
  imageUrl: string;
  imageAlt: string;
  imageAi: boolean;
  takeaways: string;
  correctionNote: string;
  /** Nomes separados por vírgula. */
  tags: string;
  status: "draft" | "published";
  /** Valor de datetime-local no horário da Bahia (ou vazio). */
  publishedAt: string;
};

export const EMPTY_POST: PostFormValues = {
  title: "",
  dek: "",
  slug: "",
  body: "",
  modality: "noticia",
  origin: "propria",
  sourceName: "",
  sourceUrl: "",
  sponsored: false,
  imageUrl: "",
  imageAlt: "",
  imageAi: false,
  takeaways: "",
  correctionNote: "",
  tags: "",
  status: "draft",
  publishedAt: "",
};

const LABELS: Record<string, string> = {
  title: "Título",
  dek: "Linha fina",
  slug: "Endereço (slug)",
  body: "Texto",
  takeaways: "O que fazer agora",
  correctionNote: "Nota de correção",
  categoryId: "Categoria",
  modality: "Modalidade",
  origin: "Origem",
  sourceName: "Fonte",
  sourceUrl: "Link da fonte",
  tagNames: "Tags",
  imageUrl: "Imagem",
  imageAlt: "Texto alternativo",
  status: "Status",
  publishedAt: "Data de publicação",
};

type Props = {
  initial: PostFormValues;
  categories: { id: number; name: string }[];
  /** URL pública quando a matéria já está no ar. */
  publicUrl?: string;
  /** Mostra "Matéria criada" ao abrir logo depois de criar. */
  justCreated?: boolean;
};

/** Tipos de input em que Enter dispararia o envio implícito do formulário. */
const SINGLE_LINE = new Set(["text", "url", "search", "email", "tel", "number", "password", "date", "datetime-local", "time", "month", "week"]);

/**
 * Matéria nova: Enter no meio da digitação não pode criar a matéria e trocar de página.
 * Só os botões criam. (Textareas seguem com Enter = nova linha.)
 */
function blockImplicitSubmit(event: KeyboardEvent<HTMLFormElement>) {
  const target = event.target;
  if (event.key === "Enter" && target instanceof HTMLInputElement && SINGLE_LINE.has(target.type)) {
    event.preventDefault();
  }
}

export function PostForm({ initial, categories, publicUrl, justCreated }: Props) {
  const { state, pending, ready, onSubmit } = useAdminForm(savePostAction);
  const [origin, setOrigin] = useState<Origin>(initial.origin);
  const status = state?.status ?? initial.status;
  const errors = state?.errors ?? {};
  const editing = !!initial.id;

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      onKeyDown={editing ? undefined : blockImplicitSubmit}
      noValidate
      data-ready={ready ? "true" : undefined}
      className="space-y-6"
      aria-label="Matéria"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormMessages state={state} labels={LABELS} saved={justCreated ? "Matéria criada." : undefined} />

      <fieldset className={FIELDSET}>
        <legend className={LEGEND}>Texto</legend>
        <Field id="f-title" label="Título" required error={errors.title}>
          {(p) => <input {...p} name="title" type="text" maxLength={200} defaultValue={initial.title} />}
        </Field>
        <Field id="f-dek" label="Linha fina" hint="Resumo de uma ou duas frases. Obrigatória para publicar." error={errors.dek}>
          {(p) => <textarea {...p} name="dek" rows={2} maxLength={400} defaultValue={initial.dek} />}
        </Field>
        <Field
          id="f-slug"
          label="Endereço (slug)"
          hint={editing ? "Em branco mantém o endereço atual. Se o novo já existir, o sistema acrescenta -2, -3…" : "Em branco gera a partir do título. Se já existir, o sistema acrescenta -2, -3…"}
          error={errors.slug}
        >
          {(p) => <input {...p} name="slug" type="text" maxLength={120} defaultValue={initial.slug} />}
        </Field>
        <MarkdownField
          name="body"
          label="Texto da matéria (markdown)"
          defaultValue={initial.body}
          error={errors.body}
          hint="Use ## para intertítulos, - para listas e [texto](link) para links."
        />
        <MarkdownField
          name="takeaways"
          label="O que fazer agora (opcional)"
          defaultValue={initial.takeaways}
          rows={6}
          error={errors.takeaways}
          hint="Caixa de ações práticas exibida depois do texto."
        />
        <Field
          id="f-correctionNote"
          label="Nota de correção (opcional)"
          hint="Aparece no topo da matéria com a data de atualização."
          error={errors.correctionNote}
        >
          {(p) => <textarea {...p} name="correctionNote" rows={3} maxLength={2000} defaultValue={initial.correctionNote} />}
        </Field>
      </fieldset>

      <fieldset className={FIELDSET}>
        <legend className={LEGEND}>Classificação</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="f-categoryId" label="Categoria" required error={errors.categoryId}>
            {(p) => (
              <select {...p} name="categoryId" defaultValue={initial.categoryId ?? ""}>
                <option value="">Escolha…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="f-modality" label="Modalidade" required error={errors.modality}>
            {(p) => (
              <select {...p} name="modality" defaultValue={initial.modality}>
                {MODALITIES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field
          id="f-tagNames"
          label="Tags"
          hint="Separe por vírgula. As que ainda não existem são criadas ao salvar. Máximo de 10."
          error={errors.tagNames}
        >
          {(p) => <input {...p} name="tagNames" type="text" defaultValue={initial.tags} />}
        </Field>
        <Field id="f-origin" label="Origem" required error={errors.origin}>
          {(p) => (
            <select
              {...p}
              name="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value as Origin)}
            >
              {(Object.keys(ORIGIN_LABEL) as Origin[]).map((o) => (
                <option key={o} value={o}>
                  {ORIGIN_LABEL[o]}
                </option>
              ))}
            </select>
          )}
        </Field>
        {origin === "curadoria" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="f-sourceName" label="Nome da fonte" required error={errors.sourceName}>
              {(p) => <input {...p} name="sourceName" type="text" maxLength={200} defaultValue={initial.sourceName} />}
            </Field>
            <Field id="f-sourceUrl" label="Link da fonte" required hint="Começa com https://" error={errors.sourceUrl}>
              {(p) => <input {...p} name="sourceUrl" type="url" maxLength={2000} defaultValue={initial.sourceUrl} />}
            </Field>
          </div>
        )}
        <label className="flex min-h-11 items-center gap-3 text-sm text-text">
          <input type="checkbox" name="sponsored" defaultChecked={initial.sponsored} className="size-5 accent-primary" />
          Conteúdo patrocinado
        </label>
      </fieldset>

      <fieldset className={FIELDSET}>
        <legend className={LEGEND}>Imagem</legend>
        <ImageUpload
          defaultUrl={initial.imageUrl}
          defaultAlt={initial.imageAlt}
          defaultAi={initial.imageAi}
          urlError={errors.imageUrl}
          altError={errors.imageAlt}
        />
      </fieldset>

      <fieldset className={FIELDSET}>
        <legend className={LEGEND}>Publicação</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="block text-sm font-medium text-text">Status atual</p>
            <p data-testid="status-atual" className="mt-1.5 flex min-h-11 items-center text-base">
              {status === "published" ? "Publicada" : "Rascunho"}
            </p>
            <p className="mt-0.5 text-sm text-muted">Use os botões abaixo para mudar: Salvar rascunho, Publicar ou Salvar alterações (mantém o status).</p>
          </div>
          <Field
            id="f-publishedAt"
            label="Data de publicação"
            hint="Horário da Bahia. Uma data futura agenda a publicação. Em branco: publica agora, ou mantém a data já definida."
            error={errors.publishedAt}
          >
            {(p) => <input {...p} name="publishedAt" type="datetime-local" defaultValue={initial.publishedAt} />}
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        {/* Enter num campo de uma linha envia pelo PRIMEIRO botão de envio do formulário.
            Na edição ele precisa ser "Salvar alterações" (mantém o status): se fosse
            "Salvar rascunho", um Enter no título tiraria do ar uma matéria publicada. */}
        {editing && (
          <button type="submit" name="intent" value="keep" disabled={pending || !ready} className={BTN_SECONDARY}>
            Salvar alterações
          </button>
        )}
        <button type="submit" name="intent" value="draft" disabled={pending || !ready} className={BTN_SECONDARY}>
          Salvar rascunho
        </button>
        <button type="submit" name="intent" value="publish" disabled={pending || !ready} className={BTN_PRIMARY}>
          Publicar
        </button>
        {publicUrl ? (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
            Ver no site<span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : (
          <span className="text-sm text-muted">&quot;Ver no site&quot; fica disponível quando a matéria estiver no ar.</span>
        )}
        {pending && <span role="status" className="text-sm text-muted">Salvando…</span>}
      </div>
    </form>
  );
}
