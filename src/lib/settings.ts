import { cache } from "react";
import { eq } from "drizzle-orm";
import { DatabaseConfigError, db as globalDb, type Db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

export type SettingKey = "whatsapp_channel_url";

/**
 * Lê uma configuração; vazio, ausente ou falha do banco viram `null`.
 * Uma falha do banco não pode derrubar todas as páginas (o cabeçalho lê isto).
 */
export async function readSetting(db: Db, key: SettingKey): Promise<string | null> {
  try {
    const rows = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    const value = rows[0]?.value?.trim();
    return value ? value : null;
  } catch (error) {
    if (error instanceof DatabaseConfigError) throw error; // configuração errada continua alta
    console.error(`[settings] falha ao ler "${key}"; usando valor vazio.`, error);
    return null;
  }
}

/** Uma consulta por renderização (cabeçalho desktop e móvel compartilham). */
export const getSetting = cache((key: SettingKey) => readSetting(globalDb, key));
