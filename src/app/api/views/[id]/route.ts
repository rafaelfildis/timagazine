import { db } from "@/lib/db/client";
import { incrementViews } from "@/lib/posts/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });
  if (BOT.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  try {
    await incrementViews(db, id);
  } catch (err) {
    console.error("views: falha ao contar leitura", err);
  }
  return new Response(null, { status: 204 });
}
