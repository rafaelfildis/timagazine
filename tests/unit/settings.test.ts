// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/lib/db/test-db";
import { settings } from "@/lib/db/schema";
import { DatabaseConfigError, type Db } from "@/lib/db/client";
import { getSetting, readSetting } from "@/lib/settings";

afterEach(() => vi.restoreAllMocks());

describe("readSetting", () => {
  it("devolve o valor, ou null quando vazio", async () => {
    const { db, close } = await createTestDb();
    // A chave já vem vazia da migração 0002_bootstrap_data.
    expect(await readSetting(db, "whatsapp_channel_url")).toBeNull();
    await db.update(settings).set({ value: " https://wa.me/x " }).where(eq(settings.key, "whatsapp_channel_url"));
    expect(await readSetting(db, "whatsapp_channel_url")).toBe("https://wa.me/x");
    await close();
  });

  it("devolve null e registra o erro quando o banco falha", async () => {
    const { db, close } = await createTestDb();
    await close(); // banco fechado: a consulta lança
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await readSetting(db, "whatsapp_channel_url")).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("DATABASE_URL ausente é erro de configuração: continua lançando (readSetting e getSetting)", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const faltando = new Proxy({} as Db, {
        get() {
          throw new DatabaseConfigError();
        },
      });
      await expect(readSetting(faltando, "whatsapp_channel_url")).rejects.toBeInstanceOf(DatabaseConfigError);
      await expect(getSetting("whatsapp_channel_url")).rejects.toBeInstanceOf(DatabaseConfigError);
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });
});
