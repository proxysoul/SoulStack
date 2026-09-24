import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import docs from "../src/generated/docs.json";

const ORIGIN = "https://soulstack.proxysoul.com";
const dist = join(import.meta.dir, "..", "dist");
const shell = readFileSync(join(dist, "index.html"), "utf8");

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function page(path: string, title: string, description: string, card: string): string {
  const t = escape(title);
  const d = escape(description);
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${d}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${t}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${d}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${ORIGIN}${path}"`)
    .replace(/\/og\/home\.png/g, `/og/${card}.png`);
}

function write(file: string, html: string): void {
  const out = join(dist, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

write("docs.html", page("/docs", "SoulStack docs", "Setup, updating, supported agents, the immune system, skills and immune cells. Every page is also plain Markdown.", "docs"));
for (const d of docs) write(`docs/${d.slug}.html`, page(`/docs/${d.slug}`, `${d.title} · SoulStack docs`, d.summary, "docs"));
console.log(`finalize: ${docs.length + 1} pages with their own title and card`);
