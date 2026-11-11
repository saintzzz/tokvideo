#!/usr/bin/env node
// Weekly channel self-evaluation + self-adjustment loop.
//
// Every Sunday 20:00 VN (13:00 UTC) this job:
//   1. Pulls per-video stats via the Data API (videos.list works with
//      the existing youtube.readonly-ish scope - no Analytics scope
//      needed, which is why channel-report fails but this does not).
//   2. Maps videoIds to episodes via the long-form ledger, aggregates
//      per-arc performance (avg views/likes/comments, teaser->long
//      conversion proxy).
//   3. Compares against last week's snapshot (trend arrows).
//   4. Writes src/suckhoe/strategy-directives.json - machine-readable
//      steering that queue-refill.mjs feeds straight into the writer
//      prompt (winning motifs get pushed, losers get avoided).
//   5. Writes src/suckhoe/channel-review.md - the human report.
//
// Auto-actions (bounded, safe): motif steering only. Anything bigger
// (cadence, deletion) is written into the report as a recommendation.
//
// Usage: node scripts/channel-review-weekly.mjs

import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "src", "suckhoe");
const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}
const auth = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth });

const ledger = JSON.parse(await readFile(path.join(DIR, "published-long.json"), "utf8"));
const idToKey = {};
for (const [k, v] of Object.entries(ledger)) if (v?.videoId) idToKey[v.videoId] = k;

// Fetch stats for every ledger videoId (videos.list = 1 unit / 50 ids).
const ids = Object.keys(idToKey);
const stats = {};
for (let i = 0; i < ids.length; i += 50) {
  const r = await youtube.videos.list({ part: ["statistics", "snippet"], id: ids.slice(i, i + 50) });
  for (const v of r.data.items || []) stats[v.id] = v;
}

const arcOf = (k) => k.replace(/-teaser$/, "").replace(/-tap-\d+$/, "");
const num = (x) => parseInt(x ?? "0", 10);

const arcs = {};
for (const [id, v] of Object.entries(stats)) {
  const key = idToKey[id];
  if (!key) continue;
  const arc = arcOf(key);
  (arcs[arc] ??= { long: [], teaser: [] });
  const s = { views: num(v.statistics.viewCount), likes: num(v.statistics.likeCount), comments: num(v.statistics.commentCount), publishedAt: v.snippet.publishedAt, key };
  arcs[arc][key.endsWith("-teaser") ? "teaser" : "long"].push(s);
}

const avg = (arr, f) => (arr.length ? (arr.reduce((a, b) => a + f(b), 0) / arr.length) : 0);
const week = new Date().toISOString().slice(0, 10);

// Previous snapshot for trend.
const snapDir = path.join(DIR, "weekly-review");
await mkdir(snapDir, { recursive: true });
const snaps = existsSync(snapDir) ? (await import("node:fs")).readdirSync(snapDir).filter(f => f.endsWith(".json")).sort() : [];
const prev = snaps.length ? JSON.parse(await readFile(path.join(snapDir, snaps[snaps.length - 1]), "utf8")) : null;

// Directives: rank arcs by teaser views (the discovery engine) and long
// views; push top motifs, flag dead ones.
const ranking = Object.entries(arcs)
  .map(([arc, d]) => ({
    arc,
    teaserViews: avg(d.teaser, s => s.views),
    longViews: avg(d.long, s => s.views),
    teaserLikes: avg(d.teaser, s => s.likes),
    longComments: avg(d.long, s => s.comments),
    episodes: d.long.length,
  }))
  .sort((a, b) => b.teaserViews - a.teaserViews);

const prevRank = prev?.ranking ?? [];
const trend = (arc, f) => {
  const p = prevRank.find(r => r.arc === arc);
  return p ? (f > p[f === undefined ? "teaserViews" : "teaserViews"] ? "↑" : f < p.teaserViews ? "↓" : "→") : "new";
};

