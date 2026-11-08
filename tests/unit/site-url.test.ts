import { describe, expect, it } from "vitest";
import { DEV_SITE_URL, resolveSiteUrl } from "@/config/site";

describe("resolveSiteUrl", () => {
  it("NEXT_PUBLIC_SITE_URL tem prioridade e perde a barra final", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://timagazine.com.br/",
        NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "timagazine.vercel.app",
        VERCEL_ENV: "production",
      }),
    ).toBe("https://timagazine.com.br");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: " https://a.com.br// " })).toBe("https://a.com.br");
  });

  it("sem ela usa o domínio de produção da Vercel (https)", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "timagazine.vercel.app", VERCEL_ENV: "production" }),
    ).toBe("https://timagazine.vercel.app");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "", NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe(
      "https://x.vercel.app",
    );
  });

  it("fora da produção da Vercel, sem nada, cai para localhost", () => {
    expect(resolveSiteUrl({})).toBe(DEV_SITE_URL);
    expect(resolveSiteUrl({ VERCEL_ENV: "preview" })).toBe(DEV_SITE_URL);
    expect(resolveSiteUrl({ VERCEL_ENV: "development" })).toBe(DEV_SITE_URL);
  });

  it("na produção da Vercel, sem nenhuma URL, lança (o build falha)", () => {
    expect(() => resolveSiteUrl({ VERCEL_ENV: "production" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveSiteUrl({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "  " })).toThrow();
  });

  it("recusa valor que não é URL http(s)", () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "timagazine.com.br" })).toThrow(/inválida/);
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "ftp://timagazine.com.br" })).toThrow(/https/);
  });
});
