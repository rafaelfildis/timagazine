import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
