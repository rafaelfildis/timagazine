"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { CATEGORIES, MODALITIES, type Modality } from "@/config/taxonomy";
import { filtersToSearchParams, hasActiveFilters, type Ordem, type PostFilters } from "@/lib/posts/filters";
import type { FilterOptions } from "@/lib/posts/filter-options";

const DEBOUNCE_MS = 300;

type Values = {
  q: string;
  categoria: string;
  modalidade: string;
  autor: string;
  tag: string[];
  de: string;
  ate: string;
  ordem: Ordem;
};

function fromFilters(f: PostFilters): Values {
  return {
    q: f.q ?? "",
    categoria: f.categoria ?? "",
    modalidade: f.modalidade ?? "",
    autor: f.autor ?? "",
    tag: f.tag ?? [],
    de: f.de ?? "",
    ate: f.ate ?? "",
    ordem: f.ordem,
  };
}

/** Sempre volta para a página 1: qualquer mudança de filtro reinicia a paginação. */
function toQueryString(v: Values): string {
  const f: PostFilters = { ordem: v.ordem, pagina: 1 };
  const q = v.q.trim();
  if (q) f.q = q;
  if (v.categoria) f.categoria = v.categoria;
  if (v.modalidade) f.modalidade = v.modalidade as Modality;
  if (v.autor) f.autor = v.autor;
  if (v.tag.length) f.tag = v.tag;
  if (v.de) f.de = v.de;
  if (v.ate) f.ate = v.ate;
  if (f.ordem === "relevancia" && !f.q) f.ordem = "recentes";
  return filtersToSearchParams(f).toString();
}

const noopSubscribe = () => () => {};
/** false no servidor e na hidratação; true depois. Sinaliza que os handlers estão ativos. */
const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

const FIELD =
  "min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-muted";
const LABEL = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted";

export function FilterBar({ filters, options }: { filters: PostFilters; options: FilterOptions }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [, startTransition] = useTransition();
  const [values, setValues] = useState<Values>(() => fromFilters(filters));
  const [tagsOpen, setTagsOpen] = useState(Boolean(filters.tag?.length));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fila, em ordem, das URLs que este componente pediu e que ainda não chegaram. A chegada de
  // uma delas não sobrescreve o que a pessoa continua digitando (e descarta as anteriores a
  // ela, que o roteador pode ter pulado). Uma URL fora da fila é mudança externa (limpar,
  // voltar, busca do cabeçalho): os campos voltam a refletir a URL.
  const queue = useRef<string[]>([]);
  const urlKey = toQueryString(fromFilters(filters));
  // URL atual, para `push` (que roda em handlers e no debounce) comparar sem closure velha.
  const currentKey = useRef(urlKey);

  useEffect(() => {
    currentKey.current = urlKey;
    const mine = queue.current.indexOf(urlKey);
    if (mine !== -1) {
      queue.current.splice(0, mine + 1);
      return;
    }
    queue.current = [];
    if (timer.current) clearTimeout(timer.current);
    setValues(fromFilters(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `urlKey` já resume `filters`
  }, [urlKey]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function push(next: Values) {
    const qs = toQueryString(next);
    // Destino já pedido (ou já na URL, ex.: Enter sem mudar nada): não navega nem registra,
    // senão a fila guardaria uma URL que nunca vai "chegar".
    const target = queue.current.length ? queue.current[queue.current.length - 1] : currentKey.current;
    if (qs === target) return;
    queue.current.push(qs);
    startTransition(() => {
      router.replace(qs ? `/noticias?${qs}` : "/noticias", { scroll: false });
    });
  }

  function change(patch: Partial<Values>, { debounce = false } = {}) {
    let next = { ...values, ...patch };
    // Ordenação "natural": com busca vira relevância, sem busca volta a recentes.
    if ("q" in patch) {
      const had = values.q.trim() !== "";
      const has = next.q.trim() !== "";
      if (!had && has && next.ordem === "recentes") next = { ...next, ordem: "relevancia" };
      if (had && !has && next.ordem === "relevancia") next = { ...next, ordem: "recentes" };
    }
    setValues(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounce) timer.current = setTimeout(() => push(next), DEBOUNCE_MS);
    else push(next);
  }

  function toggleTag(slug: string, on: boolean) {
    const set = new Set(values.tag);
    if (on) set.add(slug);
    else set.delete(slug);
    change({ tag: options.tags.map((t) => t.slug).filter((s) => set.has(s)) });
  }

  const showOrderRelevance = values.q.trim() !== "";
  const active = hasActiveFilters(filters);

  return (
    <form
      action="/noticias"
      method="get"
      aria-label="Filtros"
      data-hydrated={hydrated ? "true" : "false"}
      onSubmit={(e) => {
        if (!hydrated) return; // sem JS o navegador faz o GET
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        push(values);
      }}
      className="rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="f-q" className={LABEL}>
            Buscar
          </label>
          <input
            id="f-q"
            name="q"
            type="search"
            maxLength={200}
            value={values.q}
            placeholder="Palavra-chave, tema ou empresa"
            onChange={(e) => change({ q: e.target.value }, { debounce: true })}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="f-categoria" className={LABEL}>
            Categoria
          </label>
          <select
            id="f-categoria"
            name="categoria"
            value={values.categoria}
            onChange={(e) => change({ categoria: e.target.value })}
            className={FIELD}
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-modalidade" className={LABEL}>
            Modalidade
          </label>
          <select
            id="f-modalidade"
            name="modalidade"
            value={values.modalidade}
            onChange={(e) => change({ modalidade: e.target.value })}
            className={FIELD}
          >
            <option value="">Todas</option>
            {MODALITIES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {options.authors.length > 0 && (
          <div>
            <label htmlFor="f-autor" className={LABEL}>
              Autor
            </label>
            <select
              id="f-autor"
              name="autor"
              value={values.autor}
              onChange={(e) => change({ autor: e.target.value })}
              className={FIELD}
            >
              <option value="">Todos</option>
              {options.authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="f-de" className={LABEL}>
            De
          </label>
          <input
            id="f-de"
            name="de"
            type="date"
            value={values.de}
            max={values.ate || undefined}
            onChange={(e) => change({ de: e.target.value })}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="f-ate" className={LABEL}>
            Até
          </label>
          <input
            id="f-ate"
            name="ate"
            type="date"
            value={values.ate}
            min={values.de || undefined}
            onChange={(e) => change({ ate: e.target.value })}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="f-ordem" className={LABEL}>
            Ordenar por
          </label>
          <select
            id="f-ordem"
            name="ordem"
            value={values.ordem}
            onChange={(e) => change({ ordem: e.target.value as Ordem })}
            className={FIELD}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="lidas">Mais lidas</option>
            {showOrderRelevance && <option value="relevancia">Relevância</option>}
          </select>
        </div>
      </div>

      {options.tags.length > 0 && (
        <details
          open={tagsOpen}
          onToggle={(e) => setTagsOpen(e.currentTarget.open)}
          className="mt-4 rounded-md border border-border"
        >
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-semibold text-text">
            Tags
            {values.tag.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-bg">{values.tag.length}</span>
            )}
          </summary>
          <fieldset className="border-t border-border px-3 py-3">
            <legend className="sr-only">Filtrar por tags (todas as marcadas)</legend>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {options.tags.map((t) => (
                <li key={t.slug}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      name="tag"
                      value={t.slug}
                      checked={values.tag.includes(t.slug)}
                      onChange={(e) => toggleTag(t.slug, e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    {t.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </details>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!hydrated && (
          <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-bg">
            Aplicar filtros
          </button>
        )}
        {active && (
          <Link
            href="/noticias"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
