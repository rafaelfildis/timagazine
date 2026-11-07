export type SiteConfig = {
  name: string;
  tagline: string;
  url: string;
  /** Sem `editor`, o rodapé omite a linha "Editor responsável". */
  editor?: string;
};

export const siteConfig: SiteConfig = {
  name: "TI MAGAZINE",
  tagline: "Tecnologia • Inovação • Negócios",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100",
  editor: undefined,
};
