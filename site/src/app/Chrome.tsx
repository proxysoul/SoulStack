import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { WORLDS } from "../content";
import { LOGO, persistWorld, pickWorld, toggleMode, useWorld } from "../world";
import { Icon } from "./Icon";

const SECTIONS = [
  { hash: "stack", label: "Stack" },
  { hash: "agents", label: "Agents" },
  { hash: "empryo", label: "Empryo" },
  { hash: "immune", label: "Immune" },
  { hash: "design", label: "Design" },
  { hash: "update", label: "Update" },
];

export function Bar() {
  const state = useWorld();
  const onDocs = useRouterState({ select: (s) => s.location.pathname.startsWith("/docs") });

  useEffect(() => persistWorld(state), [state.world, state.mode]);

  return (
    <header className="bar">
      <Link className="bar-brand" to="/" aria-label="SoulStack home">
        <img className="bar-logo" src={LOGO[state.world]} alt="" width={28} height={28} />
        <span className="bar-name">SoulStack</span>
      </Link>
      <nav className="bar-nav" aria-label="Sections">
        {SECTIONS.map((s) => (
          <Link key={s.hash} to="/" hash={s.hash} activeOptions={{ includeHash: true }} activeProps={{ "aria-current": undefined }}>
            {s.label}
          </Link>
        ))}
        <Link to="/docs" aria-current={onDocs ? "page" : undefined}>
          Docs
        </Link>
      </nav>
      <div className="bar-tools">
        <div className="worlds" role="radiogroup" aria-label="World">
          {WORLDS.map((w) => (
            <button
              key={w.id}
              type="button"
              className="world"
              role="radio"
              aria-checked={state.world === w.id}
              aria-label={w.name}
              title={`${w.name} · ${w.habitat}`}
              style={{ "--sw-a": w.dark.pigment, "--sw-b": w.dark.paper } as React.CSSProperties}
              onClick={(e) => pickWorld(w.id, e)}
            />
          ))}
        </div>
        <button type="button" className="icon-btn" aria-label="Switch light or dark" title="Light or dark" onClick={(e) => toggleMode(e)}>
          <Icon name={state.mode === "dark" ? "sun" : "moon"} />
        </button>
        <a className="icon-btn" href="https://github.com/proxysoul/SoulStack" aria-label="SoulStack on GitHub" title="GitHub">
          <Icon name="github" />
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  const { world } = useWorld();
  return (
    <footer className="foot wrap">
      <span>
        <img src={LOGO[world]} alt="" width={22} height={22} />
        Empryo × ProxySoul
      </span>
      <nav>
        <Link to="/docs">Docs</Link>
        <a href="/immunity/">Immunity</a>
        <a href="https://empryo.com">empryo.com</a>
        <a href="https://github.com/proxysoul/SoulStack">GitHub</a>
      </nav>
    </footer>
  );
}

export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}
