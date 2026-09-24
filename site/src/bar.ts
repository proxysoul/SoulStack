import { WORLDS } from "./content";
import { icon } from "./icons";

export const LOGO_FILE: Record<string, string> = {
  empryo: "logo-mark.webp",
  soul: "logo-proxysoul.webp",
  coffee: "logo-coffee.webp",
  water: "logo-water.webp",
  crimson: "logo-crimson.webp",
  undertow: "logo-undertow.webp",
};

export type Page = "home" | "docs";

const NAV: { href: string; label: string; page?: Page }[] = [
  { href: "/#stack", label: "Stack" },
  { href: "/#agents", label: "Agents" },
  { href: "/#empryo", label: "Empryo" },
  { href: "/#immune", label: "Immune" },
  { href: "/#design", label: "Design" },
  { href: "/#update", label: "Update" },
  { href: "/docs", label: "Docs", page: "docs" },
];

export function barHtml(page: Page): string {
  const nav = NAV.map((n) => `<a href="${n.href}"${n.page === page ? ' aria-current="page"' : ""}>${n.label}</a>`).join("");
  const worlds = WORLDS.map(
    (w) => `<button class="world" data-world-pick="${w.id}" role="radio" aria-label="${w.name}" title="${w.name} · ${w.habitat}" style="--sw-a:${w.dark.pigment};--sw-b:${w.dark.paper}"></button>`,
  ).join("");
  return `<a class="bar-brand" href="/" aria-label="SoulStack home">
      <img class="bar-logo" data-logo src="/brand/logo-undertow.webp" alt="" width="28" height="28" />
      <span class="bar-name">SoulStack</span>
    </a>
    <nav class="bar-nav" aria-label="Sections">${nav}</nav>
    <div class="bar-tools">
      <div class="worlds" role="radiogroup" aria-label="World">${worlds}</div>
      <button class="icon-btn" data-mode-toggle aria-label="Switch light or dark" title="Light or dark">
        <span class="ic only-dark">${icon("sun")}</span><span class="ic only-light">${icon("moon")}</span>
      </button>
      <a class="icon-btn" href="https://github.com/proxysoul/SoulStack" aria-label="SoulStack on GitHub" title="GitHub"><span class="ic">${icon("github")}</span></a>
    </div>`;
}
