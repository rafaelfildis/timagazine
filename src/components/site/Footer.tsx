import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
  { label: "Política Editorial e de Correções", href: "/politica-editorial" },
  { label: "Política de Privacidade", href: "/politica-de-privacidade" },
  { label: "Termos de Uso", href: "/termos-de-uso" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-deep/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:flex-row lg:justify-between lg:px-6">
        <div className="flex flex-col items-start gap-3">
          <Logo />
          <p className="text-sm text-muted">{siteConfig.tagline}</p>
          {siteConfig.editor && (
            <p className="text-sm text-muted">Editor responsável: {siteConfig.editor}</p>
          )}
        </div>
        <nav aria-label="Rodapé">
          <ul className="grid gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-8 items-center text-sm text-text hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.
      </p>
    </footer>
  );
}
