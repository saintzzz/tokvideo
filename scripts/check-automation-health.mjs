// Automation heartbeat (R-06): verifies every Task Scheduler job wrote a
// fresh "=== Run at ... ===" line in its log within its expected window.
// Runs on the automation machine via run-health-check.ps1, which commits
// src/suckhoe/automation-health.json — so a dead machine is visible from
// anywhere (the JSON's checkedAt stops advancing, which CI also flags).
//
// Usage: node scripts/check-automation-health.mjs [--write]
//   --write also updates src/suckhoe/automation-health.json
// Exit 1 when any job is stale or its log is missing entirely.

import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const write = process.argv.includes("--write");

// task name -> { log, maxAgeHours } — windows match each task's schedule
// (daily -> 36h, 2-day -> 60h, 3-day -> 84h, hourly -> 3h) with headroom
// for StartWhenAvailable catch-up runs.
const JOBS = {
  SucKhoeDailyContentWriter: { log: "daily-content-writer.log", maxAgeHours: 36 },
  SucKhoeReplyComments: { log: "reply-comments.log", maxAgeHours: 36 },
  SucKhoeCommentOutreach: { log: "comment-outreach.log", maxAgeHours: 84 },
  AnimatedFilmEpisodeWriter: { log: "animated-episode-writer.log", maxAgeHours: 60 },
  SucKhoePublishCatchup: { log: "check-catchup-publish.log", maxAgeHours: 3 },
  AnimatedFilmPipeline: { log: "animated-film-pipeline.log", maxAgeHours: 3 },
  SucKhoeWeeklyStrategy: { log: "strategy-report.log", maxAgeHours: 200 },
};

const RUN_LINE = /=== Run at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ===/g;

const results = {};
let stale = 0;

for (const [job, cfg] of Object.entries(JOBS)) {
  const logPath = path.join(root, "scripts", cfg.log);
  let lastRun = null;
  let reason = "";
  try {
    const content = await readFile(logPath, "utf8");
    const stamps = [...content.matchAll(RUN_LINE)].map((m) => m[1]);
    if (stamps.length) {
      lastRun = new Date(stamps.at(-1).replace(" ", "T"));
    } else {
      // Log exists but has no run header — fall back to file mtime.
      lastRun = (await stat(logPath)).mtime;
      reason = "no run header, used mtime";
    }
  } catch {
    reason = "log missing";
  }

  const ageHours = lastRun ? (Date.now() - lastRun.getTime()) / 3.6e6 : Infinity;
  const isStale = ageHours > cfg.maxAgeHours;
  if (isStale) stale++;
  results[job] = {
    lastRun: lastRun?.toISOString() ?? null,
    ageHours: Number.isFinite(ageHours) ? +ageHours.toFixed(1) : null,
    maxAgeHours: cfg.maxAgeHours,
    stale: isStale,
    ...(reason ? { note: reason } : {}),
  };

  const tag = isStale ? "STALE" : "ok";
  console.log(
    `  [${tag}] ${job}: last run ${results[job].lastRun ?? "never"} (${results[job].ageHours ?? "?"}h ago, limit ${cfg.maxAgeHours}h)${reason ? ` — ${reason}` : ""}`
  );
}

const report = {
  checkedAt: new Date().toISOString(),
  staleCount: stale,
  jobs: results,
};

if (write) {
  const out = path.join(root, "src", "suckhoe", "automation-health.json");
  await writeFile(out, JSON.stringify(report, null, 2) + "\n");
  console.log(`Wrote ${out}`);
}

if (stale > 0) {
  console.error(`\n${stale} automation job(s) stale — check Task Scheduler on the content machine.`);
  process.exit(1);
}
console.log("\nAll automation jobs fresh.");
