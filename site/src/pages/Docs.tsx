import { Link, Outlet, getRouteApi, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { icon } from "../icons";
import { Icon } from "../app/Icon";
import { usePageMeta } from "../app/Chrome";
import { DOCS } from "./docs-data";

const GROUPS = [...new Set(DOCS.map((d) => d.group))];

const NARROW = "(max-width: 900px)";

export function DocsLayout() {
  const slug = useRouterState({ select: (s) => s.location.pathname.replace(/^\/docs\/?/, "") });
  const current = DOCS.find((d) => d.slug === slug);
  const [open, setOpen] = useState(() => !matchMedia(NARROW).matches);

  useEffect(() => {
    if (matchMedia(NARROW).matches) setOpen(false);
  }, [slug]);

  useEffect(() => {
    const mq = matchMedia(NARROW);
    const sync = () => setOpen(!mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <main className="docs wrap">
      <nav className="docs-nav" aria-label="Docs">
        <details className="docs-picker" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
          <summary>
            <span>
              {current?.title.replace(/^Skill: /, "") ?? "Pages"} <small>· all pages</small>
            </span>
            <Icon name="chevron" />
          </summary>
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="docs-group">{g}</p>
            <ul>
              {DOCS.filter((d) => d.group === g).map((d) => (
                <li key={d.slug}>
                  <Link to="/docs/$" params={{ _splat: d.slug }} activeProps={{ "aria-current": "page" }}>
                    {d.title.replace(/^Skill: /, "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        </details>
      </nav>
      <Outlet />
    </main>
  );
}

const docRoute = getRouteApi("/docs/$");

export function DocPage() {
  const { entry, html } = docRoute.useLoaderData();
  const body = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  usePageMeta(`${entry.title} · SoulStack docs`, entry.summary);

  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const buttons = [...el.querySelectorAll("pre")].map((pre) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy docs-copy";
      btn.setAttribute("aria-label", "Copy");
      btn.innerHTML = icon("copy");
      const reset = () => {
        btn.innerHTML = icon("copy");
        btn.classList.remove("is-done");
      };
      btn.addEventListener("click", async () => {
        await navigator.clipboard.writeText(pre.querySelector("code")?.textContent ?? pre.textContent ?? "");
        btn.innerHTML = icon("check");
        btn.classList.add("is-done");
      });
      btn.addEventListener("pointerleave", reset);
      btn.addEventListener("blur", reset);
      pre.append(btn);
      return btn;
    });
    return () => {
      for (const b of buttons) b.remove();
    };
  }, [html]);

  return (
    <article className="docs-page">
      <div className="docs-meta">
        <a href={`/docs/${entry.slug}.md`}>
          <Icon name="scroll" />
          View as Markdown
        </a>
      </div>
      <div
        key={entry.slug}
        ref={body}
        className="prose"
        onClick={(e) => {
          const a = (e.target as HTMLElement).closest("a");
          const href = a?.getAttribute("href") ?? "";
          if (!a || !href.startsWith("/docs/") || href.endsWith(".md") || e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          const [path, hash] = href.split("#");
          navigate({ to: "/docs/$", params: { _splat: path.slice("/docs/".length) }, hash });
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
