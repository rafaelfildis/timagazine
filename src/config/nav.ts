export type NavItem = { label: string; href: string; enabled: boolean };

/** Itens de planos futuros ficam `enabled: false` (ocultos) até irem ao ar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/", enabled: true },
  { label: "Notícias", href: "/noticias", enabled: true },
  { label: "Empresas", href: "/empresas", enabled: false },
  { label: "Relatórios", href: "/relatorio", enabled: false },
  { label: "Eventos", href: "/eventos", enabled: false },
  { label: "Academia", href: "/academia", enabled: false },
  { label: "Sobre", href: "/sobre", enabled: true },
  { label: "Contato", href: "/contato", enabled: true },
];

/** Botão "Entrar" fica oculto até o Plano 4 (contas de leitor). */
export const ACCOUNT_ENABLED = false;

export function visibleNav(): NavItem[] {
  return NAV_ITEMS.filter((i) => i.enabled);
}

export function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
