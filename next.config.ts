import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
