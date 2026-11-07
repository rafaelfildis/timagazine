import { BarChart3, Building2, CalendarDays, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { NAV_ITEMS } from "@/config/nav";

type Quick = { label: string; hint: string; href: string; icon: LucideIcon };

const QUICK_LINKS: readonly Quick[] = [
  { label: "Notícias diárias", hint: "As últimas matérias de TI", href: "/noticias", icon: Zap },
  { label: "Relatório Oficial de TI", hint: "Panorama e rankings", href: "/relatorio", icon: BarChart3 },
  { label: "Mural de Empresas", hint: "Soluções para o mercado", href: "/empresas", icon: Building2 },
  { label: "Eventos e CIO Talks", hint: "Conexão e networking", href: "/eventos", icon: CalendarDays },
];

/** Atalhos de planos futuros só aparecem quando o item do menu correspondente estiver ativo. */
export function visibleQuickLinks(): Quick[] {
  const enabled = new Set(NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href));
  return QUICK_LINKS.filter((q) => enabled.has(q.href));
}

export function QuickLinks() {
  const items = visibleQuickLinks();
  return (
    <nav aria-label="Atalhos" className="mx-auto w-full max-w-7xl px-4 pt-6 lg:px-6">
      <ul className="grid divide-border rounded-xl border border-border bg-surface sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
        {items.map(({ label, hint, href, icon: Icon }) => (
          <li key={href} className="min-w-0">
            <Link
              href={href}
              className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <Icon aria-hidden="true" className="size-6 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
