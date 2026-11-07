"use server";

import { headers } from "next/headers";
import { handleContact, type ContactResult } from "@/lib/contact";
import { db } from "@/lib/db/client";

export type ContactState = ContactResult & { values?: Record<string, string> };

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

export async function submitContact(
  _prev: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const input = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const result = await handleContact(db, input, await clientIp());
  if (result.ok) return result;
  // Devolve o que a pessoa digitou para o formulário não esvaziar após o erro.
  return {
    ...result,
    values: {
      name: input.name ?? "",
      email: input.email ?? "",
      subject: input.subject ?? "",
      message: input.message ?? "",
      consent: input.consent ?? "",
    },
  };
}
