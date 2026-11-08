export type SiteConfig = {
  name: string;
  tagline: string;
  url: string;
  /** Sem `editor`, o rodapé omite a linha "Editor responsável". */
  editor?: string;
};

export const DEV_SITE_URL = "http://localhost:3100";

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_ENV?: string;
};

/**
 * URL canônica do site (sem barra no fim), usada em canonical, Open Graph, sitemap e RSS.
 * Ordem: NEXT_PUBLIC_SITE_URL → https://NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL (variável de
 * sistema da Vercel, domínio de produção) → localhost só fora da produção da Vercel. Na produção
 * da Vercel sem nenhuma das duas, lança: o build falha em vez de publicar links para localhost.
 */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  let url = explicit || (vercelHost ? `https://${vercelHost}` : "");
  if (!url) {
    if (env.VERCEL_ENV === "production") {
      throw new Error(
        "URL do site não definida em produção: configure NEXT_PUBLIC_SITE_URL (ex.: https://timagazine.com.br).",
      );
    }
    url = DEV_SITE_URL;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL inválida: "${url}". Use a URL completa, ex.: https://timagazine.com.br`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`NEXT_PUBLIC_SITE_URL precisa começar com https:// (recebido "${url}").`);
  }
  return url.replace(/\/+$/, "");
}

export const siteConfig: SiteConfig = {
  name: "TI MAGAZINE",
  tagline: "Tecnologia • Inovação • Negócios",
  // Referências literais a process.env.*: o Next só embute no bundle do navegador as escritas assim.
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }),
  editor: undefined,
};
