import { homedir } from "node:os";
import { join } from "node:path";

const source = process.argv[2] ?? join(homedir(), ".empryo", "config.json");
const outDir = join(import.meta.dir, "..", "plugins", "presets");
const version = process.env.PRESET_VERSION ?? "1.0.0";

type Json = Record<string, unknown>;

const MACHINE_KEYS = new Set([
  "onboardingComplete",
  "subscriptionsIntroSeenTui",
  "marionetteIntroSeenTui",
  "marionetteIntroSeen",
  "workspacesIntroSeen",
  "routerRules",
]);

const TRUSTED_KEYS = ["yolo", "cells", "computerUseDrive", "computerUseSettings"] as const;

const MCP_TOKEN_ENV: Record<string, string> = {
  cloudflare: "CLOUDFLARE_API_TOKEN",
};

const config = (await Bun.file(source).json()) as Json;

function pick(keys: readonly string[]): Json {
  const out: Json = {};
  for (const k of keys) if (k in config) out[k] = config[k];
  return out;
}

const base: Json = {};
for (const [k, v] of Object.entries(config)) {
  if (MACHINE_KEYS.has(k) || k.includes(".") || k === "mcpServers") continue;
  if ((TRUSTED_KEYS as readonly string[]).includes(k)) continue;
  base[k] = v;
}

interface McpServer {
  name: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  [k: string]: unknown;
}

function tokenEnvFor(name: string): string {
  const prefix = Object.keys(MCP_TOKEN_ENV).find((p) => name.startsWith(p));
  return prefix ? (MCP_TOKEN_ENV[prefix] ?? "") : `${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_TOKEN`;
}

const servers = ((config.mcpServers as McpServer[] | undefined) ?? []).map((s) => {
  const env = tokenEnvFor(s.name);
  const out: McpServer = { ...s };
  if (s.headers) {
    out.headers = Object.fromEntries(
      Object.keys(s.headers).map((h) => [h, h.toLowerCase() === "authorization" ? `Bearer \${${env}}` : `\${${env}}`]),
    );
  }
  if (s.env) out.env = Object.fromEntries(Object.keys(s.env).map((k) => [k, `\${${k}}`]));
  return out;
});

const presets: Array<{ file: string; preset: Json }> = [
  {
    file: "proxysoul.json",
    preset: {
      name: "proxysoul",
      version,
      description: "proxySoul's global Empryo setup: models and routing, theme and appearance, editor, agent features",
      config: base,
    },
  },
  {
    file: "proxysoul-trusted.json",
    preset: {
      name: "proxysoul-trusted",
      version,
      description: "Full autonomy: yolo, auto-approved cells, computer use with every capability switch on. Trusted machines only",
      config: pick(TRUSTED_KEYS),
    },
  },
];

if (servers.length > 0) {
  presets.push({
    file: "proxysoul-mcp.json",
    preset: {
      name: "proxysoul-mcp",
      version,
      description: "MCP servers. Tokens come from environment variables, never from this file",
      config: { mcpServers: servers },
    },
  });
}

const SECRET = /(sk-[A-Za-z0-9]|ghp_|gho_|xox[bp]-|AKIA[0-9A-Z]{12}|Bearer [A-Za-z0-9])/;
for (const { file, preset } of presets) {
  const text = `${JSON.stringify(preset, null, 2)}\n`;
  if (SECRET.test(text)) throw new Error(`${file} looks like it contains a secret; refusing to write it`);
  await Bun.write(join(outDir, file), text);
  console.log(`wrote plugins/presets/${file}`);
}
