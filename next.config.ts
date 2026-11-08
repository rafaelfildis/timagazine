import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as rotas. De propósito NÃO há CSP completa (script-src
 * etc.): os scripts inline do Next quebrariam sem nonce. Só `frame-ancestors`, que impede o
 * site (e o painel) de ser embutido em iframe de terceiros (clickjacking).
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Habilita forbidden() (403) para papel insuficiente no painel.
  experimental: { authInterrupts: true },
  // Imagens enviadas pelo painel em produção ficam no Vercel Blob (público).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  // PGlite carrega wasm/extensões via import.meta.url; o bundler não consegue empacotá-lo.
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
