import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterBar } from "@/components/posts/FilterBar";
import { parseFilters } from "@/lib/posts/filters";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const OPTIONS = { tags: [], authors: [] };

/** Filtros como a página os recebe do servidor para uma URL de /noticias. */
const filtersOf = (url: string) =>
  parseFilters(Object.fromEntries(new URL(url, "http://localhost").searchParams));

/** Renderiza em `url` e devolve `arrive`, que simula a URL nova chegando (nova renderização do servidor). */
function setup(url = "/noticias") {
  const view = render(<FilterBar filters={filtersOf(url)} options={OPTIONS} />);
  const arrive = (next: string) => view.rerender(<FilterBar filters={filtersOf(next)} options={OPTIONS} />);
  return { arrive };
}

const busca = () => screen.getByLabelText("Buscar") as HTMLInputElement;
const categoria = () => screen.getByLabelText("Categoria") as HTMLSelectElement;
const ordem = () => screen.getByLabelText("Ordenar por") as HTMLSelectElement;
const lastReplace = () => replace.mock.calls.at(-1)?.[0];

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("FilterBar: sincronia entre campos e URL", () => {
  it("Enter sem mudança -> digita -> Limpar filtros: campos voltam ao vazio e a categoria não reaplica q", () => {
    const { arrive } = setup("/noticias");

    // Enter sem mudar nada: não navega (nem registra uma URL que nunca vai chegar).
    fireEvent.submit(screen.getByRole("form", { name: "Filtros" }));
    expect(replace).not.toHaveBeenCalled();

    fireEvent.change(busca(), { target: { value: "ia" } });
    act(() => vi.advanceTimersByTime(300));
    expect(lastReplace()).toBe("/noticias?q=ia");
    arrive("/noticias?q=ia");
    expect(busca().value).toBe("ia");
    expect(ordem().value).toBe("relevancia");

    // "Limpar filtros" (link para /noticias): mudança externa, os campos refletem a URL.
    arrive("/noticias");
    expect(busca().value).toBe("");
    expect(ordem().value).toBe("recentes");

    fireEvent.change(categoria(), { target: { value: "ciberseguranca" } });
    expect(lastReplace()).toBe("/noticias?categoria=ciberseguranca");
  });

  it("a chegada da própria URL não apaga o que a pessoa continuou digitando", () => {
    const { arrive } = setup("/noticias");
    fireEvent.change(busca(), { target: { value: "ia" } });
    act(() => vi.advanceTimersByTime(300));
    fireEvent.change(busca(), { target: { value: "ia generativa" } });
    arrive("/noticias?q=ia");
    expect(busca().value).toBe("ia generativa");
    act(() => vi.advanceTimersByTime(300));
    expect(lastReplace()).toBe("/noticias?q=ia+generativa");
    arrive("/noticias?q=ia+generativa");
    expect(busca().value).toBe("ia generativa");
  });

  it("mudança externa cancela a busca que ainda estava no debounce", () => {
    const { arrive } = setup("/noticias?q=nuvem");
    fireEvent.change(busca(), { target: { value: "nuvem privada" } });
    arrive("/noticias?categoria=ciberseguranca"); // ex.: voltar no navegador
    act(() => vi.advanceTimersByTime(1000));
    expect(replace).not.toHaveBeenCalled();
    expect(busca().value).toBe("");
    expect(categoria().value).toBe("ciberseguranca");
  });

  it("URLs puladas pelo roteador não deixam a fila presa", () => {
    const { arrive } = setup("/noticias");
    fireEvent.change(categoria(), { target: { value: "ciberseguranca" } });
    fireEvent.change(categoria(), { target: { value: "cloud-infraestrutura" } });
    // Só a última navegação chega.
    arrive("/noticias?categoria=cloud-infraestrutura");
    expect(categoria().value).toBe("cloud-infraestrutura");
    // Depois, uma mudança externa para a URL da primeira ainda é refletida.
    arrive("/noticias");
    arrive("/noticias?categoria=ciberseguranca");
    expect(categoria().value).toBe("ciberseguranca");
  });
});
