import { join } from "node:path";
import { Pool } from "@neondatabase/serverless";
import { createPglite } from "../src/lib/db/client";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida.");
const migrationsFolder = join(process.cwd(), "drizzle");

if (url.startsWith("pglite:")) {
  const client = createPglite(url.slice("pglite:".length));
  await migratePglite(drizzlePglite({ client }), { migrationsFolder });
  await client.close();
} else {
  const pool = new Pool({ connectionString: url });
  await migrateNeon(drizzleNeon({ client: pool }), { migrationsFolder });
  await pool.end();
}
console.log("Migrações aplicadas.");
