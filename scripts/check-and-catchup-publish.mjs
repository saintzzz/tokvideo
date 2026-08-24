// Safety net for a real, observed problem (2026-08-24): GitHub Actions'
// `schedule` triggers can silently miss a tick — confirmed live, the VI
// channel's publish-next-suckhoe cron (03,04,08,09,14,15,16 UTC) simply
// didn't fire for its 03:00 UTC slot on 2026-08-24 (the only run near
// that time matched the UNRELATED release-shelved-suckhoe cron
// instead — GitHub's own documented behavior under load, multiple
// schedule entries close in wall-clock time can coalesce/drop). Github
// Actions' own cron has no built-in catch-up mechanism, so a genuinely
// missed tick just... doesn't happen, with nothing to notice it.
//
// This runs hourly via Windows Task Scheduler (proven far more reliable
// than GitHub's cron for the Claude-CLI jobs already on this pattern —
// see run-daily-content-writer.ps1) and checks real elapsed time since
// each locale's last recorded publish in src/suckhoe/published.json. If
// it's past a generous threshold (comfortably longer than the normal
// gap between that locale's own scheduled slots), it fires a
// workflow_dispatch for that locale's publish-next job directly via the
// GitHub API — the same action a human clicking the button in the
// Actions UI would take, just automatic.
//
// Deliberately does NOT try to be clever about "how many ticks were
// missed" — one catch-up publish gets the queue moving again, and the
// next real scheduled tick (or the next hourly check) picks up from
// there. Thresholds are generous specifically so a normal ~1-2h
// scheduling jitter never triggers this — it should only ever fire when
// something is actually stuck.

import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..");

// VI publishes ~every 3-5h (7 slots/day); EN ~every 4-6h (7 slots/day,
// spread across a different set of hours). A gap past these thresholds
// is not explainable by normal scheduling jitter alone.
// Both channels moved from 7 crons/day to 3/day, spaced 6h/6h/12h apart
// (2026-08-25, see .github/workflows/render.yml's schedule comment —
// the old 7/day *clustered* cadence coincided with a views collapse on
// both channels). Threshold needs to clear the longest legitimate gap
// (12h) with room to spare, or this safety net would fire mid-gap and
// silently recreate the over-posting problem it exists to catch.
const THRESHOLD_HOURS = { vi: 14, en: 14 };

const published = JSON.parse(
  await readFile(path.join(repoRoot, "src", "suckhoe", "published.json"), "utf8")
);

const now = Date.now();
const lastPublishByLocale = { vi: null, en: null };
for (const entry of Object.values(published)) {
  const locale = entry.locale === "en" ? "en" : "vi";
  const ts = new Date(entry.publishedAt).getTime();
  if (!lastPublishByLocale[locale] || ts > lastPublishByLocale[locale]) {
    lastPublishByLocale[locale] = ts;
  }
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN not set, cannot dispatch a catch-up publish.");
  process.exit(1);
}

const DISPATCH_INPUT = { vi: "suckhoe-publish-next", en: "suckhoe-en-publish-next" };

for (const locale of ["vi", "en"]) {
  const last = lastPublishByLocale[locale];
  const hoursSince = last ? (now - last) / (1000 * 60 * 60) : Infinity;
  console.log(
    `[${locale}] last publish: ${last ? new Date(last).toISOString() : "never"} (${hoursSince.toFixed(1)}h ago, threshold ${THRESHOLD_HOURS[locale]}h)`
  );

  if (hoursSince <= THRESHOLD_HOURS[locale]) continue;

  console.log(`[${locale}] gap exceeds threshold, dispatching catch-up publish...`);
  const res = await fetch(
    "https://api.github.com/repos/saintzzz/tokvideo/actions/workflows/render.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ ref: "main", inputs: { video: DISPATCH_INPUT[locale] } }),
    }
  );
  if (res.status === 204) {
    console.log(`[${locale}] catch-up publish dispatched successfully.`);
  } else {
    console.error(`[${locale}] dispatch failed: ${res.status} ${await res.text()}`);
  }
}
