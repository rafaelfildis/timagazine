import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, isSameOriginRequest, sniffImage } from "@/lib/upload";

export const dynamic = "force-dynamic";

const json = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Margem para os cabeçalhos multipart além do arquivo.
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

/**
 * Envio de imagem do painel. Route handlers não têm a checagem de origem das server
 * actions: confere same-origin aqui e exige papel `editor`. O tipo é decidido pelos
 * bytes do arquivo (não pelo que o navegador declara) e o nome é sempre aleatório.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request.headers)) {
    return json({ error: "Origem não permitida." }, 403);
  }
  // Sem sessão: redireciona ao login; papel insuficiente: 403.
  await requireRole("editor");

  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return json({ error: "Envie o arquivo de imagem." }, 411);
  if (length > MAX_BODY_BYTES) return json({ error: "A imagem passa de 5 MB." }, 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return json({ error: "Envio inválido." }, 400);
  }
  if (!(file instanceof File) || file.size === 0) return json({ error: "Envie o arquivo de imagem." }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "A imagem passa de 5 MB." }, 413);

  const data = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(data);
  if (!kind || file.type !== kind.mime) {
    return json({ error: "Use uma imagem JPEG, PNG, WebP ou AVIF." }, 415);
  }
  const name = `${randomUUID()}.${kind.ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, Buffer.from(data), {
      access: "public",
      contentType: kind.mime,
      addRandomSuffix: false,
    });
    return json({ url: blob.url }, 200);
  }

  // Sem Vercel Blob (desenvolvimento e e2e): grava em public/uploads, ignorado pelo git.
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), data);
  return json({ url: `/uploads/${name}` }, 200);
}
