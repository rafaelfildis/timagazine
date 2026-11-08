// Cria (ou redefine a senha de) um usuário admin.
//   npm run create-admin -- --email pessoa@exemplo.com --name "Nome Sobrenome" [--reset-password]
// A senha é pedida duas vezes no terminal, sem eco, e nunca é impressa.
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { createDb } from "../src/lib/db/client";
import { users } from "../src/lib/db/schema";
import {
  MIN_PASSWORD_LENGTH,
  createUser,
  hashPassword,
  normalizeEmail,
} from "../src/lib/auth/core";
import { describeDatabaseUrl, loadEnvFiles } from "./lib/env";

// .env.local vence .env (mesma ordem do Next.js); o ambiente do processo vence os dois.
loadEnvFiles();

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

let pipedInput = "";

/** Lê uma linha sem ecoar os caracteres (terminal interativo); com stdin redirecionado, lê a linha. */
function readHidden(prompt: string): Promise<string> {
  const stdin = process.stdin;
  process.stdout.write(prompt);
  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      const take = () => {
        const nl = pipedInput.indexOf("\n");
        if (nl === -1) return false;
        resolve(pipedInput.slice(0, nl).replace(/\r$/, ""));
        pipedInput = pipedInput.slice(nl + 1);
        return true;
      };
      if (take()) return;
      const onData = (chunk: Buffer) => {
        pipedInput += chunk.toString("utf8");
        if (take()) {
          stdin.off("data", onData);
          stdin.pause();
        }
      };
      stdin.on("data", onData);
      stdin.resume();
    });
  }
  return new Promise((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    "reset-password": { type: "boolean", default: false },
  },
});

const email = normalizeEmail(values.email ?? "");
const name = (values.name ?? "").trim();
if (!email || !email.includes("@")) fail("Informe --email com um e-mail válido.");
if (!values["reset-password"] && !name) fail("Informe --name.");

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL não definida.");
// Antes de pedir a senha: quem roda confere em qual banco o admin será criado.
console.log(`Banco de destino: ${describeDatabaseUrl(url)}`);
const db = createDb(url);

const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
if (existing && !values["reset-password"]) {
  fail(`Já existe um usuário com o e-mail ${email}. Use --reset-password para trocar a senha.`);
}
if (!existing && values["reset-password"]) {
  fail(`Nenhum usuário com o e-mail ${email} para redefinir a senha.`);
}

const password = await readHidden("Senha: ");
if (password.length < MIN_PASSWORD_LENGTH) {
  fail(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
}
const confirm = await readHidden("Repita a senha: ");
if (password !== confirm) fail("As senhas não conferem.");

if (existing) {
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, existing.id));
  console.log(`Senha de ${email} redefinida.`);
} else {
  await createUser(db, { email, name, password, role: "admin" });
  console.log(`Admin ${email} criado.`);
}
process.exit(0);
