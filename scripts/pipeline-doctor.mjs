// Pipeline watchdog + self-heal (PO directive 2026-10-24): runs on a
// daily cron and checks whether the long-form pipeline is actually
// delivering, not just green CI. For every finding it can fix itself,
// it fixes — everything else lands in a committed report so the state
// is visible without anyone asking.
//
// Checks performed:
//   1. Ledger-vs-YouTube: every published-long.json entry is verified
//      against the channel. Deleted/private videos get their ledger
//      entry removed, which automatically re-queues the episode on the
//      next suckhoe-long-next tick (self-heal).
//   2. Orphan uploads: channel videos whose ID is in no ledger — these
//      are uploads whose ledger commit raced and lost. They get the
//      ledger entry written so the episode is never re-uploaded.
//   3. Teaser coverage: every published narrator story episode should
//      have a `${slug}-teaser` Shorts entry. Missing teasers are built
//      (make-long-teaser.mjs) and uploaded (upload-long-teaser.mjs)
//      right here, capped per run to stay under the daily upload limit.
//   4. Queue depth: counts unpublished, ready-to-render episodes so a
//      drained queue is flagged before the channel goes silent.
//
// Usage: node scripts/pipeline-doctor.mjs
// Env: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN
//      (needs youtube.force-ssl scope — same token as uploads).
//      DOCTOR_MAX_TEASERS=N — teasers built+uploaded per run (default 3).

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import { sanityCheckAudio } from "./lib/audio-probe.mjs";

const root = path.join(import.meta.dirname, "..");
const longFormDir = path.join(root, "src", "suckhoe", "long-form");
const ledgerPath = path.join(root, "src", "suckhoe", "published-long.json");
const reportPath = path.join(root, "src", "suckhoe", "pipeline-doctor.md");
const MAX_TEASERS = Number(process.env.DOCTOR_MAX_TEASERS ?? 3);

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};

const findings = [];
const fixed = [];
const failed = [];
const ledger = existsSync(ledgerPath)
  ? JSON.parse(await readFile(ledgerPath, "utf8"))
  : {};
let ledgerDirty = false;
const deletedKeys = new Set();

// ---------- helpers ----------

const arcOf = (slug) => slug.replace(/-tap-\d+$/, "").replace(/-teaser$/, "");
const isTeaserKey = (key) => key.endsWith("-teaser");

async function listChannelVideos(youtube) {
  // All uploads on the channel (search.list forMine pages by 50).
  const ids = new Map();
  let pageToken;
  do {
    const res = await youtube.search.list({
      part: ["id", "snippet"],
      forMine: true,
      type: "video",
      maxResults: 50,
      pageToken,
    });
    for (const item of res.data.items ?? []) {
      ids.set(item.id.videoId, item.snippet.title);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return ids;
}

async function videosStatus(youtube, ids) {
  // videoId -> privacyStatus (absent = deleted/unavailable)
  const map = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const res = await youtube.videos.list({
      part: ["status", "snippet"],
      id: ids.slice(i, i + 50),
    });
    for (const v of res.data.items ?? []) {
      map.set(v.id, { privacy: v.status.privacyStatus, title: v.snippet.title, publishedAt: v.snippet.publishedAt });
    }
  }
  return map;
}

// ---------- main ----------

const lines = [];
lines.push(`# Pipeline doctor — ${new Date().toISOString().slice(0, 10)}`);
lines.push("");

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  lines.push("YouTube credentials not set — API checks skipped, local checks only.");
  lines.push("");
}

let youtube = null;
let channelVideos = new Map();
const shelvedPath = path.join(root, "src", "suckhoe", "shelved-videos.json");
const shelvedIds = new Set(
  existsSync(shelvedPath)
    ? JSON.parse(await readFile(shelvedPath, "utf8")).map((v) => v.videoId ?? v)
    : []
);
if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  youtube = google.youtube({ version: "v3", auth: oauth2Client });
}

// -- Check 1+2: ledger <-> channel reconciliation ---------------------
if (youtube) {
  try {
    channelVideos = await listChannelVideos(youtube);
    const ledgerIds = Object.entries(ledger)
      .filter(([, v]) => v?.videoId)
      .map(([k, v]) => v.videoId);
    const status = await videosStatus(youtube, [...ledgerIds]);

    // Ledger entries whose video is gone or no longer public.
    for (const [key, entry] of Object.entries(ledger)) {
      if (!entry?.videoId) continue;
      const s = status.get(entry.videoId);
      if (!s) {
        findings.push(`Ledger "${key}" -> ${entry.videoId} no longer exists on channel.`);
        if (!isTeaserKey(key)) {
          delete ledger[key];
          deletedKeys.add(key);
          ledgerDirty = true;
          fixed.push(`Removed dead ledger entry "${key}" — episode re-queues on next tick.`);
        }
      } else if (s.privacy !== "public" && !isTeaserKey(key)) {
        findings.push(`Ledger "${key}" -> ${entry.videoId} is ${s.privacy}, not public.`);
        // Self-heal: episodes uploaded before the public-by-default var
        // was set are invisible until flipped. Shelved list is the only
        // place private is intentional — skip ids listed there.
        if (!shelvedIds.has(entry.videoId)) {
          try {
            await youtube.videos.update({
              part: ["status"],
              requestBody: { id: entry.videoId, status: { privacyStatus: "public" } },
            });
            fixed.push(`Flipped "${key}" (${entry.videoId}) ${s.privacy} -> public.`);
          } catch (err) {
            failed.push(`Could not flip "${key}" to public: ${err.message ?? err}`);
          }
        }
      }
    }

    // Channel videos missing from the ledger — orphans from lost
    // ledger-commit races. Only re-add ones we can confidently map:
    // long-form titles carry the arc display name but slugs do not, so
    // matching is done via the episode title prefix recorded at upload.
    const episodeFiles = (await readdir(longFormDir)).filter((f) => f.endsWith(".json"));
    const slugByTitle = new Map();
    for (const f of episodeFiles) {
      const slug = f.replace(/\.json$/, "");
      const ep = JSON.parse(await readFile(path.join(longFormDir, f), "utf8"));
      if (ep.title) slugByTitle.set(ep.title.trim(), slug);
    }
    const knownIds = new Set(Object.values(ledger).map((e) => e?.videoId).filter(Boolean));
    for (const [vid, title] of channelVideos) {
      if (knownIds.has(vid)) continue;
      const slug = slugByTitle.get(title?.trim());
      if (slug && !ledger[slug]?.videoId) {
        ledger[slug] = {
          videoId: vid,
          publishedAt: new Date().toISOString(),
          recoveredByDoctor: true,
        };
        ledgerDirty = true;
        fixed.push(`Recovered orphan upload ${vid} -> ledger["${slug}"] (was uploaded but never recorded).`);
      }
    }
  } catch (err) {
    failed.push(`Channel reconciliation failed: ${err.message ?? err}`);
  }
}

