"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/auth/redirect";

export type LoginState = { error: string } | null;

const INVALID_MESSAGE = "E-mail ou senha inválidos.";
const LOCKED_MESSAGE = "Muitas tentativas. Tente novamente em alguns minutos.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const target = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""));

  let resultUrl: string;
  try {
    resultUrl = String(await signIn("credentials", { email, password, redirect: false }));
  } catch {
    return { error: INVALID_MESSAGE };
  }

  const params = new URL(resultUrl, "http://localhost.invalid").searchParams;
  if (params.get("error")) {
    return { error: params.get("code") === "locked" ? LOCKED_MESSAGE : INVALID_MESSAGE };
  }
  redirect(target);
}
