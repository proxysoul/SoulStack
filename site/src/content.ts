interface Palette {
  paper: string;
  ink: string;
  pigment: string;
  pigmentAlt: string;
  nucleus: string;
}

export interface World {
  id: "empryo" | "soul" | "coffee" | "water" | "crimson" | "undertow";
  name: string;
  habitat: string;
  dark: Palette;
  light: Palette;
}

const p = (paper: string, ink: string, pigment: string, pigmentAlt: string, nucleus: string): Palette => ({
  paper,
  ink,
  pigment,
  pigmentAlt,
  nucleus,
});

export const WORLDS: World[] = [
  { id: "empryo", name: "Empryo", habitat: "The culture", dark: p("#060807", "#f3f7f3", "#1deb1b", "#d89b65", "#eca3c4"), light: p("#f7faf7", "#111a12", "#0f7a0e", "#8f5f22", "#a34170") },
  { id: "soul", name: "proxySoul", habitat: "The night garden", dark: p("#0a0812", "#e9e7f2", "#9b6af5", "#ff3d7f", "#ff8fb4"), light: p("#faf8ff", "#1c1830", "#5b2fd6", "#c40046", "#c40046") },
  { id: "coffee", name: "Coffee", habitat: "The café", dark: p("#0b0906", "#f0ece4", "#e88a1a", "#d4a35a", "#f0a08a"), light: p("#fdf9f3", "#2a1d10", "#a34a00", "#ad3d15", "#ad3d15") },
  { id: "water", name: "Water", habitat: "The pond", dark: p("#070b10", "#e6eef3", "#1eb4e0", "#1ab8a4", "#f28fb0"), light: p("#f5fafc", "#10222b", "#00708f", "#00705f", "#b8336a") },
  { id: "crimson", name: "Crimson", habitat: "The heart", dark: p("#0e0812", "#f6eaf1", "#f43a6b", "#ab7bf0", "#ffb3c8"), light: p("#fdf6f8", "#2a1520", "#c4184a", "#6b3fc4", "#9c2247") },
  { id: "undertow", name: "Undertow", habitat: "The deep", dark: p("#0c0e11", "#e8ebee", "#98b0c2", "#c49aa4", "#e0a9b6"), light: p("#f4f6f8", "#1a2028", "#4a6a80", "#914d5e", "#914d5e") },
];

interface LayerItem {
  name: string;
  what: string;
}

interface Layer {
  id: string;
  icon: string;
  title: string;
  line: string;
  items: LayerItem[];
  where: string;
}

