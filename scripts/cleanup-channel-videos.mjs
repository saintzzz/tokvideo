import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

// One-shot channel purge (owner decision 2026-09-28): remove every video
// on the channel that does NOT belong to the new story-series direction —
// old remedy uploads, low-view leftovers, everything. Driven by
// src/suckhoe/pending-cleanup.json; publish-next-suckhoe.mjs invokes this
// before its normal publish work so the flag file doubles as a resumable
// progress marker (YouTube's 10k/day quota fits ~180 deletes max).
//
// Usage: node scripts/cleanup-channel-videos.mjs --locale=vi|en
// Credentials come from the same env as upload-youtube.mjs (the caller
// passes the locale's token through).
//
// KEEP LIST: a video survives only if its videoId is recorded in
// published.json under an episode slug that still exists in
// src/suckhoe/episodes/ (i.e. a current story episode). Everything else
// is deleted. Every deletion is stamped onto that video's published.json
// entry (deletedAt) — the publish workflow already commits that file, so
// the repo keeps a persistent audit trail and the video can never be
// re-queued by accident.

const localeArg = process.argv.find((a) => a.startsWith("--locale="));
const locale = localeArg ? localeArg.split("=")[1] : "vi";

const root = path.join(import.meta.dirname, "..");
const episodesDir = path.join(root, "src", "suckhoe", "episodes");
const publishedPath = path.join(root, "src", "suckhoe", "published.json");

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("Cleanup skipped: YouTube credentials not set.");
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// Keep set: videoIds belonging to CURRENT episode files only.
const episodeFiles = (await readdir(episodesDir)).filter((f) => f.endsWith(".json"));
const currentSlugs = new Set(
  await Promise.all(
    episodeFiles.map(
      async (f) => JSON.parse(await readFile(path.join(episodesDir, f), "utf8")).slug
    )
  )
);
const published = Object.fromEntries(
  Object.entries(JSON.parse(await readFile(publishedPath, "utf8"))).map(([k, v]) => [
    k,
    typeof v === "string" ? { publishedAt: v } : v,
  ])
);
const keepIds = new Set(
  Object.entries(published)
    .filter(([slug, v]) => currentSlugs.has(slug) && v?.videoId && !v.deletedAt)
    .map(([, v]) => v.videoId)
);
// videoId -> slug, for stamping the audit trail back onto published.json
const slugByVideoId = new Map(
  Object.entries(published).filter(([, v]) => v?.videoId).map(([s, v]) => [v.videoId, s])
);
console.log(`Keep list: ${keepIds.size} video(s) tied to current story episodes.`);

// Enumerate every upload on the channel via the uploads playlist.
const channel = await youtube.channels.list({ part: ["contentDetails"], mine: true });
const uploadsPlaylist = channel.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
if (!uploadsPlaylist) {
  console.error("Could not resolve the channel's uploads playlist — aborting, nothing deleted.");
  process.exit(1);
}

const allVideos = [];
let pageToken;
do {
  const page = await youtube.playlistItems.list({
    part: ["contentDetails", "snippet"],
    playlistId: uploadsPlaylist,
    maxResults: 50,
    pageToken,
  });
  for (const item of page.data.items ?? []) {
    const id = item.contentDetails?.videoId;
    if (id) allVideos.push({ id, title: item.snippet?.title ?? "" });
  }
  pageToken = page.data.nextPageToken;
} while (pageToken);

console.log(`Channel has ${allVideos.length} video(s).`);

// Skip videos whose published.json entry is already stamped deletedAt —
// the uploads playlist only returns live videos anyway, but entries can
// outlive the videos they point at.
const alreadyDeletedIds = new Set(
  Object.values(published).filter((v) => v?.deletedAt && v?.videoId).map((v) => v.videoId)
);

let deleted = 0;
let kept = 0;
let failed = 0;
let quotaHit = false;
for (const video of allVideos) {
  if (keepIds.has(video.id) || alreadyDeletedIds.has(video.id)) {
    kept++;
    continue;
  }
  try {
    await youtube.videos.delete({ id: video.id });
    deleted++;
    const slug = slugByVideoId.get(video.id);
    if (slug) {
      published[slug] = { ...published[slug], deletedAt: new Date().toISOString() };
    }
    console.log(`Deleted: ${video.title.slice(0, 70)} (${video.id}${slug ? `, slug ${slug}` : ""})`);
  } catch (err) {
    const reason = err?.errors?.[0]?.reason ?? "";
    if (/quotaExceeded|dailyLimitExceeded/i.test(reason)) {
      console.error(`Quota exhausted after ${deleted} deletions — next publish tick continues.`);
      quotaHit = true;
      break;
    }
    failed++;
    console.error(`Failed to delete ${video.id}: ${err?.message ?? err}`);
  }
}

await writeFile(publishedPath, JSON.stringify(published, null, 2) + "\n");
console.log(`Cleanup: ${deleted} deleted, ${kept} kept, ${failed} failed${quotaHit ? " (quota — will resume)" : ""}.`);

// The flag file deliberately stays in the repo as a permanent guard:
// each publish tick re-sweeps so any stray non-story upload that ever
// lands on the channel gets removed. Every run is idempotent — deleted
// videos simply never reappear in the uploads listing. Do NOT write to
// the flag file here: the workflow only stages published.json, and a
// dirty working tree breaks its `git pull --rebase` at the end.
