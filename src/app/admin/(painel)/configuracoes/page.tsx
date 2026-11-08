import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { readSetting } from "@/lib/settings";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  await requireRole("admin");
  const whatsapp = (await readSetting(db, "whatsapp_channel_url")) ?? "";
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>
      <SettingsForm whatsapp={whatsapp} />
    </div>
  );
}
