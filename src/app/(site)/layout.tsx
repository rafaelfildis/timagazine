import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

// O cabeçalho lê configurações do banco; revalida a cada 5 min.
export const revalidate = 300;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
