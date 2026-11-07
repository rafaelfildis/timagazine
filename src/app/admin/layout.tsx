import type { Metadata } from "next";

// Painel sem cabeçalho/rodapé do site; nunca indexado.
export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel TI MAGAZINE" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-bg text-text">{children}</div>;
}
