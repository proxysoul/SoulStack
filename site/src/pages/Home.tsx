import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AgentLogo, Icon } from "../app/Icon";
import { CopyButton } from "../app/CopyButton";
import { usePageMeta } from "../app/Chrome";
import { AGENTS, BEST, HOSTS, LAYERS, TAKEAWAYS, TERMINAL, WORLDS } from "../content";
import { startScene } from "../scene";
import { LOGO, pickWorld, useWorld } from "../world";

const INSTALL = [
  { id: "unix", icon: "apple", label: "macOS · Linux", cmd: "curl -fsSL https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.sh | sh" },
  { id: "win", icon: "windows", label: "Windows", cmd: "irm https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.ps1 | iex" },
  { id: "copilot", icon: "github", label: "Copilot", cmd: "copilot plugin marketplace add proxysoul/SoulStack && copilot plugin install soulstack@soulstack" },
  { id: "skills", icon: "package", label: "Skills only", cmd: "npx skills add proxysoul/SoulStack" },
];

const LAYER_TABS = [
  { id: "rules", icon: "scroll", title: "Rules", sub: "takeaways every agent follows" },
  { id: "skills", icon: "sparkles", title: "Skills", sub: "ensoul · immune-system" },
  { id: "agents", icon: "bot", title: "Agents", sub: "ten immune cells" },
  { id: "immunity", icon: "shield", title: "Immunity", sub: "testing grown for your project" },
  { id: "presets", icon: "sliders", title: "Presets", sub: "Empryo models, theme, tools" },
  { id: "setup", icon: "refresh", title: "Setup", sub: "install, check, update, remove" },
];

export function Home() {
  usePageMeta(
    "SoulStack · Empryo × ProxySoul",
    "The agent stack behind Empryo: skills, immune cells, working rules and presets for Empryo, Claude Code, Codex, Copilot, pi and OpenCode.",
  );
  return (
    <>
      <Scene />
      <main id="top">
        <Hero />
        <Layers />
        <Matrix />
        <Best />
        <Immune />
        <Design />
        <section className="wrap section">
          <div className="section-head">
            <h2>What every agent learns</h2>
            <p>The takeaways, loaded into every conversation.</p>
          </div>
          <div className="takeaways">
            {TAKEAWAYS.map((t) => (
              <article className="take" key={t.title}>
                <Icon name={t.icon} className="take-ic" />
                <h3>{t.title}</h3>
                <p>{t.line}</p>
              </article>
            ))}
          </div>
        </section>
        <Update />
      </main>
    </>
  );
}

function Scene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => (canvas.current ? startScene(canvas.current) : undefined), []);
  return <canvas ref={canvas} className="scene" aria-hidden="true" />;
}

function Hero() {
  const [tab, setTab] = useState(INSTALL[0].id);
  return (
    <section className="hero wrap">
      <div className="hero-words">
        <p className="hero-kicker">
          <span className="dot" /> Empryo × ProxySoul
        </p>
        <h1 className="hero-title">
          The stack that
          <br />
          ensouls your agents.
        </h1>
        <p className="hero-lede">
          Skills, immune cells, working rules and presets, lifted from how Empryo is built. One command sets it up for every agent on your machine.
        </p>
        <div className="install">
          <div className="tabs" role="tablist" aria-label="Install">
            {INSTALL.map((i) => (
              <button key={i.id} type="button" role="tab" aria-selected={tab === i.id} onClick={() => setTab(i.id)}>
                <Icon name={i.icon} />
                {i.label}
              </button>
            ))}
          </div>
          {INSTALL.map((i) => (
            <div key={i.id} className="cmd" hidden={tab !== i.id}>
              <code>{i.cmd}</code>
              <CopyButton text={i.cmd} />
            </div>
          ))}
          <p className="install-note">
            Asks nothing. Backs up every file it touches. Or tell your agent: <em>“Set up SoulStack from github.com/proxysoul/SoulStack.”</em>
          </p>
        </div>
      </div>
      <figure className="term" aria-label="What setup prints">
        <div className="term-bar">
          <span />
          <span />
          <span />
          <em>soulstack update</em>
        </div>
        <div className="term-body">
          <Mote />
          <Terminal />
        </div>
      </figure>
    </section>
  );
}

