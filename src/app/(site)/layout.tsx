import { SiteShell } from "@/components/site/SiteShell";

// O cabeçalho lê configurações do banco; revalida a cada 5 min.
export const revalidate = 300;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
