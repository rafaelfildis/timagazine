// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import type { Db } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";
import { handleContact, hashIp } from "@/lib/contact";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});
afterAll(() => close());
beforeEach(async () => {
  await db.delete(contactMessages);
});

const valid = {
  name: "Maria Souza",
  email: "maria@example.com",
  subject: "pauta",
  message: "Sugestão de pauta sobre governança de TI.",
  consent: "on",
  website: "",
};
const count = async () => (await db.select().from(contactMessages)).length;

describe("handleContact", () => {
  it("sem consentimento: ok false com errors.consent", async () => {
    const r = await handleContact(db, { ...valid, consent: undefined }, "1.1.1.1");
    expect(r.ok).toBe(false);
    expect(r.errors?.consent).toBeTruthy();
    expect(await count()).toBe(0);
  });

  it("e-mail inválido: errors.email", async () => {
    const r = await handleContact(db, { ...valid, email: "nao-e-email" }, "1.1.1.1");
    expect(r.ok).toBe(false);
    expect(r.errors?.email).toBeTruthy();
  });

  it("valida nome, assunto e tamanho da mensagem", async () => {
    const r = await handleContact(db, { ...valid, name: "A", subject: "x", message: "curta" }, "1.1.1.1");
    expect(r.errors).toMatchObject({
      name: expect.any(String),
      subject: expect.any(String),
      message: expect.any(String),
    });
  });

  it("honeypot preenchido: ok true e nada gravado", async () => {
    const r = await handleContact(db, { ...valid, website: "http://spam.example" }, "1.1.1.1");
    expect(r.ok).toBe(true);
    expect(await count()).toBe(0);
  });

  it("envio válido grava 1 linha com consentAt e ipHash (nunca o IP)", async () => {
    const r = await handleContact(db, valid, "9.9.9.9");
    expect(r).toEqual({ ok: true });
    const rows = await db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0].consentAt).toBeInstanceOf(Date);
    expect(rows[0].subject).toBe("pauta");
    expect(rows[0].ipHash).toBe(hashIp("9.9.9.9"));
    expect(rows[0].ipHash).not.toContain("9.9.9.9");
    expect(hashIp("9.9.9.9")).toBe(
      createHash("sha256").update("9.9.9.9" + (process.env.AUTH_SECRET ?? "dev-secret")).digest("hex"),
    );
  });

  it("o 6º envio do mesmo IP na hora é recusado; outro IP passa", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await handleContact(db, valid, "2.2.2.2")).ok).toBe(true);
    }
    const sexto = await handleContact(db, valid, "2.2.2.2");
    expect(sexto.ok).toBe(false);
    expect(sexto.errors?.form).toMatch(/muitas mensagens/i);
    expect(await count()).toBe(5);
    expect((await handleContact(db, valid, "3.3.3.3")).ok).toBe(true);
  });
});
