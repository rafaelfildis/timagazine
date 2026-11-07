import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

export type SettingKey = "whatsapp_channel_url";

/** Lê uma configuração; vazio ou ausente vira `null`. */
export async function getSetting(key: SettingKey): Promise<string | null> {
  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  const value = rows[0]?.value?.trim();
  return value ? value : null;
}
