import { parseArgs } from "node:util";

/**
 * Carrega `.env.local` e depois `.env`, como o Next.js: o primeiro arquivo que define uma
 * variável vence, e o que já está no ambiente do processo vence os dois. Arquivo ausente é ignorado.
 */
export function loadEnvFiles(files: readonly string[] = [".env.local", ".env"]): void {
  for (const file of files) {
    try {
      process.loadEnvFile(file);
    } catch {
      // arquivo ausente: segue com o ambiente do processo
    }
  }
}

/** Destino do banco para conferência humana, SEM usuário nem senha. */
export function describeDatabaseUrl(url: string): string {
  if (url.startsWith("pglite:")) return `PGlite local (${url.slice("pglite:".length)})`;
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return "(DATABASE_URL inválida)";
  }
}

export type SeedArgs = { ok: true; posts: number } | { ok: false; error: string };

/**
 * Argumentos do `npm run db:seed`: `--posts N` é obrigatório (nada de 14 matérias falsas por
 * padrão) e um banco que não seja PGlite local exige `--force` (evita semear a produção sem querer).
 */
export function parseSeedArgs(argv: string[], databaseUrl: string): SeedArgs {
  let values: { posts?: string; force?: boolean };
  try {
    ({ values } = parseArgs({
      args: argv,
      options: { posts: { type: "string" }, force: { type: "boolean", default: false } },
    }));
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  if (values.posts === undefined || !/^\d+$/.test(values.posts)) {
    return { ok: false, error: "Informe quantas matérias de exemplo criar: npm run db:seed -- --posts 14" };
  }
  if (!databaseUrl.startsWith("pglite:") && !values.force) {
    return {
      ok: false,
      error: `DATABASE_URL aponta para ${describeDatabaseUrl(databaseUrl)}, que não é PGlite local. O seed cria dados FALSOS; se é isso mesmo, repita com --force.`,
    };
  }
  return { ok: true, posts: Number(values.posts) };
}
