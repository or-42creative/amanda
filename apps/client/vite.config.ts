import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow importing the shared card JSON that lives at the repo root /data.
    fs: { allow: [repoRoot] },
  },
  // The workspace packages ship as TypeScript source; let Vite transform them
  // through its normal pipeline instead of pre-bundling.
  optimizeDeps: {
    exclude: ["@amanda/shared", "@amanda/engine"],
  },
});
