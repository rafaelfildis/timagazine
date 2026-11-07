import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Acesso negado", robots: { index: false } };

export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Acesso negado</h1>
      <p className="text-muted">Seu perfil não tem permissão para acessar esta área.</p>
      <Link href="/admin" className="text-primary underline">
        Voltar ao painel
      </Link>
    </main>
  );
}
