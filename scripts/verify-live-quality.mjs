// Post-upload quality gate (PRD-grade: 2026-11-14 shipped 3 defective
// videos that CI reported green — wrong-footage, dead links, junk tags).
// Checks LIVE metadata against the episode source of truth and repairs
// what it safely can:
//
//   - dead youtu.be links inside descriptions (prev/next link rot)
//   - unrelated tags (channel default-set leaked in via manual upload)
//   - thumbnailPending entries (surfaced; fix-thumbnails.mjs repairs)
//
// What it cannot verify: whether b-roll footage matches the story —
// that is enforced at fetch time in fetch-scene-footage.mjs.
//
// Usage: node scripts/verify-live-quality.mjs [--days=14]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const daysArg = Number(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 14);
const root = path.join(import.meta.dirname, "..");
const ledgerPath = path.join(root, "src", "suckhoe", "published-long.json");
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));

const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping verify-live-quality: YouTube credentials not set.");
  process.exit(0);
}
const auth = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth });

// Domain tags a horror-story video must carry at least one of; junk
// uploads leaked generic defaults ("camping", "fishing", "Proenneke").
const REQUIRED_TAG_RE = /ma|truyện|truyen|chuyện|kể|bà tư|ma quê|horror|ghost|khăn|mộ|làng|vong|bùa/i;
const JUNK_TAG_RE = /camping|fishing|proenneke|wilderness|lake clark|twin lakes|trout|minecraft|fortnite|vlog|reaction/i;

const epTagsFor = (slug) => {
  const f = path.join(root, "src", "suckhoe", "long-form", `${slug}.json`);
  if (!existsSync(f)) return null;
  try {
    const ep = JSON.parse(readFileSync(f, "utf8"));
    return Array.isArray(ep.tags) && ep.tags.length ? ep.tags : null;
  } catch { return null; }
};

const cutoff = Date.now() - daysArg * 86400e3;
const recent = Object.entries(ledger).filter(([slug, e]) => {
  if (!e?.videoId) return false;
  const ts = e.publishedAt ? Date.parse(e.publishedAt) : 0;
  return !ts || ts >= cutoff; // entries without a date still get checked
});

const issues = [];
const fixed = [];

for (const [slug, entry] of recent) {
  const list = await youtube.videos.list({ part: ["snippet", "status"], id: [entry.videoId] });
  const v = list.data.items?.[0];
  if (!v) { issues.push(`${slug}: video ${entry.videoId} gone from API`); continue; }
  const { snippet } = v;

  // 1. Dead links in the description (prev/next pointers to deleted ids)
  const linkIds = [...snippet.description.matchAll(/youtu\.be\/([\w-]{11})/g)].map((m) => m[1]);
  if (linkIds.length) {
    const chk = await youtube.videos.list({ part: ["status"], id: linkIds });
    const alive = new Set(chk.data.items.map((i) => i.id));
    const dead = linkIds.filter((id) => !alive.has(id));
    if (dead.length) {
      const clean = snippet.description
        .split("\n")
        .filter((line) => !dead.some((id) => line.includes(id)))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trimEnd();
      try {
        await youtube.videos.update({
          part: ["snippet"],
          requestBody: { id: entry.videoId, snippet: { ...snippet, description: clean } },
        });
        fixed.push(`${slug}: removed dead desc links (${dead.join(",")})`);
      } catch (e) {
        issues.push(`${slug}: dead desc links ${dead.join(",")} — repair failed: ${e.message}`);
      }
    }
  }

  // 2. Tag sanity: must contain >=1 domain tag and zero junk tags
  const tags = snippet.tags ?? [];
  const junk = tags.filter((t) => JUNK_TAG_RE.test(t));
  const hasDomain = tags.some((t) => REQUIRED_TAG_RE.test(t));
  if (junk.length || !hasDomain) {
    const good = epTagsFor(slug) ?? ["truyện ma", "truyện ma có thật", "kể chuyện ma", "ma quê", "bà tư kể chuyện", "truyện ma dân gian"];
    try {
      await youtube.videos.update({
        part: ["snippet"],
        requestBody: { id: entry.videoId, snippet: { ...snippet, tags: good } },
      });
      fixed.push(`${slug}: tags repaired (had ${JSON.stringify(tags.slice(0, 4))}…)`);
    } catch (e) {
      issues.push(`${slug}: bad tags ${JSON.stringify(tags.slice(0, 5))} — repair failed: ${e.message}`);
    }
  }

  // 3. Surface pending thumbnails (fix-thumbnails applies the image)
  if (entry.thumbnailPending) issues.push(`${slug}: thumbnailPending — watchdog sweep will retry`);

  await new Promise((r) => setTimeout(r, 400));
}

for (const f of fixed) console.log(`FIXED ${f}`);
for (const i of issues) console.log(`ISSUE ${i}`);
if (!issues.length && !fixed.length) console.log(`Live-quality clean (${recent.length} recent uploads).`);
