// Trend radar (PRD M-03): watches what's currently landing in the home-
// remedy / wellness niche on YouTube so the writer rides real demand
// instead of guessing. Queries the public search API per seed keyword,
// keeps recent + high-view results, and writes src/suckhoe/trend-radar.md
// for the daily-content-writer prompt to read.
//
// Read-only API usage. Exits 0 quietly when creds are missing.
// Usage: node scripts/trend-radar.mjs --locale=vi|en

import { google } from "googleapis";
import { writeFileSync } from "node:fs";
import path from "node:path";

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const locale = arg("locale") ?? "vi";

const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } = process.env;
const REFRESH_TOKEN =
  locale === "en" ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN;

if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log(`Skipping trend radar (${locale}): YouTube env vars not set.`);
  process.exit(0);
}

const SEEDS = {
  vi: [
    "mẹo dân gian sức khỏe",
    "khó ngủ mẹo hay",
    "ho cảm dân gian",
    "mật ong gừng",
    "đau nhức mỏi mẹo",
  ],
  en: [
    "grandma home remedies",
    "natural sleep remedy",
    "sore throat home remedy",
    "honey ginger remedy",
    "old fashioned remedies",
  ],
};

const oauth2 = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2 });

const since = new Date();
since.setDate(since.getDate() - 30);

const found = [];
for (const q of SEEDS[locale] ?? SEEDS.vi) {
  const res = await youtube.search.list({
    part: ["id", "snippet"],
    q,
    type: "video",
    order: "viewCount",
    publishedAfter: since.toISOString(),
    maxResults: 8,
    relevanceLanguage: locale,
  });
  const ids = (res.data.items ?? []).map((i) => i.id?.videoId).filter(Boolean);
  if (!ids.length) continue;
  const stats = await youtube.videos.list({ part: ["statistics", "snippet"], id: ids });
  for (const v of stats.data.items ?? []) {
    found.push({
      seed: q,
      title: v.snippet?.title,
      channel: v.snippet?.channelTitle,
      views: +(v.statistics?.viewCount ?? 0),
      published: (v.snippet?.publishedAt ?? "").slice(0, 10),
      url: `https://youtu.be/${v.id}`,
    });
  }
}

found.sort((a, b) => b.views - a.views);
const top = found.slice(0, 20);

const md = [
  "# Trend radar",
  "",
  `Locale: ${locale} · Generated: ${new Date().toISOString()}`,
  `Window: last 30 days · seeds: ${(SEEDS[locale] ?? SEEDS.vi).join(", ")}`,
  "",
  "| Views | Title | Channel | Published |",
  "|---|---|---|---|",
  ...top.map((t) => `| ${t.views} | ${t.title} | ${t.channel} | ${t.published} |`),
  "",
  "Writer guidance: look for recurring ingredient/topic patterns in the",
  "rows above; do NOT copy titles verbatim — extract the demand signal.",
  "",
].join("\n");

const out = path.join(import.meta.dirname, "..", "src", "suckhoe", `trend-radar-${locale}.md`);
writeFileSync(out, md);
console.log(`Wrote ${top.length} trending results to ${out}`);
