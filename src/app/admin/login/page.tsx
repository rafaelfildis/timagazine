import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getSessionUser } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/auth/redirect";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl);
  if (await getSessionUser()) redirect(target);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 sm:p-8">
        <Logo className="mb-6" />
        <h1 className="font-display text-2xl font-bold">Entrar no painel</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Acesso restrito à equipe editorial.</p>
        <LoginForm callbackUrl={target} />
      </div>
    </main>
  );
}
