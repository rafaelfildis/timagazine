export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type SniffedImage = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; ext: "jpg" | "png" | "webp" | "avif" };

const ascii = (b: Uint8Array, from: number, to: number) =>
  String.fromCharCode(...b.subarray(from, to));

/** Tipo real da imagem pela assinatura (magic bytes); null se não for jpeg, png, webp ou avif. */
export function sniffImage(b: Uint8Array): SniffedImage | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    b.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  // AVIF: caixa ISO "ftyp" na posição 4 com a marca "avif"/"avis" (principal ou compatível).
  if (b.length >= 16 && ascii(b, 4, 8) === "ftyp") {
    const boxEnd = Math.min(b.length, new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(0), 64);
    for (let i = 8; i + 4 <= boxEnd; i += 4) {
      const brand = ascii(b, i, i + 4);
      if (brand === "avif" || brand === "avis") return { mime: "image/avif", ext: "avif" };
    }
  }
  return null;
}

/**
 * Route handlers não passam pela checagem de origem das server actions.
 * Aceita só quando o navegador diz same-origin E o Origin (se vier) aponta para este host.
 * Sem Sec-Fetch-Site (cliente antigo), exige Origin igual ao Host.
 */
export function isSameOriginRequest(headers: Headers): boolean {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const origin = headers.get("origin");
  const site = headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return false;
  if (origin !== null) {
    try {
      return !!host && new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return site === "same-origin";
}

/**
 * Gravar e servir imagens em public/uploads (sem Vercel Blob) só com ALLOW_LOCAL_UPLOADS=1:
 * desenvolvimento e e2e. Não depende de NODE_ENV (o e2e roda `next start`, que é produção);
 * na Vercel o disco é somente leitura, então sem Blob o envio responde 503.
 */
export function localUploadsAllowed(value: string | undefined = process.env.ALLOW_LOCAL_UPLOADS): boolean {
  return value === "1";
}
