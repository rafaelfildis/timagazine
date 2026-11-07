import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { requireRole, signOut } from "@/lib/auth";

const MENU = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/materias", label: "Matérias" },
  { href: "/admin/destaques", label: "Destaques da Home" },
  { href: "/admin/paginas", label: "Páginas" },
  { href: "/admin/mensagens", label: "Mensagens" },
  { href: "/admin/configuracoes", label: "Configurações" },
] as const;

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("editor");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b border-border bg-surface md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 p-4 md:block">
          <Logo variant="symbol" />
          <p className="text-sm text-muted md:mt-4">
            <span className="block font-medium text-text">{user.name}</span>
            {user.role === "admin" ? "Administrador" : "Editor"}
          </p>
        </div>
        <nav aria-label="Painel" className="px-2 pb-3 md:pb-0">
          <ul className="flex flex-wrap gap-1 md:block md:space-y-1">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={logout} className="p-2 md:mt-4">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center rounded-md px-3 text-sm text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
