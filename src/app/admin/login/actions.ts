"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/auth/redirect";

/** `email` volta no estado: o React limpa o formulário após a action e o e-mail digitado deve permanecer. */
export type LoginState = { error: string; email: string } | null;

const INVALID_MESSAGE = "E-mail ou senha inválidos.";
const LOCKED_MESSAGE = "Muitas tentativas. Tente novamente em alguns minutos.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const target = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""));

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    // Só erros de credencial viram mensagem; configuração (AUTH_SECRET etc.) e
    // qualquer outro erro sobem, para não serem mascarados como "senha inválida".
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      const code = (error as AuthError & { code?: string }).code;
      return { error: code === "locked" ? LOCKED_MESSAGE : INVALID_MESSAGE, email };
    }
    throw error;
  }
  redirect(target);
}
