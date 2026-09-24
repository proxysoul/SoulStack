import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const immunityIndex = (): Plugin => ({
  name: "immunity-index",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === "/immunity" || req.url === "/immunity/" || req.url?.startsWith("/immunity/?")) {
        req.url = "/immunity/index.html";
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === "/immunity" || req.url === "/immunity/") req.url = "/immunity/index.html";
      next();
    });
  },
});

export default defineConfig({
  plugins: [immunityIndex()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        docs: resolve(import.meta.dirname, "docs.html"),
      },
    },
  },
});
