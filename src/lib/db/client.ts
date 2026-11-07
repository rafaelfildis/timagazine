import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { Pool } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";

/** Tipo comum aos dois drivers (Neon em produção, PGlite em dev/testes). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const PGLITE_PREFIX = "pglite:";

/** PGlite em arquivo (cria a pasta pai, que o PGlite não cria). */
export function createPglite(dataDir: string) {
  mkdirSync(dataDir, { recursive: true });
  return new PGlite({ dataDir, extensions: { unaccent } });
}

/** `pglite:./.data/dev` usa PGlite em arquivo; qualquer outra URL usa Neon. */
export function createDb(url: string): Db {
  if (url.startsWith(PGLITE_PREFIX)) {
    const client = createPglite(url.slice(PGLITE_PREFIX.length));
    return drizzlePglite({ client, schema }) as unknown as Db;
  }
  return drizzleNeon({ client: new Pool({ connectionString: url }), schema }) as unknown as Db;
}

let instance: Db | undefined;

function getDb(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL não definida. Use pglite:./.data/dev em desenvolvimento ou a URL do Neon.",
      );
    }
    instance = createDb(url);
  }
  return instance;
}

/**
 * Fachada preguiçosa: nada conecta (nem exige DATABASE_URL) ao importar.
 * A conexão nasce no primeiro acesso, então `next build` sem env continua passando.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
