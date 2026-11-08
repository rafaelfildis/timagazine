// Dados de EXEMPLO para desenvolvimento: npm run db:seed -- --posts 14
// Exige o banco migrado (categorias, páginas e configurações vêm das migrações).
// Recusa banco que não seja PGlite local, a não ser com --force.
import { createDb } from "../src/lib/db/client";
import { seed } from "../src/lib/db/seed";
import { describeDatabaseUrl, loadEnvFiles, parseSeedArgs } from "./lib/env";

loadEnvFiles();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}
const args = parseSeedArgs(process.argv.slice(2), url);
if (!args.ok) {
  console.error(args.error);
  process.exit(1);
}
console.log(`Banco de destino: ${describeDatabaseUrl(url)}`);
await seed(createDb(url), { posts: args.posts });
console.log(`Seed aplicado (${args.posts} posts).`);
process.exit(0);
