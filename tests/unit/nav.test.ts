import { describe, expect, it } from "vitest";
import { NAV_ITEMS, visibleNav } from "@/config/nav";

describe("nav", () => {
  it("mostra só os itens habilitados, na ordem", () => {
    expect(visibleNav().map((i) => i.label)).toEqual(["Home", "Notícias", "Sobre", "Contato"]);
  });

  it("mantém na lista os itens de planos futuros, desabilitados", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home", "Notícias", "Empresas", "Relatórios", "Eventos", "Academia", "Sobre", "Contato",
    ]);
    expect(NAV_ITEMS.filter((i) => !i.enabled).map((i) => i.href)).toEqual([
      "/empresas", "/relatorio", "/eventos", "/academia",
    ]);
  });
});
