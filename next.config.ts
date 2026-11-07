import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilita forbidden() (403) para papel insuficiente no painel.
  experimental: { authInterrupts: true },
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
