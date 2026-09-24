import "./living.css";
import "./worlds.css";
import "./site.css";
import { AGENTS, BEST, HOSTS, LAYERS, TAKEAWAYS, TERMINAL, WORLDS, type World } from "./content";
import { logo } from "./logos";
import { icon } from "./icons";
import { startScene } from "./scene";

const root = document.documentElement;
const STORE = "soulstack-world";

const LOGO: Record<World["id"], string> = {
  empryo: "/brand/logo-mark.webp",
  soul: "/brand/logo-proxysoul.webp",
  coffee: "/brand/logo-coffee.webp",
  water: "/brand/logo-water.webp",
  crimson: "/brand/logo-crimson.webp",
  undertow: "/brand/logo-undertow.webp",
};

function currentWorld(): World["id"] {
  const id = root.dataset.world;
  return WORLDS.find((w) => w.id === id)?.id ?? "undertow";
}

function currentMode(): "dark" | "light" {
  return root.dataset.theme === "light" ? "light" : "dark";
}

function paint(): void {
  const world = currentWorld();
  const mode = currentMode();
  for (const img of document.querySelectorAll<HTMLImageElement>("[data-logo]")) img.src = LOGO[world];
  document.querySelector<HTMLLinkElement>("link[rel=icon]")?.setAttribute("href", LOGO[world]);
  const mote = document.querySelector<HTMLImageElement>("[data-mote]");
  if (mote) mote.src = mode === "light" ? "/mote-light.gif" : "/mote-dark.gif";
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-world-pick]")) {
    b.setAttribute("aria-checked", String(b.dataset.worldPick === world));
  }
  for (const s of document.querySelectorAll<HTMLElement>("[data-swatch]")) {
    s.classList.toggle("is-on", s.dataset.swatch === world);
  }
  localStorage.setItem(STORE, JSON.stringify({ world, mode }));
}

function bloom(x: number, y: number, apply: () => void): void {
  if (root.dataset.motion === "still" || !document.startViewTransition) {
    apply();
    paint();
    return;
  }
  root.style.setProperty("--bloom-x", `${x}px`);
  root.style.setProperty("--bloom-y", `${y}px`);
  document.startViewTransition(() => {
    apply();
    paint();
  });
}

function wireWorlds(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-world-pick]")) {
    const w = WORLDS.find((x) => x.id === b.dataset.worldPick);
    if (!w) continue;
    b.style.setProperty("--sw-a", w.dark.pigment);
    b.style.setProperty("--sw-b", w.dark.paper);
    b.title = `${w.name} · ${w.habitat}`;
    b.addEventListener("click", (e) => bloom(e.clientX, e.clientY, () => {
      root.dataset.world = w.id;
    }));
  }
  document.querySelector("[data-mode-toggle]")?.addEventListener("click", (e) => {
    const ev = e as MouseEvent;
    bloom(ev.clientX, ev.clientY, () => {
      root.dataset.theme = currentMode() === "dark" ? "light" : "dark";
    });
  });
}

function wireIcons(scope: ParentNode = document): void {
  for (const el of scope.querySelectorAll<HTMLElement>("[data-icon]")) {
    if (el.firstChild) continue;
    el.innerHTML = icon(el.dataset.icon ?? "");
    el.classList.add("ic");
  }
}

function wireTabs(): void {
  for (const box of document.querySelectorAll<HTMLElement>("[data-tabs]")) {
    const tabs = [...box.querySelectorAll<HTMLButtonElement>("[data-tab]")];
    for (const t of tabs) {
      t.addEventListener("click", () => {
        for (const o of tabs) o.setAttribute("aria-selected", String(o === t));
        for (const p of box.querySelectorAll<HTMLElement>("[data-panel]")) p.hidden = p.dataset.panel !== t.dataset.tab;
      });
    }
  }
  for (const btn of document.querySelectorAll<HTMLButtonElement>(".copy")) {
    btn.addEventListener("click", async () => {
      const code = btn.parentElement?.querySelector("code")?.textContent ?? "";
      await navigator.clipboard.writeText(code);
      btn.innerHTML = icon("check");
      btn.classList.add("is-done");
      btn.addEventListener("pointerleave", () => {
        btn.innerHTML = icon("copy");
        btn.classList.remove("is-done");
      }, { once: true });
    });
  }
}

function renderLayers(): void {
  const view = document.querySelector<HTMLElement>("[data-layer-view]");
  if (!view) return;
  view.innerHTML = LAYERS.map(
    (layer) => `<div class="lv-pane" data-pane="${layer.id}" role="tabpanel">
    <div class="lv-head"><span class="lv-ic">${icon(layer.icon)}</span><div><h3>${layer.title}</h3><p>${layer.line}</p></div></div>
    <ul class="lv-items">${layer.items
      .map((i) => `<li><span class="lv-dot"></span><div><b>${i.name}</b><p>${i.what}</p></div></li>`)
      .join("")}</ul>
    <p class="lv-where">${icon("folder")}<span>${layer.where}</span></p></div>`,
  ).join("");
}

function renderLayer(id: string): void {
  for (const pane of document.querySelectorAll<HTMLElement>("[data-pane]")) {
    const on = pane.dataset.pane === id;
    pane.classList.toggle("is-on", on);
    pane.setAttribute("aria-hidden", String(!on));
  }
}

function wireLayers(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-layer]")];
  for (const b of buttons) {
    b.addEventListener("click", () => {
      for (const o of buttons) o.setAttribute("aria-selected", String(o === b));
      renderLayer(b.dataset.layer ?? "rules");
    });
  }
  renderLayers();
  renderLayer("rules");
}

