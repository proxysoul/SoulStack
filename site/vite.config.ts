import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { LOGO_FILE, barHtml } from "./src/bar";

const EMPTY_BAR = `<header class="bar" data-bar></header>`;

const staticBar = (): Plugin => ({
  name: "static-bar",
  transformIndexHtml(html, ctx) {
    const page = ctx.path.includes("docs") ? "docs" : "home";
    const pickLogo = `<script>(()=>{const m=${JSON.stringify(LOGO_FILE)};const f=m[document.documentElement.dataset.world]||m.undertow;for(const i of document.querySelectorAll("[data-bar] [data-logo]"))i.src="/brand/"+f;})()</script>`;
    return html.replace(EMPTY_BAR, `<header class="bar" data-bar>${barHtml(page)}</header>${pickLogo}`);
  },
});

const immunityIndex = (): Plugin => ({
  name: "immunity-index",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === "/docs" || req.url?.startsWith("/docs?")) req.url = req.url.replace("/docs", "/docs.html");
      if (req.url === "/immunity" || req.url === "/immunity/" || req.url?.startsWith("/immunity/?")) {
        req.url = "/immunity/index.html";
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === "/docs" || req.url?.startsWith("/docs?")) req.url = req.url.replace("/docs", "/docs.html");
      if (req.url === "/immunity" || req.url === "/immunity/") req.url = "/immunity/index.html";
      next();
    });
  },
});

export default defineConfig({
  plugins: [staticBar(), immunityIndex()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        docs: resolve(import.meta.dirname, "docs.html"),
      },
    },
  },
});
