// Prepara o banco do e2e: apaga .data/e2e, migra e semeia (14 posts + rascunho/agendada).
// Roda ANTES de `next build`/`next start` (ver webServer em playwright.config.ts),
// porque o webServer do Playwright sobe antes do globalSetup.
import { rmSync } from "node:fs";
import { join } from "node:path";
import { createDb, createPglite } from "../src/lib/db/client";
import { seed, seedDraftAndScheduled } from "../src/lib/db/seed";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const dir = ".data/e2e";
rmSync(dir, { recursive: true, force: true });
const client = createPglite(dir);
await migrate(drizzle({ client }), { migrationsFolder: join(process.cwd(), "drizzle") });
await client.close();

const db = createDb(`pglite:${dir}`);
await seed(db, { posts: 14 });
await seedDraftAndScheduled(db);
console.log("Banco do e2e pronto em .data/e2e");
process.exit(0);
