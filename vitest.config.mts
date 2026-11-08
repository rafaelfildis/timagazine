import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    // Vários arquivos sobem um PGlite (wasm) ao mesmo tempo; sob carga a criação passa de 5 s.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
