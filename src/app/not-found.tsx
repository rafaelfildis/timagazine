import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/NotFoundContent";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

// 404 global (rotas desconhecidas e notFound() das matérias): o layout do site não envolve
// esta página, então ela monta o próprio cabeçalho e rodapé.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
