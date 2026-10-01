import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        "owlbear-background": resolve(process.cwd(), "owlbear-background.html"),
        "owlbear-conditions": resolve(process.cwd(), "owlbear-conditions.html")
      }
    }
  },
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo"
    }
  }
});
