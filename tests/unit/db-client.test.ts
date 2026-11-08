// @vitest-environment node
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

const { pools } = vi.hoisted(() => ({ pools: [] as EventEmitter[] }));
vi.mock("@neondatabase/serverless", async () => {
  const { EventEmitter: Emitter } = await import("node:events");
  class Pool extends Emitter {
    constructor() {
      super();
      pools.push(this);
    }
  }
  return { Pool };
});

import { createDb } from "@/lib/db/client";

describe("createDb (Neon)", () => {
  it("o pool tem ouvinte de 'error': falha numa conexão ociosa não derruba o processo", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    createDb("postgresql://u:p@ep-x.sa-east-1.aws.neon.tech/neondb");
    const pool = pools.at(-1)!;
    expect(pool.listenerCount("error")).toBe(1);
    // Sem ouvinte, emit("error") lançaria.
    expect(() => pool.emit("error", new Error("Connection terminated unexpectedly"))).not.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[db]"), "Connection terminated unexpectedly");
    spy.mockRestore();
  });
});