function renderAgents(): void {
  const box = document.querySelector<HTMLElement>("[data-agents]");
  if (!box) return;
  box.innerHTML = AGENTS.map(
    (a) => `<button class="agent" data-agent-card="${a.id}" style="--tone: var(${a.tone})">
      <span class="agent-ic">${icon(a.icon)}</span>
      <span class="agent-txt"><b>${a.id}</b><small>${a.line}</small></span>
    </button>`,
  ).join("");
  const light = (id: string | null) => {
    for (const n of document.querySelectorAll<SVGGElement>("[data-agent]")) n.classList.toggle("is-lit", n.dataset.agent === id);
    for (const c of box.querySelectorAll<HTMLElement>("[data-agent-card]")) c.classList.toggle("is-lit", c.dataset.agentCard === id);
  };
  for (const c of box.querySelectorAll<HTMLElement>("[data-agent-card]")) {
    const id = c.dataset.agentCard ?? null;
    const node = AGENTS.find((a) => a.id === id)?.node ?? null;
    c.addEventListener("pointerenter", () => light(node ?? id));
    c.addEventListener("focus", () => light(node ?? id));
    c.addEventListener("pointerleave", () => light(null));
    c.addEventListener("blur", () => light(null));
  }
}

function renderMatrix(): void {
  const box = document.querySelector<HTMLElement>("[data-matrix]");
  if (!box) return;
  const cell = (label: string, v: string | null) =>
    v ? `<code role="cell" data-label="${label}">${v}</code>` : `<span role="cell" class="mx-none" data-label="${label}">not needed</span>`;
  const mark = (id: string) =>
    id === "empryo" ? `<img data-logo src="${LOGO[currentWorld()]}" alt="" width="22" height="22" />` : logo(id, 22);
  box.innerHTML =
    `<div class="mx-row mx-head" role="row"><span role="columnheader">Agent</span><span role="columnheader">Rules</span><span role="columnheader">Skills</span><span role="columnheader">Agents</span><span role="columnheader">Presets</span></div>` +
    HOSTS.map(
      (h) => `<div class="mx-row" role="row">
        <span class="mx-host" role="rowheader">${mark(h.id)}<span><b>${h.name}</b>${h.note ? `<small>${h.note}</small>` : ""}</span></span>
        ${cell("Rules", h.rules)}${cell("Skills", h.skills)}${h.agents ? cell("Agents", h.agents) : `<span role="cell" class="mx-none" data-label="Agents">no custom agents</span>`}${cell("Presets", h.presets)}
      </div>`,
    ).join("");
}

function renderBest(): void {
  const box = document.querySelector<HTMLElement>("[data-best]");
  if (!box) return;
  box.innerHTML = BEST.map(
    (b) => `<li class="best-item"><span class="best-ic">${icon(b.icon)}</span><b>${b.title}</b><small>${b.line}</small></li>`,
  ).join("");
}

function renderSwatches(): void {
  const box = document.querySelector<HTMLElement>("[data-swatches]");
  if (!box) return;
  box.innerHTML = WORLDS.map(
    (w) => `<button class="swatch" data-swatch="${w.id}" aria-label="Switch to ${w.name}">
      <span class="sw-pair">
        <span class="sw-half" style="--p:${w.dark.paper};--i:${w.dark.ink};--a:${w.dark.pigment};--b:${w.dark.nucleus}"><img src="${LOGO[w.id]}" alt="" width="28" height="28" /><i></i><i></i><i></i></span>
        <span class="sw-half" style="--p:${w.light.paper};--i:${w.light.ink};--a:${w.light.pigment};--b:${w.light.nucleus}"><img src="${LOGO[w.id]}" alt="" width="28" height="28" /><i></i><i></i><i></i></span>
      </span>
      <b>${w.name}</b><small>${w.habitat}</small>
    </button>`,
  ).join("");
  for (const s of box.querySelectorAll<HTMLButtonElement>("[data-swatch]")) {
    s.addEventListener("click", (e) => bloom(e.clientX, e.clientY, () => {
      root.dataset.world = s.dataset.swatch ?? "undertow";
    }));
  }
}

function renderTakeaways(): void {
  const box = document.querySelector<HTMLElement>("[data-takeaways]");
  if (!box) return;
  box.innerHTML = TAKEAWAYS.map(
    (t) => `<article class="take"><span class="take-ic">${icon(t.icon)}</span><h3>${t.title}</h3><p>${t.line}</p></article>`,
  ).join("");
}

function playTerminal(): void {
  const out = document.querySelector<HTMLElement>("[data-term]");
  if (!out) return;
  const lines = TERMINAL;
  if (root.dataset.motion === "still") {
    out.innerHTML = lines.join("\n");
    return;
  }
  let i = 0;
  out.innerHTML = "";
  const tick = () => {
    if (i >= lines.length) return;
    out.innerHTML += `${i ? "\n" : ""}<span class="t-line">${lines[i]}</span>`;
    i += 1;
    window.setTimeout(tick, i < 3 ? 380 : 170);
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      tick();
    }
  });
  io.observe(out);
}

wireIcons();
wireWorlds();
wireTabs();
wireLayers();
renderAgents();
renderMatrix();
renderBest();
renderSwatches();
renderTakeaways();
wireIcons();
paint();
playTerminal();
startScene(document.querySelector<HTMLCanvasElement>(".scene"));
