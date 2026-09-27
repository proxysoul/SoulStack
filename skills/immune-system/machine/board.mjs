#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? "immune/machine";
const STAGES = ["found", "ready", "rejected", "verified", "fixed", "guarded"];
const SETTLE_MS = 2 * 60 * 1000;
const STALE_CLAIM_MS = 10 * 60 * 1000;

if (!existsSync(root)) {
  console.error(`no machine at ${root}`);
  process.exit(1);
}

const list = (dir) => (existsSync(dir) ? readdirSync(dir) : []);
const field = (text, name) => text.match(new RegExp(`^- ${name}: (.+)$`, "m"))?.[1].trim() ?? "";
const count = (text, heading) => text.split("\n").filter((l) => l.trim() === `## ${heading}`).length;

const records = [];
for (const stage of STAGES) {
  for (const name of list(join(root, stage))) {
    if (!name.endsWith(".md")) continue;
    const path = join(root, stage, name);
    const text = readFileSync(path, "utf8");
    records.push({
      id: name.slice(0, -3),
      stage,
      status: field(text, "status") || stage,
      severity: field(text, "severity"),
      fixes: count(text, "Fix"),
      reviews: count(text, "Fix review"),
      approved: /^## Verdict\s*\n+\s*APPROVED/m.test(text),
      settled: Date.now() - statSync(path).mtimeMs >= SETTLE_MS,
      mtime: statSync(path).mtimeMs,
    });
  }
}

const claims = new Map();
for (const role of ["review", "fix", "fixrev"]) {
  for (const name of list(join(root, "claims", role))) {
    claims.set(`${role}/${name}`, statSync(join(root, "claims", role, name)).mtimeMs);
  }
}
const claimed = (key) => claims.has(key);

const byStage = Object.fromEntries(STAGES.map((s) => [s, records.filter((r) => r.stage === s).length]));
const byStatus = {};
for (const r of records) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

const seen = new Map();
for (const r of records) seen.set(r.id, [...(seen.get(r.id) ?? []), r.stage]);
const duplicates = [...seen].filter(([, stages]) => stages.length > 1).map(([id, stages]) => `${id} (${stages.join(", ")})`);

const claimable = {
  review: records.filter((r) => r.stage === "found" && r.settled && !claimed(`review/${r.id}`)).map((r) => r.id),
  fix: records
    .filter((r) => r.stage === "ready" && r.settled)
    .filter((r) =>
      r.status === "fix-rejected" ? !claimed(`fix/${r.id}-r${r.reviews}`) : r.approved && r.fixes === 0 && !claimed(`fix/${r.id}`),
    )
    .map((r) => r.id),
  fixReview: records
    .filter((r) => r.stage === "ready" && r.status === "fixed-unverified" && r.settled && !claimed(`fixrev/${r.id}-${r.fixes}`))
    .map((r) => r.id),
};

const latest = new Map(records.map((r) => [r.id, r.mtime]));
const stale = [...claims]
  .filter(([key, at]) => {
    const id = key.split("/")[1].replace(/-(r?\d+)$/, "");
    const moved = latest.get(id) ?? latest.get(key.split("/")[1]);
    return moved !== undefined && moved <= at && Date.now() - at >= STALE_CLAIM_MS;
  })
  .map(([key]) => key);

const out = { root, stages: byStage, statuses: byStatus, claimable, duplicates, staleClaims: stale };
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`machine at ${root}`);
  console.log(`  ${STAGES.map((s) => `${s} ${byStage[s]}`).join("  ")}`);
  console.log(`  statuses: ${Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
  console.log(`  claimable: review ${claimable.review.length}, fix ${claimable.fix.length}, fix review ${claimable.fixReview.length}`);
  if (duplicates.length) console.log(`  in two places: ${duplicates.join("; ")}`);
  if (stale.length) console.log(`  claims with no progress since claimed: ${stale.join(", ")}`);
}
