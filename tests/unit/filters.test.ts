import { describe, expect, it } from "vitest";
import { filtersToSearchParams, parseFilters, type PostFilters } from "@/lib/posts/filters";

describe("parseFilters", () => {
  it("pagina inválida vira 1", () => {
    expect(parseFilters({ pagina: "abc" }).pagina).toBe(1);
    expect(parseFilters({ pagina: "0" }).pagina).toBe(1);
    expect(parseFilters({ pagina: "-3" }).pagina).toBe(1);
    expect(parseFilters({ pagina: "2" }).pagina).toBe(2);
  });

  it("categoria inexistente é descartada", () => {
    expect(parseFilters({ categoria: "inexistente" }).categoria).toBeUndefined();
    expect(parseFilters({ categoria: "ciberseguranca" }).categoria).toBe("ciberseguranca");
  });

  it("modalidade e autor inválidos são descartados", () => {
    expect(parseFilters({ modalidade: "xyz" }).modalidade).toBeUndefined();
    expect(parseFilters({ modalidade: "analise" }).modalidade).toBe("analise");
    expect(parseFilters({ autor: "nao-e-uuid" }).autor).toBeUndefined();
    const id = "3f2b8c1e-9a4d-4e7b-8c55-0d1f2a3b4c5d";
    expect(parseFilters({ autor: id }).autor).toBe(id);
  });

  it("troca de/ate quando de > ate", () => {
    const f = parseFilters({ de: "2026-12-01", ate: "2026-01-01" });
    expect(f.de).toBe("2026-01-01");
    expect(f.ate).toBe("2026-12-01");
  });

  it("descarta datas inválidas", () => {
    expect(parseFilters({ de: "2026-13-40" }).de).toBeUndefined();
    expect(parseFilters({ ate: "ontem" }).ate).toBeUndefined();
  });

  it("ordem padrão depende de q", () => {
    expect(parseFilters({ q: "nuvem" }).ordem).toBe("relevancia");
    expect(parseFilters({}).ordem).toBe("recentes");
    expect(parseFilters({ q: "nuvem", ordem: "lidas" }).ordem).toBe("lidas");
  });

  it("relevancia sem q vira recentes; ordem inválida usa o padrão", () => {
    expect(parseFilters({ ordem: "relevancia" }).ordem).toBe("recentes");
    expect(parseFilters({ ordem: "xyz" }).ordem).toBe("recentes");
  });

  it("q em branco é descartado", () => {
    expect(parseFilters({ q: "   " }).q).toBeUndefined();
    expect(parseFilters({ q: " nuvem " }).q).toBe("nuvem");
  });

  it("tag aceita array, repetição e lista separada por vírgula", () => {
    expect(parseFilters({ tag: ["ia", "cloud"] }).tag).toHaveLength(2);
    expect(parseFilters({ tag: "ia,cloud" }).tag).toEqual(["ia", "cloud"]);
    expect(parseFilters({ tag: ["ia", "ia", "Inválida!"] }).tag).toEqual(["ia"]);
    expect(parseFilters({ tag: "" }).tag).toBeUndefined();
  });

  it("usa o primeiro valor quando um parâmetro escalar vem repetido e nunca lança", () => {
    expect(parseFilters({ q: ["a", "b"] }).q).toBe("a");
    expect(() => parseFilters({ pagina: ["x"], de: ["y"], tag: [] })).not.toThrow();
  });
});

describe("filtersToSearchParams", () => {
  it("omite os padrões", () => {
    expect(filtersToSearchParams(parseFilters({})).toString()).toBe("");
    expect(filtersToSearchParams(parseFilters({ q: "nuvem" })).toString()).toBe("q=nuvem");
  });

  it("ida e volta com filtro completo", () => {
    const f: PostFilters = {
      q: "segurança em nuvem",
      categoria: "ciberseguranca",
      modalidade: "analise",
      autor: "3f2b8c1e-9a4d-4e7b-8c55-0d1f2a3b4c5d",
      tag: ["ia", "cloud"],
      de: "2026-01-01",
      ate: "2026-12-01",
      ordem: "lidas",
      pagina: 3,
    };
    const back = parseFilters(Object.fromEntries(filtersToSearchParams(f)));
    expect(back).toEqual(f);
  });

  it("ida e volta com relevância (padrão com q) e sem q", () => {
    const f1 = parseFilters({ q: "x", ordem: "relevancia" });
    expect(parseFilters(Object.fromEntries(filtersToSearchParams(f1)))).toEqual(f1);
    const f2 = parseFilters({ ordem: "antigas", pagina: "2" });
    expect(parseFilters(Object.fromEntries(filtersToSearchParams(f2)))).toEqual(f2);
  });
});
