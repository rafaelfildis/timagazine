import { describe, expect, it } from "vitest";
import { bahiaInputToDate, dateToBahiaInput } from "@/lib/posts/datetime";

describe("datetime-local em America/Bahia (UTC-3)", () => {
  it("interpreta o valor digitado como horário da Bahia", () => {
    expect(bahiaInputToDate("2026-11-07T10:30")?.toISOString()).toBe("2026-11-07T13:30:00.000Z");
    expect(bahiaInputToDate("2026-11-07T23:30")?.toISOString()).toBe("2026-11-08T02:30:00.000Z");
  });

  it("devolve a data de volta no formato do campo", () => {
    expect(dateToBahiaInput(new Date("2026-11-07T13:30:00.000Z"))).toBe("2026-11-07T10:30");
    expect(dateToBahiaInput(new Date("2026-11-08T02:30:00.000Z"))).toBe("2026-11-07T23:30");
  });

  it("ida e volta preserva o valor", () => {
    const v = "2027-01-15T08:05";
    expect(dateToBahiaInput(bahiaInputToDate(v)!)).toBe(v);
  });

  it("valor vazio ou inválido vira undefined", () => {
    expect(bahiaInputToDate("")).toBeUndefined();
    expect(bahiaInputToDate("ontem")).toBeUndefined();
    expect(bahiaInputToDate("2026-13-45T99:99")).toBeUndefined();
  });
});
