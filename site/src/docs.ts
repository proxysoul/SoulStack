import "./living.css";
import "./worlds.css";
import "./site.css";
import "./docs.css";
import { marked } from "marked";
import { icon } from "./icons";
import { mountBar } from "./chrome";

interface NavEntry {
  slug: string;
  title: string;
  summary: string;
  group: string;
}

const params = new URLSearchParams(location.search);
const slug = (params.get("p") ?? "getting-started").replace(/[^a-z0-9/-]/g, "");

function toDocsHref(href: string, from: string): string {
  if (/^[a-z]+:/i.test(href) || href.startsWith("#") || !href.includes(".md")) return href;
  const [path, hash] = href.split("#");
  const base = from.includes("/") ? from.slice(0, from.lastIndexOf("/") + 1) : "";
  const parts = `${base}${path}`.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") stack.pop();
    else if (part && part !== ".") stack.push(part);
  }
  const target = stack.join("/").replace(/\.md$/, "");
  return `/docs?p=${target}${hash ? `#${hash}` : ""}`;
}

async function load(): Promise<void> {
  mountBar("docs");
  for (const el of document.querySelectorAll<HTMLElement>("[data-icon]")) {
    el.innerHTML = icon(el.dataset.icon ?? "");
    el.classList.add("ic");
  }

  const nav = document.querySelector<HTMLElement>("[data-docs-nav]");
  const body = document.querySelector<HTMLElement>("[data-docs-body]");
  const mdLink = document.querySelector<HTMLAnchorElement>("[data-md-link]");
  if (!nav || !body || !mdLink) return;

  const entries: NavEntry[] = await (await fetch("/docs/index.json")).json();
  const groups = [...new Set(entries.map((e) => e.group))];
  nav.innerHTML = groups
    .map(
      (g) => `<p class="docs-group">${g}</p><ul>${entries
        .filter((e) => e.group === g)
        .map(
          (e) =>
            `<li><a href="/docs?p=${e.slug}"${e.slug === slug ? ' aria-current="page"' : ""}>${e.title.replace(/^Skill: /, "")}</a></li>`,
        )
        .join("")}</ul>`,
    )
    .join("");

  const entry = entries.find((e) => e.slug === slug);
  const res = await fetch(`/docs/${slug}.md`);
  if (!entry || !res.ok) {
    body.innerHTML = `<h1>Page not found</h1><p>There is no page called <code>${slug}</code>. Pick one from the list.</p>`;
    return;
  }
  const md = await res.text();
  mdLink.href = `/docs/${slug}.md`;
  document.title = `${entry.title} · SoulStack docs`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", entry.summary);
  const alt = document.createElement("link");
  alt.rel = "alternate";
  alt.type = "text/markdown";
  alt.href = `/docs/${slug}.md`;
  document.head.append(alt);

  body.innerHTML = await marked.parse(md);
  for (const a of body.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    a.setAttribute("href", toDocsHref(href, slug));
    if (/^https?:/.test(href)) a.rel = "noopener";
  }
  for (const pre of body.querySelectorAll<HTMLPreElement>("pre")) {
    const btn = document.createElement("button");
    btn.className = "copy docs-copy";
    btn.setAttribute("aria-label", "Copy");
    btn.innerHTML = icon("copy");
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(pre.textContent ?? "");
      btn.innerHTML = icon("check");
      btn.classList.add("is-done");
    });
    pre.append(btn);
  }
}

void load();
