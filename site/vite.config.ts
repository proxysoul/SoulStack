import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const immunityIndex = (): Plugin => {
  const rewrite = (url: string | undefined) =>
    url === "/immunity" || url === "/immunity/" || url?.startsWith("/immunity/?") ? "/immunity/index.html" : url;
  return {
    name: "immunity-index",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = rewrite(req.url);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = rewrite(req.url);
        next();
      });
    },
  };
};

export default defineConfig({
  plugins: [immunityIndex(), react()],
  build: { sourcemap: false },
});
