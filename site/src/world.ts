import { useSyncExternalStore } from "react";
import { WORLDS, type World } from "./content";

export type WorldId = World["id"];
export type Mode = "dark" | "light";

const STORE = "soulstack-world";

export const LOGO: Record<WorldId, string> = {
  empryo: "/brand/logo-mark.webp",
  soul: "/brand/logo-proxysoul.webp",
  coffee: "/brand/logo-coffee.webp",
  water: "/brand/logo-water.webp",
  crimson: "/brand/logo-crimson.webp",
  undertow: "/brand/logo-undertow.webp",
};

const root = () => document.documentElement;

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(root(), { attributes: true, attributeFilter: ["data-world", "data-theme", "data-motion"] });
  return () => observer.disconnect();
}

function snapshot(): string {
  const r = root();
  return `${r.dataset.world ?? ""}|${r.dataset.theme ?? ""}|${r.dataset.motion ?? ""}`;
}

export interface WorldState {
  world: WorldId;
  mode: Mode;
  still: boolean;
}

export function useWorld(): WorldState {
  const [world, mode, motion] = useSyncExternalStore(subscribe, snapshot).split("|");
  return {
    world: WORLDS.find((w) => w.id === world)?.id ?? "undertow",
    mode: mode === "light" ? "light" : "dark",
    still: motion === "still",
  };
}

export function persistWorld({ world, mode }: WorldState): void {
  document.querySelector<HTMLLinkElement>("link[rel=icon]")?.setAttribute("href", LOGO[world]);
  localStorage.setItem(STORE, JSON.stringify({ world, mode }));
}

function bloom(x: number, y: number, apply: () => void): void {
  const r = root();
  if (r.dataset.motion === "still" || !document.startViewTransition) {
    apply();
    return;
  }
  r.style.setProperty("--bloom-x", `${x}px`);
  r.style.setProperty("--bloom-y", `${y}px`);
  r.classList.add("is-blooming");
  document.startViewTransition(apply).finished.finally(() => r.classList.remove("is-blooming"));
}

export function pickWorld(id: WorldId, at: { clientX: number; clientY: number }): void {
  bloom(at.clientX, at.clientY, () => {
    root().dataset.world = id;
  });
}

export function toggleMode(at: { clientX: number; clientY: number }): void {
  bloom(at.clientX, at.clientY, () => {
    const r = root();
    r.dataset.theme = r.dataset.theme === "light" ? "dark" : "light";
  });
}
