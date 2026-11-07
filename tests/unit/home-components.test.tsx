import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { visibleQuickLinks } from "@/components/site/QuickLinks";
import { WhatsAppCta } from "@/components/site/WhatsAppCta";

const getSetting = vi.fn<(key: string) => Promise<string | null>>();
vi.mock("@/lib/settings", () => ({ getSetting: (key: string) => getSetting(key) }));
// O botão é um server component assíncrono (lê a mesma configuração); aqui basta um marcador.
vi.mock("@/components/site/WhatsAppButton", () => ({
  WhatsAppButton: () => <a href="https://wa.me/x">Assine no WhatsApp</a>,
}));

beforeEach(() => getSetting.mockReset());

describe("<WhatsAppCta>", () => {
  it("sem URL configurada não renderiza nada", async () => {
    getSetting.mockResolvedValue(null);
    expect(await WhatsAppCta({})).toBeNull();
  });

  it("com URL mostra a chamada e o botão", async () => {
    getSetting.mockResolvedValue("https://wa.me/x");
    render(await WhatsAppCta({}));
    expect(screen.getByRole("heading", { name: "Receba as notícias no WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assine no WhatsApp" })).toBeInTheDocument();
  });
});

describe("QuickLinks", () => {
  it("hoje só o atalho de notícias aparece (itens de planos futuros estão desativados)", () => {
    expect(visibleQuickLinks().map((q) => q.href)).toEqual(["/noticias"]);
  });
});
