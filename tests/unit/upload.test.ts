// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, isSameOriginRequest, sniffImage } from "@/lib/upload";

const bytes = (...parts: (number[] | string)[]) =>
  Uint8Array.from(
    parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)),
  );

describe("sniffImage (assinatura do arquivo, não o tipo declarado)", () => {
  it("reconhece JPEG, PNG, WebP e AVIF", () => {
    expect(sniffImage(bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF"))).toEqual({ mime: "image/jpeg", ext: "jpg" });
    expect(sniffImage(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "IHDR"))).toEqual({
      mime: "image/png",
      ext: "png",
    });
    expect(sniffImage(bytes("RIFF", [1, 2, 3, 4], "WEBPVP8 "))).toEqual({ mime: "image/webp", ext: "webp" });
    expect(sniffImage(bytes([0, 0, 0, 0x1c], "ftypavif", [0, 0, 0, 0], "mif1avif"))).toEqual({
      mime: "image/avif",
      ext: "avif",
    });
  });

  it("rejeita SVG, HTML, GIF, RIFF que não é WebP e ftyp que não é AVIF", () => {
    expect(sniffImage(bytes('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(sniffImage(bytes("<!doctype html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(bytes("GIF89a", [1, 0, 1, 0]))).toBeNull();
    expect(sniffImage(bytes("RIFF", [1, 2, 3, 4], "WAVEfmt "))).toBeNull();
    expect(sniffImage(bytes([0, 0, 0, 0x18], "ftypmp42", [0, 0, 0, 0], "isom"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe("isSameOriginRequest", () => {
  const h = (init: Record<string, string>) => new Headers(init);

  it("aceita Sec-Fetch-Site same-origin", () => {
    expect(isSameOriginRequest(h({ "sec-fetch-site": "same-origin", host: "a.com" }))).toBe(true);
  });

  it("rejeita cross-site, same-site e none", () => {
    for (const v of ["cross-site", "same-site", "none"]) {
      expect(isSameOriginRequest(h({ "sec-fetch-site": v, host: "a.com" }))).toBe(false);
    }
  });

  it("sem Sec-Fetch-Site, exige Origin com o mesmo host", () => {
    expect(isSameOriginRequest(h({ origin: "https://a.com", host: "a.com" }))).toBe(true);
    expect(isSameOriginRequest(h({ origin: "https://evil.com", host: "a.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "null", host: "a.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ host: "a.com" }))).toBe(false);
  });

  it("Sec-Fetch-Site same-origin com Origin de outro host ainda é recusado", () => {
    expect(
      isSameOriginRequest(h({ "sec-fetch-site": "same-origin", origin: "https://evil.com", host: "a.com" })),
    ).toBe(false);
  });
});

it("limite de 5 MB", () => {
  expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
});
