import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    optimizeDeps: {
      exclude: [
        "solid-transition-group",
        "@solid-primitives/transition-group",
        "@solid-primitives/refs",
      ],
    },
  },
});
