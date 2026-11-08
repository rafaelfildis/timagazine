import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_POST, PostForm } from "@/components/admin/PostForm";

// A server action real fala com banco e sessão; aqui só importa a ordem dos botões.
vi.mock("@/app/admin/(painel)/actions", () => ({ savePostAction: vi.fn(async () => null) }));

const CATS = [{ id: 1, name: "Cibersegurança" }];

const firstSubmit = () =>
  screen.getByRole("form", { name: "Matéria" }).querySelector<HTMLButtonElement>('button[type="submit"]')!;
const title = () => screen.getByRole("textbox", { name: /^Título/ });

describe("PostForm: Enter (envio implícito) não muda o status sem querer", () => {
  it("na edição o primeiro botão de envio é 'Salvar alterações' (intent=keep)", () => {
    render(<PostForm initial={{ ...EMPTY_POST, id: "p1", title: "No ar", status: "published" }} categories={CATS} />);
    expect(firstSubmit()).toHaveTextContent("Salvar alterações");
    expect(firstSubmit()).toHaveAttribute("name", "intent");
    expect(firstSubmit()).toHaveAttribute("value", "keep");
    // Enter no título segue o envio implícito (que usa "keep").
    expect(fireEvent.keyDown(title(), { key: "Enter" })).toBe(true);
  });

  it("na matéria nova, Enter num campo de uma linha não envia; no texto (textarea) continua quebrando linha", () => {
    render(<PostForm initial={EMPTY_POST} categories={CATS} />);
    expect(screen.queryByRole("button", { name: "Salvar alterações" })).toBeNull();
    expect(fireEvent.keyDown(title(), { key: "Enter" })).toBe(false); // preventDefault
    expect(fireEvent.keyDown(screen.getByRole("textbox", { name: /^Tags/ }), { key: "Enter" })).toBe(false);
    expect(fireEvent.keyDown(screen.getByRole("textbox", { name: /^Linha fina/ }), { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(title(), { key: "a" })).toBe(true);
  });
});