// ---- Market scan -------------------------------------------------------
// What the wider VN horror market is doing right now, so motif steering
// isn't only navel-gazing at our own (still small) sample. Two cheap
// calls, both fine with the existing token scope:
//   - search.list q="truyện ma" order=viewCount over the last 21 days
//     (~100 units) — the current horror meta on VN YouTube.
//   - videos.list chart=mostPopular regionCode=VN (1 unit) — sanity
//     check whether horror even charts this week.
// Extracts which of our motif keywords show up in winning titles and
// feeds them to the writer as `motifHints`.
const MOTIF_LEXICON = [
  "miếu", "giếng", "nghĩa trang", "mộ", "cây đa", "cầu", "sông", "rạch",
  "đêm rằm", "mùng một", "lễ", "thầy", "bùa", "vong", "oan", "trả nợ",
  "chết đuối", "thay ma", "khám liệm", "hũ", "gà", "làng", "rẫy", "rừng",
  "dây", "bóng", "gọi tên", "đò đêm", "quan tài", "nợ máu", "địa ngục",
];
let marketTop = [];
let motifHints = [];
try {
  const since = new Date(Date.now() - 21 * 86400e3).toISOString();
  const search = await youtube.search.list({
    part: ["id"],
    q: "truyện ma",
    type: ["video"],
    order: "viewCount",
    publishedAfter: since,
    maxResults: 25,
    regionCode: "VN",
    relevanceLanguage: "vi",
  });
  const hitIds = (search.data.items ?? []).map(i => i.id.videoId).filter(Boolean);
  if (hitIds.length) {
    const r = await youtube.videos.list({ part: ["snippet", "statistics"], id: hitIds });
    marketTop = (r.data.items ?? [])
      .map(v => ({
        title: v.snippet.title,
        views: num(v.statistics.viewCount),
        channel: v.snippet.channelTitle,
        publishedAt: v.snippet.publishedAt?.slice(0, 10),
      }))
      .sort((a, b) => b.views - a.views);
    const counts = {};
    for (const t of marketTop) {
      const low = t.title.toLowerCase();
      for (const kw of MOTIF_LEXICON) if (low.includes(kw)) counts[kw] = (counts[kw] ?? 0) + 1;
    }
    motifHints = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([kw]) => kw);
  }
} catch (err) {
  console.warn(`market scan failed (non-fatal): ${err.message ?? err}`);
}

const directives = {
  generatedAt: new Date().toISOString(),
  preferMotifs: ranking.slice(0, 3).filter(r => r.teaserViews > 0).map(r => r.arc),
  avoidMotifs: ranking.filter(r => r.episodes >= 3 && r.teaserViews < 5).map(r => r.arc),
  motifHints,
  notes: [],
};
if (ranking[0]) directives.notes.push(`Top motif: ${ranking[0].arc} (${ranking[0].teaserViews.toFixed(0)} avg teaser views)`);
const dead = directives.avoidMotifs;
if (dead.length) directives.notes.push(`Avoid: ${dead.join(", ")} - teasers averaging under 5 views`);
if (motifHints.length) directives.notes.push(`Market hints (3w VN "truyện ma" meta): ${motifHints.join(", ")}`);

// Human report.
let md = `# Channel Weekly Review - ${week}\n\n`;
md += `| Arc | Episodes | Avg teaser views | Avg long views | Teaser likes | Long comments | Trend |\n|---|---|---|---|---|---|---|\n`;
for (const r of ranking) {
  const t = prev ? trend(r.arc, r.teaserViews) : "first";
  md += `| ${r.arc} | ${r.episodes} | ${r.teaserViews.toFixed(1)} | ${r.longViews.toFixed(1)} | ${r.teaserLikes.toFixed(1)} | ${r.longComments.toFixed(1)} | ${t} |\n`;
}
md += `\n## Market scan - top VN "truyện ma" videos last 21d\n\n`;
if (marketTop.length) {
  md += `| Title | Views | Channel | Published |\n|---|---|---|---|\n`;
  for (const t of marketTop.slice(0, 12)) {
    md += `| ${t.title.replace(/\|/g, "/")} | ${t.views} | ${t.channel} | ${t.publishedAt} |\n`;
  }
  md += `\nMotif signals extracted into directives.motifHints: ${motifHints.join(", ") || "none"}\n`;
} else {
  md += `(market scan unavailable this week)\n`;
}
md += `\n## Directives for next arcs\n- Prefer: ${directives.preferMotifs.join(", ") || "none yet"}\n- Avoid: ${directives.avoidMotifs.join(", ") || "none"}\n- Market hints: ${directives.motifHints.join(", ") || "none"}\n`;
md += `\nAuto-applied: motif steering into queue-refill writer prompt. Recommendations needing bigger changes are listed above for the weekly owner review.\n`;

await writeFile(path.join(snapDir, `${week}.json`), JSON.stringify({ week, ranking, directives }, null, 2) + "\n");
await writeFile(path.join(DIR, "strategy-directives.json"), JSON.stringify(directives, null, 2) + "\n");
await writeFile(path.join(DIR, "channel-review.md"), md);
console.log(md);
console.log("weekly review written");
