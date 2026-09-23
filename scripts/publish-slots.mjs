// Publish-slot learning (PRD M-05): instead of a fixed cron cadence,
// bucket historical publishes by hour-of-day and correlate with the
// views reported in channel-report-<locale>.md, then recommend the
// best-performing slots.
//
// Data sources (all offline):
//   src/suckhoe/published.json         — slug -> {publishedAt} (UTC ISO)
//   src/suckhoe/channel-report-*.md    — | Title | Views | ... | Published |
// publishedAt is precise (ISO timestamp) while the report table's date is
// day-granularity, so views are joined by title match.
//
// Output: src/suckhoe/publish-slots.json + printed recommendation.
// publish-next-suckhoe.mjs reads this file when picking its slot.
//
// Usage: node scripts/publish-slots.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const shDir = path.join(root, "src", "suckhoe");

const published = JSON.parse(readFileSync(path.join(shDir, "published.json"), "utf8"));

// hour buckets 0-23 in the channel's likely audience TZ. The channels
// target VN + US audiences; keep UTC and let the reader convert — CI runs
// in UTC anyway.
const buckets = new Map(); // hour -> {views, n}
const viewByTitle = new Map();
for (const locale of ["vi", "en"]) {
  const f = path.join(shDir, `channel-report-${locale}.md`);
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\|(.+)\|\s*(\d+)\s*\|/);
    if (m && m[1].trim() !== "Title") viewByTitle.set(m[1].trim().toLowerCase(), +m[2]);
  }
}

// published.json doesn't store titles — join via episode channelTitle.
const epDir = path.join(shDir, "episodes");
import { readdirSync } from "node:fs";
const titleBySlug = new Map();
for (const f of readdirSync(epDir).filter((f) => f.endsWith(".json"))) {
  try {
    const ep = JSON.parse(readFileSync(path.join(epDir, f), "utf8"));
    if (ep?.slug && ep.channelTitle) titleBySlug.set(ep.slug, ep.channelTitle.toLowerCase());
  } catch {}
}

let joined = 0;
for (const [slug, val] of Object.entries(published)) {
  const iso = typeof val === "object" ? val?.publishedAt : null;
  if (!iso) continue;
  const ct = titleBySlug.get(slug);
  if (!ct) continue;
  // find report row whose title starts with the channelTitle
  let views;
  for (const [t, v] of viewByTitle) if (t.startsWith(ct)) { views = v; break; }
  if (views === undefined) continue;
  joined++;
  const hour = new Date(iso).getUTCHours();
  const b = buckets.get(hour) ?? { views: 0, n: 0 };
  b.views += views;
  b.n++;
  buckets.set(hour, b);
}

const ranked = [...buckets.entries()]
  .map(([hour, b]) => ({ hourUTC: hour, publishes: b.n, avgViews: Math.round(b.views / b.n) }))
  .sort((a, b) => b.avgViews - a.avgViews);

const recommendation = {
  generatedAt: new Date().toISOString(),
  samples: joined,
  note: joined < 8 ? "too little joined data — keep the current fixed cadence" : "data-driven",
  slotsUTC: ranked.slice(0, 3).map((r) => r.hourUTC),
  buckets: ranked,
};

writeFileSync(path.join(shDir, "publish-slots.json"), JSON.stringify(recommendation, null, 2));
console.log(`Joined ${joined} publishes to report views.`);
console.log(`Recommended UTC slots: ${recommendation.slotsUTC.join(", ") || "(none — insufficient data)"}`);
