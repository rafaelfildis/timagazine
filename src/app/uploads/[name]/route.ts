import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { localUploadsAllowed } from "@/lib/upload";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};
// Só os nomes gerados por /api/upload (uuid + extensão): nada de caminhos arbitrários.
const NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

/**
 * Serve as imagens enviadas SEM Vercel Blob (desenvolvimento e e2e), gravadas em public/uploads.
 * Só com ALLOW_LOCAL_UPLOADS=1; fora disso responde 404 (em produção as imagens ficam no Blob).
 * O `next start` só conhece os arquivos de public/ presentes na inicialização, então os
 * enviados depois precisam desta rota.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!localUploadsAllowed()) return new Response(null, { status: 404 });
  const { name } = await params;
  const match = NAME.exec(name);
  if (!match) return new Response(null, { status: 404 });
  try {
    const data = await readFile(join(process.cwd(), "public", "uploads", name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[match[1]],
        "X-Content-Type-Options": "nosniff",
        // Nome aleatório e conteúdo imutável.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
