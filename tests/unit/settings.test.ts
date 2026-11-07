// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/lib/db/test-db";
import { settings } from "@/lib/db/schema";
import { readSetting } from "@/lib/settings";

afterEach(() => vi.restoreAllMocks());

describe("readSetting", () => {
  it("devolve o valor, ou null quando vazio", async () => {
    const { db, close } = await createTestDb();
    await db.insert(settings).values({ key: "whatsapp_channel_url", value: "" });
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
});