function Mote() {
  const { mode } = useWorld();
  return (
    <img
      className="term-mote"
      src={mode === "light" ? "/mote-light.gif" : "/mote-dark.gif"}
      alt="Mote, the Empryo mascot, looking around"
      width={96}
      height={96}
    />
  );
}

function Terminal() {
  const { still } = useWorld();
  const out = useRef<HTMLPreElement>(null);
  const [shown, setShown] = useState(0);
  const count = still ? TERMINAL.length : shown;

  useEffect(() => {
    const el = out.current;
    if (still || !el) return;
    let timer = 0;
    let n = 0;
    const tick = () => {
      n += 1;
      setShown(n);
      if (n < TERMINAL.length) timer = window.setTimeout(tick, n < 3 ? 380 : 170);
    };
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      tick();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [still]);

  const html = TERMINAL.slice(0, count)
    .map((line) => (still ? line : `<span class="t-line">${line}</span>`))
    .join("\n");
  return <pre ref={out} className="term-out" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Layers() {
  const [active, setActive] = useState("rules");
  return (
    <section id="stack" className="wrap section">
      <div className="section-head">
        <h2>Six layers, one command</h2>
        <p>Pick a layer to see what it puts where.</p>
      </div>
      <div className="stack">
        <ol className="layers" role="tablist" aria-label="Layers">
          {LAYER_TABS.map((l) => (
            <li key={l.id}>
              <button type="button" className="layer" role="tab" aria-selected={active === l.id} onClick={() => setActive(l.id)}>
                <Icon name={l.icon} />
                <b>{l.title}</b>
                <small>{l.sub}</small>
              </button>
            </li>
          ))}
        </ol>
        <div className="layer-view" aria-live="polite">
          {LAYERS.map((layer) => (
            <div key={layer.id} className={layer.id === active ? "lv-pane is-on" : "lv-pane"} role="tabpanel" aria-hidden={layer.id !== active}>
              <div className="lv-head">
                <Icon name={layer.icon} className="lv-ic" />
                <div>
                  <h3>{layer.title}</h3>
                  <p>{layer.line}</p>
                </div>
              </div>
              <ul className="lv-items">
                {layer.items.map((i) => (
                  <li key={i.name}>
                    <span className="lv-dot" />
                    <div>
                      <b>{i.name}</b>
                      <p>{i.what}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="lv-where">
                <Icon name="folder" />
                <span>{layer.where}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ label, value, empty = "not needed" }: { label: string; value: string | null; empty?: string }) {
  return value ? (
    <code role="cell" data-label={label}>
      {value}
    </code>
  ) : (
    <span role="cell" className="mx-none" data-label={label}>
      {empty}
    </span>
  );
}

function Matrix() {
  return (
    <section id="agents" className="wrap section">
      <div className="section-head">
        <h2>Lands in every agent you use</h2>
        <p>Setup finds the agents you have and writes only where each one reads. Paths are defaults in your home folder.</p>
      </div>
      <div className="matrix" role="table" aria-label="What goes where">
        <div className="mx-row mx-head" role="row">
          {["Agent", "Rules", "Skills", "Agents", "Presets"].map((h) => (
            <span key={h} role="columnheader">
              {h}
            </span>
          ))}
        </div>
        {HOSTS.map((h) => (
          <div key={h.id} className={h.id === "empryo" ? "mx-row mx-row-empryo" : "mx-row"} role="row">
            <span className="mx-host" role="rowheader">
              {h.id === "empryo" ? <img className="mx-mote" src="/mote.webp" alt="" width={36} height={36} /> : <AgentLogo id={h.id} />}
              {h.id === "empryo" ? (
                <a className="mx-empryo-link" href="https://empryo.com" rel="noopener">
                  <b>{h.name}</b>
                  <small>by the SoulStack team · empryo.com</small>
                </a>
              ) : (
                <span>
                  <b>{h.name}</b>
                  {h.note ? <small>{h.note}</small> : null}
                </span>
              )}
            </span>
            <Cell label="Rules" value={h.rules} />
            <Cell label="Skills" value={h.skills} />
            <Cell label="Agents" value={h.agents} empty="no custom agents" />
            <Cell label="Presets" value={h.presets} />
          </div>
        ))}
      </div>
      <ul className="promises">
        <li>
          <Icon name="shield" />
          <p>
            <b>Your text stays.</b> SoulStack writes one marked block and never overwrites your own rules.
          </p>
        </li>
        <li>
          <Icon name="archive" />
          <p>
            <b>Backups first.</b> Every changed file is copied to <code>.bak-&lt;time&gt;</code> before the edit.
          </p>
        </li>
        <li>
          <Icon name="zap" />
          <p>
            <b>No restart in Empryo.</b> Edited rules apply on the next message.
          </p>
        </li>
      </ul>
    </section>
  );
}

function Best() {
  const { world } = useWorld();
  return (
    <section id="empryo" className="wrap section">
      <div className="best">
        <div className="best-lead">
          <img className="best-logo" src={LOGO[world]} alt="" width={64} height={64} />
          <h2>
            Works everywhere.
            <br />
            Best in Empryo.
          </h2>
          <p>SoulStack comes from the team that builds Empryo. Inside it, the stack can see your code, run in parallel, remember, and patrol on its own.</p>
          <div className="best-actions">
            <a className="btn btn-primary" href="https://empryo.com">
              <Icon name="sparkles" />
              Get Empryo
            </a>
            <Link className="btn" to="/docs/$" params={{ _splat: "with-empryo" }}>
              <Icon name="compass" />
              How they fit
            </Link>
          </div>
        </div>
        <ul className="best-grid">
          {BEST.map((b) => (
            <li className="best-item" key={b.title}>
              <Icon name={b.icon} className="best-ic" />
              <b>{b.title}</b>
              <small>{b.line}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const NODES = [
  { id: "dendritic", x: 260, y: 70, word: "sense", sub: "scout + hunt" },
  { id: "negative-selection", x: 450, y: 260, word: "select", sub: "kill false alarms" },
  { id: "memory-cell", x: 260, y: 450, word: "remember", sub: "memory cell" },
  { id: "tcell-patrol", x: 70, y: 260, word: "patrol", sub: "every release" },
];

function Immune() {
  const [lit, setLit] = useState<string | null>(null);
  return (
    <section id="immune" className="wrap section">
      <div className="section-head">
        <h2>An immune system for your product</h2>
        <p>
          Grown for your project by your agent, like its rules file. Scouts find what is missing, a skeptic kills false alarms, memory makes every real bug a permanent check. Generalised from Empryo’s own.
        </p>
      </div>
      <div className="qa">
        <a className="btn btn-primary immune-cta" href="/immunity/">
          <Icon name="shield" />
          View SoulStack immunity
        </a>
        <svg className="loop" viewBox="0 0 520 520" role="img" aria-label="The immune loop: sense, select, remember, patrol">
          <circle className="loop-ring" cx="260" cy="260" r="190" />
          <circle className="loop-runner" r="7">
            <animateMotion dur="9s" repeatCount="indefinite" path="M260 70 A190 190 0 1 1 259.99 70" />
          </circle>
          {NODES.map((n) => (
            <g key={n.id} className={lit === n.id ? "loop-node is-lit" : "loop-node"} transform={`translate(${n.x} ${n.y})`}>
              <circle r="46" />
              <text y="-4">{n.word}</text>
              <text y="14" className="sub">
                {n.sub}
              </text>
            </g>
          ))}
          <g className={lit === "tcell-helper" ? "loop-core is-lit" : "loop-core"} transform="translate(260 260)">
            <circle r="62" />
            <text y="-4">helper T cell</text>
            <text y="16" className="sub">
              decides who runs
            </text>
          </g>
        </svg>
        <div className="agents">
          {AGENTS.map((a) => {
            const target = a.node ?? a.id;
            return (
              <button
                key={a.id}
                type="button"
                className={lit === target ? "agent is-lit" : "agent"}
                style={{ "--tone": `var(${a.tone})` } as React.CSSProperties}
                onPointerEnter={() => setLit(target)}
                onFocus={() => setLit(target)}
                onPointerLeave={() => setLit(null)}
                onBlur={() => setLit(null)}
              >
                <Icon name={a.icon} className="agent-ic" />
                <span className="agent-txt">
                  <b>{a.id}</b>
                  <small>{a.line}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Design() {
  const { world } = useWorld();
  return (
    <section id="design" className="wrap section">
      <div className="section-head">
        <h2>ensoul: a design system that reads your vibe</h2>
        <p>Six worlds, two modes, every logo and screenshot switching together. Try them in the top bar.</p>
      </div>
      <div className="design">
        <div className="swatches">
          {WORLDS.map((w) => (
            <button key={w.id} type="button" className={w.id === world ? "swatch is-on" : "swatch"} aria-label={`Switch to ${w.name}`} onClick={(e) => pickWorld(w.id, e)}>
              <span className="sw-pair">
                {[w.dark, w.light].map((p, i) => (
                  <span key={i} className="sw-half" style={{ "--p": p.paper, "--i": p.ink, "--a": p.pigment, "--b": p.nucleus } as React.CSSProperties}>
                    <img src={LOGO[w.id]} alt="" width={28} height={28} />
                    <i />
                    <i />
                    <i />
                  </span>
                ))}
              </span>
              <b>{w.name}</b>
              <small>{w.habitat}</small>
            </button>
          ))}
        </div>
        <figure className="mote-card">
          <img src="/renderings.png" alt="Example from the mascot guide: Mote, Empryo's mascot, in six styles" loading="lazy" />
          <figcaption>Made with the mascot guide: one still body, a moving eye. Mote is Empryo's; make your own.</figcaption>
        </figure>
      </div>
    </section>
  );
}

function Update() {
  return (
    <section id="update" className="wrap section">
      <div className="section-head">
        <h2>Stays current with one word</h2>
        <p>
          Setup adds a <code>soulstack</code> command. Your own changes are never overwritten.
        </p>
      </div>
      <div className="update">
        <div className="verbs">
          <div className="verb">
            <code>soulstack check</code>
            <p>Is a new version out? Changes nothing.</p>
          </div>
          <div className="verb">
            <code>soulstack update</code>
            <p>Gets it, sets everything up again, shows what’s new.</p>
          </div>
          <div className="verb">
            <code>soulstack remove</code>
            <p>Takes SoulStack out. Your own rules stay.</p>
          </div>
        </div>
        <figure className="term term-small" aria-label="What an update prints">
          <div className="term-bar">
            <span />
            <span />
            <span />
            <em>soulstack update</em>
          </div>
          <pre
            className="term-out is-static"
            dangerouslySetInnerHTML={{
              __html: `<i class="c-dim">stack</i>   <i class="c-ok">updated</i>  ~/dev/SoulStack  <i class="c-dim">v1.0.0 to v1.1.0</i>
<i class="c-dim">new</i>     feat(scripts): add soulstack update, check and remove
<i class="c-dim">new</i>     feat(guides): get, load and unload the skills a task needs
<i class="c-dim">skill</i>   <i class="c-dim">same</i>     ensoul, immune-system
<i class="c-dim">rules</i>   <i class="c-acc">updated</i>  Empryo, Claude Code, Codex, Copilot

<i class="c-ok">Done.</i> <i class="c-dim">Restart your agent to load SoulStack.</i>`,
            }}
          />
        </figure>
      </div>
    </section>
  );
}