export const LAYERS: Layer[] = [
  {
    id: "rules",
    icon: "scroll",
    title: "Rules",
    line: "Takeaways from building Empryo, loaded into every conversation of every agent.",
    items: [
      { name: "Finish the job", what: "Implement fully, connect it everywhere, remove what it replaced." },
      { name: "Prove it", what: "Reproduce before fixing, before-and-after numbers, test in the real app." },
      { name: "Read the user", what: "Short messages carry the whole intent; a mid-task message is a correction." },
      { name: "Memory", what: "Read it before starting, save what the code can't show when done." },
    ],
    where: "A marked block in each agent's global rules file. Your own text is never touched.",
  },
  {
    id: "skills",
    icon: "sparkles",
    title: "Skills",
    line: "Playbooks an agent loads when the task matches, and unloads when the work is done.",
    items: [
      { name: "ensoul", what: "Builds a design system with worlds, modes, logos and screenshots, then redesigns the site." },
      { name: "immune-system", what: "Drives the real product everywhere and remembers every bug." },
    ],
    where: "Linked into ~/.agents/skills and ~/.claude/skills, so updates arrive with the stack.",
  },
  {
    id: "agents",
    icon: "bot",
    title: "Agents",
    line: "Ten immune cells. Each loads the immune-system skill and hands work to the next.",
    items: [
      { name: "tcell-helper, the lead", what: "Reads the immune system's state, decides who runs, owns the verdict." },
      { name: "dendritic and tcell-hunter, the scout and the attacker", what: "Find what is missing, and attack what exists." },
      { name: "negative-selection, the skeptic", what: "Tries to disprove every claim before it is filed." },
      { name: "memory-cell and tcell-patrol", what: "Make each confirmed bug a permanent check, then run them all." },
    ],
    where: "Linked into ~/.agents/agents (Empryo), ~/.claude/agents and ~/.copilot/agents.",
  },
  {
    id: "immunity",
    icon: "shield",
    title: "Immunity",
    line: "An immune system your agent grows for your project: it finds bugs, proves them, and never lets them back.",
    items: [
      { name: "Grown, not copied", what: "Your agent studies the product, researches this month's tools and builds the checks that fit." },
      { name: "The immune app", what: "immune:app shows health, runs, cells and findings in your design system, and starts runs." },
      { name: "Security built in", what: "natural-killer watches packages, secrets and installers on every run." },
      { name: "Memory", what: "Every confirmed bug becomes a permanent check." },
    ],
    where: "immune/ and .agents/agents/ in your project. See SoulStack's own under View SoulStack immunity.",
  },
  {
    id: "presets",
    icon: "sliders",
    title: "Presets",
    line: "ProxySoul's own Empryo setup, opt-in, added to your config without replacing it.",
    items: [
      { name: "proxysoul", what: "Models and routing, theme and appearance, agent features." },
      { name: "proxysoul-mcp", what: "MCP servers, with tokens read from your environment." },
      { name: "proxysoul-trusted", what: "Full autonomy. Only when you ask for it." },
    ],
    where: "The presets list in ~/.empryo/config.json, backed up first.",
  },
  {
    id: "setup",
    icon: "refresh",
    title: "Setup",
    line: "One script for macOS, Linux and Windows. Animated in a terminal, plain for agents.",
    items: [
      { name: "Detects", what: "Empryo, Claude Code, Codex and Copilot, and skips what you don't have." },
      { name: "Backs up", what: "Every file it changes, to .bak-<time>, before touching it." },
      { name: "Updates", what: "soulstack update pulls the new version and lists what changed." },
    ],
    where: "Clones to ~/dev/SoulStack in your home folder by default (set SOULSTACK_DIR to choose another), and adds the soulstack command to ~/.local/bin.",
  },
];

interface Best {
  icon: string;
  title: string;
  line: string;
}

export const BEST: Best[] = [
  { icon: "zap", title: "Rules reload live", line: "Edits and updates apply on the next message." },
  { icon: "compass", title: "Genome-aware cells", line: "Immune cells ask the code map where a bug lands." },
  { icon: "refresh", title: "Checks via project", line: "immune, immune:smoke, run the same way every time." },
  { icon: "users", title: "Cells in parallel", line: "tcell-helper dispatches the rest in the background." },
  { icon: "brain", title: "Immune memory", line: "Confirmed bugs and traps are saved and reread." },
  { icon: "monitor", title: "Real front doors", line: "Browser and computer use drive web and desktop apps." },
  { icon: "shield", title: "Nightly patrols", line: "A routine runs smoke and wakes the lead on red." },
  { icon: "scroll", title: "Self-writing rules", line: "EMPRYO.md fills itself in from the Genome." },
];

interface Agent {
  id: string;
  icon: string;
  tone: string;
  line: string;
  node?: string;
}

