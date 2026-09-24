import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WORLDS, type World } from "../src/content";

const SITE = join(import.meta.dir, "..");
const PUBLIC = join(SITE, "public");
const OUT = join(PUBLIC, "og");
const TMP = join(SITE, ".og-tmp");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

interface Card {
  file: string;
  world: World["id"];
  kicker: string;
  title: string;
  line: string;
}

const CARDS: Card[] = [
  { file: "home", world: "soul", kicker: "Empryo × ProxySoul", title: "Ensoul your agents", line: "Skills, immune cells, working rules and presets. One command to set up, one to update." },
  { file: "docs", world: "water", kicker: "SoulStack docs", title: "Set up in one line", line: "Every page is also plain Markdown, so your agent can read it too." },
  { file: "immunity", world: "crimson", kicker: "SoulStack immunity", title: "Your product’s immune system", line: "Grown for your project. Scouts find, a skeptic checks, memory keeps every real bug caught." },
];

const LOGO: Record<World["id"], string> = {
  empryo: "logo-mark.webp",
  soul: "logo-proxysoul.webp",
  coffee: "logo-coffee.webp",
  water: "logo-water.webp",
  crimson: "logo-crimson.webp",
  undertow: "logo-undertow.webp",
};

function html(card: Card): string {
  const w = WORLDS.find((x) => x.id === card.world) ?? WORLDS[0];
  const c = w.dark;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: R; src: url("${PUBLIC}/fonts/recursive-living.woff2") format("woff2"); font-weight: 300 1000; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body {
  font-family: R, sans-serif; color: ${c.ink};
  background:
    radial-gradient(520px 420px at 930px 330px, color-mix(in oklab, ${c.pigment} 30%, transparent), transparent 70%),
    radial-gradient(380px 300px at 1080px 90px, color-mix(in oklab, ${c.nucleus} 16%, transparent), transparent 70%),
    radial-gradient(700px 500px at 0 630px, color-mix(in oklab, ${c.pigmentAlt} 14%, transparent), transparent 70%),
    ${c.paper};
  padding: 64px 80px; display: grid; grid-template-columns: 1fr 360px; gap: 24px;
}
.l { display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 14px; font-weight: 800; font-size: 30px; font-variation-settings: "CASL" 1; }
.brand img { width: 48px; height: 48px; }
.kicker { margin-top: auto; font-size: 24px; font-weight: 600; color: ${c.pigment}; }
h1 { margin-top: 14px; font-size: 74px; line-height: 0.98; font-weight: 1000; letter-spacing: -0.02em; font-variation-settings: "CASL" 1; max-width: 13ch; }
p { margin-top: 26px; font-size: 27px; line-height: 1.35; color: color-mix(in oklab, ${c.ink} 72%, ${c.paper}); max-width: 30ch; }
.foot { margin-top: 40px; font-size: 22px; font-variation-settings: "MONO" 1; color: color-mix(in oklab, ${c.ink} 55%, ${c.paper}); }
.r { display: grid; place-items: center; }
.r img { width: 340px; height: 340px; filter: drop-shadow(0 0 40px color-mix(in oklab, ${c.pigment} 45%, transparent)); }
</style></head><body>
<div class="l">
  <div class="brand"><img src="${PUBLIC}/brand/${LOGO[card.world]}">SoulStack</div>
  <div class="kicker">${card.kicker}</div>
  <h1>${card.title}</h1>
  <p>${card.line}</p>
  <div class="foot">soulstack.proxysoul.com</div>
</div>
<div class="r"><img src="${PUBLIC}/brand/mote.webp"></div>
</body></html>`;
}

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
for (const card of CARDS) {
  const page = join(TMP, `${card.file}.html`);
  writeFileSync(page, html(card));
  const out = join(OUT, `${card.file}.png`);
  const run = Bun.spawnSync([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files", "--virtual-time-budget=2000", "--window-size=1200,630", `--screenshot=${out}`, `file://${page}`], { stderr: "pipe" });
  if (run.exitCode !== 0) throw new Error(`chrome failed for ${card.file}: ${run.stderr.toString().slice(0, 400)}`);
  console.log(`og: ${card.file}.png`);
}
rmSync(TMP, { recursive: true, force: true });
