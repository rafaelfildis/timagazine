import { PGlite } from "@electric-sql/pglite";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { join } from "node:path";
import type { Db } from "./client";
import * as schema from "./schema";

/** Banco PGlite em memória, com `unaccent` e todas as migrações de `drizzle/`. */
export async function createTestDb(): Promise<{ db: Db; close(): Promise<void> }> {
  const client = new PGlite({ extensions: { unaccent } });
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
  return { db: db as unknown as Db, close: () => client.close() };
}
