#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readBoard, STAGES } from "../app/board.mjs";
const root = process.argv[2] ?? "immune/machine";
if (!existsSync(root)) {
  console.error(`no machine at ${root}`);
  process.exit(1);
}
const out = readBoard(root);
const { stages: byStage, statuses: byStatus, claimable, duplicates, staleClaims: stale } = out;
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
