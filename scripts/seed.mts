import { createDb } from "../src/lib/db/client";
import { seed } from "../src/lib/db/seed";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida.");
const count = Number(process.argv[2] ?? 14);
await seed(createDb(url), { posts: count });
console.log(`Seed aplicado (${count} posts).`);
process.exit(0);
