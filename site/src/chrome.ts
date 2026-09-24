import { WORLDS, type World } from "./content";
import { LOGO_FILE, barHtml, type Page } from "./bar";

export const root = document.documentElement;
const STORE = "soulstack-world";

export const LOGO = Object.fromEntries(Object.entries(LOGO_FILE).map(([k, f]) => [k, `/brand/${f}`])) as Record<World["id"], string>;

export function currentWorld(): World["id"] {
  const id = root.dataset.world;
  return WORLDS.find((w) => w.id === id)?.id ?? "undertow";
}

export function currentMode(): "dark" | "light" {
  return root.dataset.theme === "light" ? "light" : "dark";
}

export function moteSrc(mode: "dark" | "light"): string {
  return mode === "light" ? "/mote-light.gif" : "/mote-dark.gif";
}

const painters: (() => void)[] = [];

export function onPaint(fn: () => void): void {
  painters.push(fn);
}

export function paint(): void {
  const world = currentWorld();
  const mode = currentMode();
  for (const img of document.querySelectorAll<HTMLImageElement>("[data-logo]")) img.src = LOGO[world];
  document.querySelector<HTMLLinkElement>("link[rel=icon]")?.setAttribute("href", LOGO[world]);
  for (const mote of document.querySelectorAll<HTMLImageElement>("[data-mote]")) mote.src = moteSrc(mode);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-world-pick]")) {
    b.setAttribute("aria-checked", String(b.dataset.worldPick === world));
  }
  for (const fn of painters) fn();
  localStorage.setItem(STORE, JSON.stringify({ world, mode }));
}

export function bloom(x: number, y: number, apply: () => void): void {
  const run = () => {
    apply();
    paint();
  };
  if (root.dataset.motion === "still" || !document.startViewTransition) {
    run();
    return;
  }
  root.classList.add("is-blooming");
  root.style.setProperty("--bloom-x", `${x}px`);
  root.style.setProperty("--bloom-y", `${y}px`);
  document.startViewTransition(run).finished.finally(() => root.classList.remove("is-blooming"));
}

export function mountBar(page: Page): void {
  const bar = document.querySelector<HTMLElement>("[data-bar]");
  if (!bar) return;
  if (!bar.firstElementChild) bar.innerHTML = barHtml(page);
  for (const b of bar.querySelectorAll<HTMLButtonElement>("[data-world-pick]")) {
    b.addEventListener("click", (e) => bloom(e.clientX, e.clientY, () => {
      root.dataset.world = b.dataset.worldPick;
    }));
  }
  bar.querySelector("[data-mode-toggle]")?.addEventListener("click", (e) => {
    const ev = e as MouseEvent;
    bloom(ev.clientX, ev.clientY, () => {
      root.dataset.theme = currentMode() === "dark" ? "light" : "dark";
    });
  });
  paint();
}
