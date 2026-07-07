import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // @amanda/shared is a workspace dependency resolved via a node_modules
    // symlink and ships as TypeScript source — inline it so Vitest transforms it.
    server: {
      deps: {
        inline: [/@amanda\/shared/],
      },
    },
  },
});
