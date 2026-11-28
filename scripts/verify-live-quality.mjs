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
import { spawnSync } from "node:child_process";
import path from "node:path";
import { google } from "googleapis";
import { makeYoutube } from "./lib/youtube-quota.mjs";
import { findFfmpeg } from "./lib/ffmpeg.mjs";
import { isTeaserKey } from "./lib/teaser-keys.mjs";

const daysArg = Number(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 14);
const root = path.join(import.meta.dirname, "..");
const ledgerPath = path.join(root, "src", "suckhoe", "published-long.json");
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const thumbSyncPath = path.join(root, "src", "suckhoe", "thumb-sync.json");
const thumbSync = existsSync(thumbSyncPath)
  ? JSON.parse(readFileSync(thumbSyncPath, "utf8"))
  : {};
const deleteQueuePath = path.join(root, "src", "suckhoe", "pending-delete.json");

const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping verify-live-quality: YouTube credentials not set.");
  process.exit(0);
}
const youtube = makeYoutube();

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
let ledgerChangedFlag = false;

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

  // 4. Live thumbnail must look like horror, not a random bright frame —
  // a sunny sheep pasture was live as tap-03's thumbnail 2026-11-14.
  // Measure the served maxres frame's mean luma; daylight-bright thumbs
  // get flagged pending so the composed horror thumb replaces them.
  // A NEAR-BLACK thumbnail on a video whose custom thumb was never pushed
  // means the video content itself rendered black (2026-11-15 tap-02
  // shipped black because the arc had scenePrompts but no sceneImages) —
  // that video cannot be repaired; enqueue it for deletion + re-render.
  if (!isTeaserKey(slug) && !entry.thumbnailPending) {
    try {
      const buf = Buffer.from(
        await (await fetch(`https://i.ytimg.com/vi/${entry.videoId}/maxresdefault.jpg`)).arrayBuffer()
      );
      if (buf.length > 5_000) {
        const probe = spawnSync(
          findFfmpeg() ?? "ffmpeg",
          ["-i", "pipe:0", "-vf", "scale=1:1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
          { input: buf, encoding: "buffer", timeout: 30_000, maxBuffer: 1 << 22 }
        );
        const luma = probe.status === 0 && probe.stdout?.length ? probe.stdout[0] : null;
        if (luma !== null && luma > 115) {
          entry.thumbnailPending = true;
          ledgerChangedFlag = true;
          issues.push(`${slug}: live thumbnail daylight-bright (luma ${luma}) — flagged pending`);
        } else if (luma !== null && luma < 20 && !thumbSync[slug]) {
          // A dark served thumbnail is NOT proof the video is black —
          // YouTube auto-picks a frame, and horror content legitimately
          // has dark frames/fades (2026-11-19: quan-tai-troi-tap-01 was
          // deleted and re-rendered over a luma-19 auto-frame while the
          // video itself had zero black segments). The rendered video's
          // own blackdetect gate is the only real check; a dark thumb
          // only means the composed horror thumb should replace the
          // auto-picked frame. Flag pending, never delete.
          entry.thumbnailPending = true;
          ledgerChangedFlag = true;
          issues.push(
            `${slug}: live thumbnail black-level (luma ${luma}) — flagged pending for composed thumb`
          );
        }
      }
    } catch (e) {
      console.warn(`${slug}: thumb luma check skipped (${e.message})`);
    }
  }

  await new Promise((r) => setTimeout(r, 400));
}

if (ledgerChangedFlag) writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");

for (const f of fixed) console.log(`FIXED ${f}`);
for (const i of issues) console.log(`ISSUE ${i}`);
if (!issues.length && !fixed.length) console.log(`Live-quality clean (${recent.length} recent uploads).`);
