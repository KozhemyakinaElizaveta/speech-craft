import { defineConfig } from "vite";

export default defineConfig({
  base: "/speech-craft/",
  assetsInclude: ['**/*.css', '**/*.woff2'], 
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    emptyOutDir: true,
  },
  server: {
    open: true,
    port: 8080,
  },
});