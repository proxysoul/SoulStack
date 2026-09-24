import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const site = join(import.meta.dir, "..");
const repo = join(site, "..");
const out = join(site, "public", "docs");
const ORIGIN = "https://soulstack.proxysoul.com";

interface Page {
  slug: string;
  title: string;
  summary: string;
  group: "Guide" | "Reference" | "Skills" | "Immune cells";
  order: number;
  body: string;
}

function frontmatter(text: string): { meta: Record<string, string>; body: string } {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  const meta: Record<string, string> = {};
  for (const line of text.slice(4, end).split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: text.slice(text.indexOf("\n", end + 1) + 1).trimStart() };
}

const pages: Page[] = [];

for (const file of readdirSync(join(site, "docs-src")).filter((f) => f.endsWith(".md"))) {
  const { meta, body } = frontmatter(readFileSync(join(site, "docs-src", file), "utf8"));
  const order = Number(meta.order ?? 50);
  pages.push({
    slug: basename(file, ".md"),
    title: meta.title ?? file,
    summary: meta.summary ?? "",
    group: order < 7 ? "Guide" : "Reference",
    order,
    body,
  });
}

pages.push({
  slug: "rules",
  title: "Rules every agent follows",
  summary: "The takeaways SoulStack adds to each agent's global rules file.",
  group: "Reference",
  order: 8,
  body: readFileSync(join(repo, "guides", "takeaways.md"), "utf8"),
});

pages.push({
  slug: "mascot-guide",
  title: "Mascot guide",
  summary: "How to draw a calm mascot of your own. Shown with Mote, Empryo's mascot, which is not part of the stack.",
  group: "Reference",
  order: 10,
  body: readFileSync(join(repo, "guides", "mote-mascot.md"), "utf8").replace(/<p align="center">[\s\S]*?<\/p>\n?/g, "").replace(/<p[\s\S]*?<\/p>\n?/g, ""),
});

for (const name of readdirSync(join(repo, "skills"))) {
  const { meta, body } = frontmatter(readFileSync(join(repo, "skills", name, "SKILL.md"), "utf8"));
  pages.push({
    slug: `skills/${name}`,
    title: `Skill: ${name}`,
    summary: meta.description ?? "",
    group: "Skills",
    order: 20,
    body: body.replace(/\]\((reference\/[^)]+)\)/g, `](https://github.com/proxysoul/SoulStack/blob/main/skills/${name}/$1)`),
  });
}

const cells: { name: string; description: string }[] = [];
for (const file of readdirSync(join(repo, "agents")).filter((f) => f.endsWith(".md")).sort()) {
  const { meta, body } = frontmatter(readFileSync(join(repo, "agents", file), "utf8"));
  const name = basename(file, ".md");
  cells.push({ name, description: meta.description ?? "" });
  pages.push({
    slug: `immune-cells/${name}`,
    title: name,
    summary: meta.description ?? "",
    group: "Immune cells",
    order: name === "tcell-helper" ? 30 : 31,
    body: `# ${name}\n\n${meta.description ?? ""}\n\n${body}`,
  });
}

pages.push({
  slug: "immune-cells",
  title: "Immune cells",
  summary: "The ten agents of the immune system and when to call each one.",
  group: "Reference",
  order: 7.5,
  body: `# Immune cells\n\nStart with \`tcell-helper\`; it decides which of the others run.\n\n| Cell | Use it for |\n|---|---|\n${cells
    .map((c) => `| [\`${c.name}\`](immune-cells/${c.name}.md) | ${c.description.split(". ")[0]}. |`)
    .join("\n")}\n`,
});

pages.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

rmSync(out, { recursive: true, force: true });
for (const p of pages) {
  const file = join(out, `${p.slug}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, p.body.endsWith("\n") ? p.body : `${p.body}\n`);
}
writeFileSync(
  join(out, "index.json"),
  JSON.stringify(pages.map(({ slug, title, summary, group }) => ({ slug, title, summary, group })), null, 1),
);

const link = (p: Page) => `- [${p.title}](${ORIGIN}/docs/${p.slug}.md): ${p.summary}`;
const groups: Page["group"][] = ["Guide", "Reference", "Skills", "Immune cells"];
const llms = `# SoulStack

> ProxySoul's agent stack for Empryo, Claude Code, Codex, Copilot CLI, pi and OpenCode: working rules, the ensoul and immune-system skills, ten immune-cell agents, and Empryo presets. One setup command, one update command.

Every page below is plain Markdown. Paths like \`~/dev/SoulStack\` are defaults in the user's home folder, not fixed locations. To install for a user, run the setup script and show its output; it asks nothing and backs up every file it changes.

${groups
  .map((g) => `## ${g}\n\n${pages.filter((p) => p.group === g).map(link).join("\n")}`)
  .join("\n\n")}

## Optional

- [Source on GitHub](https://github.com/proxysoul/SoulStack): the scripts, skills and agents themselves.
- [Everything in one file](${ORIGIN}/llms-full.txt)
`;
writeFileSync(join(site, "public", "llms.txt"), llms);
writeFileSync(
  join(site, "public", "llms-full.txt"),
  `${llms}\n\n${pages.map((p) => `<!-- ${ORIGIN}/docs/${p.slug}.md -->\n\n${p.body}`).join("\n\n---\n\n")}`,
);
writeFileSync(
  join(site, "public", "index.md"),
  `# SoulStack\n\nThe stack that ensouls your agents: rules, skills, immune cells and presets for Empryo, Claude Code, Codex, Copilot CLI, pi and OpenCode.\n\n## Install\n\n\`\`\`bash\ncurl -fsSL https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.sh | sh\n\`\`\`\n\n\`\`\`powershell\nirm https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.ps1 | iex\n\`\`\`\n\n## Docs\n\n${pages.map(link).join("\n")}\n`,
);
writeFileSync(
  join(site, "public", "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${ORIGIN}/</loc></url>\n${pages
    .map((p) => `<url><loc>${ORIGIN}/docs.html?p=${p.slug}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
writeFileSync(join(site, "public", "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`docs: ${pages.length} pages`);
