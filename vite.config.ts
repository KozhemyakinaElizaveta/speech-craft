import { defineConfig } from "vite";
import { resolve } from 'path';

export default defineConfig({
  base: '/speech-craft/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
});