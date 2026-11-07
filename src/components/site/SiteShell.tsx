import { Footer } from "./Footer";
import { Header } from "./Header";

/** Cabeçalho, conteúdo e rodapé. Usado pelo layout do site e pelo 404 global. */
export function SiteShell({ children }: { children: React.ReactNode }) {
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
