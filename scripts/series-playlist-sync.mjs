#!/usr/bin/env node
// Series playlist sync: audit 2026-11-06 priority 3 - every published
// arc gets its own public playlist ("TRỌN BỘ <ARC> | Truyện Ma Dài Kỳ")
// containing its long-form episodes in order, so Shorts viewers have a
// clear path into the full story instead of a dead end.
//
// Idempotent: creates a playlist only the first time an arc has a
// published episode, inserts only videos not already in the list.
// Playlist IDs persist in src/suckhoe/series-playlists.json (committed
// by the calling workflow step).
//
// Usage: node scripts/series-playlist-sync.mjs
//   (needs YOUTUBE_CLIENT_ID/SECRET + YOUTUBE_REFRESH_TOKEN)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MAP_FILE = path.join(ROOT, "src/suckhoe/series-playlists.json");
const LEDGER = path.join(ROOT, "src/suckhoe/published-long.json");

const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}

const auth = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth });

const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};

// Group published long-form episodes by arc (skip teasers).
const arcs = {};
for (const [key, v] of Object.entries(ledger)) {
  if (!v?.videoId || key.endsWith("-teaser")) continue;
  const m = key.match(/^(.+)-tap-(\d+)$/);
  if (!m) continue;
  (arcs[m[1]] ??= []).push({ ep: Number(m[2]), videoId: v.videoId });
}

let changed = false;
for (const [arc, eps] of Object.entries(arcs)) {
  eps.sort((a, b) => a.ep - b.ep);
  let playlistId = map[arc]?.playlistId;
  if (!playlistId) {
    const arcTitle = (() => {
      try {
        const ep = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/long-form", `${arc}-tap-01.json`), "utf8"));
        return ep.arcTitle || arc.toUpperCase();
      } catch { return arc.toUpperCase(); }
    })();
    const res = await youtube.playlists.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: `TRỌN BỘ ${arcTitle} | Truyện Ma Dài Kỳ`,
          description: `Nghe trọn bộ ${eps.length} tập truyện ma "${arcTitle}" - Bà Tư kể. #truyenma #kechuyen`,
        },
        status: { privacyStatus: "public" },
      },
    });
    playlistId = res.data.id;
    map[arc] = { playlistId };
    changed = true;
    console.log(`created playlist for ${arc}: ${playlistId}`);
  }

  const existing = new Set();
  let pageToken;
  do {
    const list = await youtube.playlistItems.list({
      part: ["contentDetails"], playlistId, maxResults: 50, pageToken,
    });
    for (const it of list.data.items || []) existing.add(it.contentDetails.videoId);
    pageToken = list.data.nextPageToken;
  } while (pageToken);

  for (const { videoId } of eps) {
    if (existing.has(videoId)) continue;
    await youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: { snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } } },
    });
    console.log(`  + ${videoId} -> ${arc}`);
    changed = true;
  }
}

if (changed) writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + "\n");
console.log(changed ? "series playlists synced" : "series playlists already in sync");
