import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CorrectionNote } from "@/components/posts/CorrectionNote";
import { Takeaways } from "@/components/posts/Takeaways";

describe("<Takeaways> (O que fazer agora)", () => {
  it("renderiza a caixa com o título e o markdown", () => {
    render(<Takeaways source={"- Revise as permissões\n- Ative o MFA"} />);
    expect(screen.getByRole("heading", { name: "O que fazer agora" })).toBeInTheDocument();
    expect(screen.getByText("Ative o MFA")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it.each([null, undefined, "", "   \n "])("não renderiza nada quando o texto é %j", (source) => {
    const { container } = render(<Takeaways source={source} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("<CorrectionNote>", () => {
  it("mostra 'Correção:' com o texto e a data de atualização (dd/MM/yyyy, Bahia)", () => {
    render(<CorrectionNote note="O nome da empresa estava errado." updatedAt={new Date("2026-11-05T15:00:00Z")} />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent("Correção:");
    expect(note).toHaveTextContent("O nome da empresa estava errado.");
    expect(note).toHaveTextContent("Atualizado em 05/11/2026");
    expect(screen.getByText("05/11/2026")).toHaveAttribute("datetime", "2026-11-05T15:00:00.000Z");
  });

  it.each([null, undefined, "", "  "])("não renderiza nada quando a nota é %j", (note) => {
    const { container } = render(<CorrectionNote note={note} updatedAt={new Date()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