export const AGENTS: Agent[] = [
  { id: "tcell-helper", icon: "compass", tone: "--pigment", line: "starts here, decides who runs" },
  { id: "dendritic", icon: "search", tone: "--pigment-alt", line: "finds what is missing" },
  { id: "tcell-hunter", icon: "crosshair", tone: "--bad", line: "attacks with hostile cases", node: "dendritic" },
  { id: "negative-selection", icon: "scale", tone: "--warn", line: "tries to disprove every claim" },
  { id: "memory-cell", icon: "lock", tone: "--info", line: "makes bugs permanent checks" },
  { id: "tcell-patrol", icon: "shield", tone: "--ok", line: "runs the suite, sorts every red" },
  { id: "tcell-platform", icon: "monitor", tone: "--nucleus", line: "one-OS failures, transport traps", node: "tcell-patrol" },
  { id: "tcell-retina", icon: "eye", tone: "--nucleus", line: "rendering bugs, layer by layer", node: "dendritic" },
  { id: "natural-killer", icon: "shield", tone: "--bad", line: "packages, secrets, installers", node: "negative-selection" },
  { id: "tcell-armorer", icon: "wrench", tone: "--ink-soft", line: "keeps the instruments honest", node: "tcell-helper" },
];

interface Takeaway {
  icon: string;
  title: string;
  line: string;
}

export const TAKEAWAYS: Takeaway[] = [
  { icon: "check", title: "Finish the job", line: "Wired in everywhere, old code removed, nothing left half done." },
  { icon: "bug", title: "Reproduce first", line: "Show the bug, fix it, show it gone." },
  { icon: "chart", title: "Before and after", line: "Same measurement, real numbers, from the real app." },
  { icon: "eye", title: "Show, don't tell", line: "Screenshots and charts, one short line each." },
  { icon: "brain", title: "Use memory", line: "Read it first; save the why, the traps and the preferences." },
  { icon: "users", title: "Share the folder", line: "Add files by name; talk to the tab that owns a file." },
];

const d = (s: string) => `<i class="c-dim">${s}</i>`;
const ok = (s: string) => `<i class="c-ok">${s}</i>`;
const acc = (s: string) => `<i class="c-acc">${s}</i>`;

export const TERMINAL: string[] = [
  `<b class="c-fg">SoulStack</b>  ${d("Empryo × ProxySoul")}`,
  `${d("stack")}   ${ok("created")}  ~/dev/SoulStack  ${d("v1.1.0")}`,
  `${d("found")}   Empryo, Claude Code, Codex, Copilot, pi, OpenCode`,
  "",
  `${d("skill")}   ${ok("linked")}   ensoul, immune-system  ${d("in 2 places")}`,
  `${d("agent")}   ${ok("linked")}   10 immune cells  ${d("in 4 agents")}`,
  `${d("command")} ${ok("linked")}   soulstack`,
  `${d("rules")}   ${acc("added")}    all 6 agents  ${d("your text kept")}`,
  `${d("preset")}  ${ok("added")}    proxysoul`,
  "",
  `${ok("Done.")} ${d("Restart your agent to load SoulStack.")}`,
  `${d("Update any time with")} soulstack update`,
];

export interface Host {
  id: "empryo" | "claude" | "codex" | "copilot" | "pi" | "opencode";
  name: string;
  rules: string;
  skills: string;
  agents: string | null;
  presets: string | null;
  note?: string;
}

export const HOSTS: Host[] = [
  { id: "empryo", name: "Empryo", rules: "~/.empryo/EMPRYO.md", skills: "~/.agents/skills", agents: "~/.agents/agents", presets: "presets in config.json" },
  { id: "claude", name: "Claude Code", rules: "~/.claude/CLAUDE.md", skills: "~/.claude/skills", agents: "~/.claude/agents", presets: null },
  { id: "codex", name: "Codex", rules: "~/.codex/AGENTS.md", skills: "~/.agents/skills", agents: null, presets: null },
  { id: "copilot", name: "Copilot CLI", rules: "~/.copilot/copilot-instructions.md", skills: "~/.agents/skills", agents: "~/.copilot/agents", presets: null, note: "or the Copilot plugin" },
  { id: "pi", name: "pi", rules: "~/.pi/agent/AGENTS.md", skills: "~/.agents/skills", agents: null, presets: null },
  { id: "opencode", name: "OpenCode", rules: "~/.config/opencode/AGENTS.md", skills: "~/.agents/skills", agents: "~/.config/opencode/agents", presets: null, note: "v1 agent/ and v2 agents/" },
];