// -- Check 3: teaser coverage ------------------------------------------
// Every published story episode gets a Shorts teaser pointing back at
// it — the Shorts feed is the only discovery surface that still works
// for a low-authority channel.
const teaserCandidates = Object.entries(ledger)
  .filter(([k, v]) => !isTeaserKey(k) && v?.videoId)
  .filter(([slug]) => !ledger[`${slug}-teaser`]?.videoId)
  .map(([slug]) => slug)
  .sort();

let teasersDone = 0;
for (const slug of teaserCandidates) {
  if (teasersDone >= MAX_TEASERS) {
    findings.push(`Teaser backlog: ${teaserCandidates.length - teasersDone} episodes still lack a teaser Short.`);
    break;
  }
  const epPath = path.join(longFormDir, `${slug}.json`);
  if (!existsSync(epPath)) continue;
  const ep = JSON.parse(await readFile(epPath, "utf8"));
  if (ep.locale !== "vi" || !ep.beats?.every((b) => b.speaker === "narrator")) continue;
  try {
    execFileSync("node", ["scripts/make-long-teaser.mjs", slug], { cwd: root, stdio: "inherit" });
    const uploadOut = execFileSync("node", ["scripts/upload-long-teaser.mjs", slug], {
      cwd: root,
      encoding: "utf8",
      env: process.env,
    });
    if (uploadOut.includes("https://youtube.com/watch?v=")) {
      teasersDone++;
      fixed.push(`Built + uploaded teaser for "${slug}".`);
      ledgerDirty = true; // upload-long-teaser writes the ledger file itself
    } else {
      findings.push(`Teaser "${slug}" built but upload skipped (${uploadOut.trim().split("\n").pop()}).`);
      break; // no creds on this machine — the rest would skip the same way
    }
  } catch (err) {
    failed.push(`Teaser for "${slug}" failed: ${String(err.message ?? err).slice(0, 200)}`);
  }
}
// Re-read ledger after teaser uploads (they wrote to the file).
const freshLedger = existsSync(ledgerPath)
  ? JSON.parse(await readFile(ledgerPath, "utf8"))
  : ledger;
Object.assign(ledger, freshLedger);
for (const k of deletedKeys) delete ledger[k];

// -- Check 4: queue depth ----------------------------------------------
const files = (await readdir(longFormDir)).filter((f) => f.endsWith(".json")).sort();
let readyCount = 0;
const notReady = [];
for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  if (ledger[slug]?.videoId) continue;
  const ep = JSON.parse(await readFile(path.join(longFormDir, f), "utf8"));
  if (!ep.beats?.every((b) => b.speaker === "narrator")) continue;
  const ok = ep.beats.every((_, i) =>
    sanityCheckAudio(path.join(root, "public", "audio", "suckhoe-long", slug, `beat-${i}.mp3`)).ok
  );
  if (ok) readyCount++;
  else notReady.push(slug);
}
lines.push(`## Queue`);
lines.push("");
lines.push(`Ready unpublished episodes: ${readyCount}`);
if (notReady.length) {
  findings.push(`${notReady.length} episodes held on incomplete audio: ${notReady.join(", ")}`);
}
if (readyCount < 5) {
  findings.push(`Queue below one full arc (${readyCount}/5 ready) — write the next arc before the channel goes quiet.`);
}
lines.push("");

// -- Report -------------------------------------------------------------
lines.push(`## Findings`);
lines.push("");
if (!findings.length && !failed.length) lines.push("None — pipeline healthy.");
for (const f of findings) lines.push(`- ${f}`);
for (const f of failed) lines.push(`- FAILED: ${f}`);
lines.push("");
lines.push(`## Actions taken`);
lines.push("");
if (!fixed.length) lines.push("None needed.");
for (const f of fixed) lines.push(`- ${f}`);
lines.push("");

const report = lines.join("\n");
console.log(report);
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report + "\n");

if (ledgerDirty) {
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  console.log("Ledger updated.");
}

// Nonzero exit only when a fix attempt itself failed — plain findings
// keep the job green so cron emails don't fire on informational notes.
if (failed.length) {
  console.error(`${failed.length} fix attempt(s) failed.`);
  process.exit(1);
}
