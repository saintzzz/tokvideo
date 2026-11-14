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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Freshly created playlists 404 on playlistItems.list for a few seconds
// while they propagate — retry through it, and treat a persistent 404 as
// "no items" so one stale id can't kill the whole sync (2026-11-14 crash).
async function listItems(playlistId) {
  const items = [];
  let pageToken;
  for (let attempt = 0; ; attempt++) {
    try {
      do {
        const list = await youtube.playlistItems.list({
          part: ["contentDetails"], playlistId, maxResults: 50, pageToken,
        });
        items.push(...(list.data.items ?? []));
        pageToken = list.data.nextPageToken;
      } while (pageToken);
      return items;
    } catch (e) {
      const nf = e.code === 404 || e.errors?.[0]?.reason === "playlistNotFound";
      if (!nf || attempt >= 4) { if (nf) return []; throw e; }
      await sleep(2000 * (attempt + 1));
    }
  }
}

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

const arcTitleFor = (arc) => {
  try {
    const ep = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/long-form", `${arc}-tap-01.json`), "utf8"));
    return ep.arcTitle || arc.toUpperCase();
  } catch { return arc.toUpperCase(); }
};

// ---- Dedupe + adopt existing playlists ------------------------------------
// 2026-11-13 incident: the map file was never committed (a dead git-add
// pathspec), so every watchdog run saw an empty map and created a fresh
// playlist per arc — the channel accumulated dozens of duplicates.
// List ALL channel playlists once: adopt the best playlist per arc into
// the map, merge stray items into it, delete the extras.
const channelPlaylists = [];
{
  let pageToken;
  do {
    const res = await youtube.playlists.list({
      part: ["snippet", "contentDetails"], mine: true, maxResults: 50, pageToken,
    });
    channelPlaylists.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
}
const byId = new Map(channelPlaylists.map(p => [p.id, p]));
let changed = false;
for (const arc of Object.keys(arcs)) {
  const wantTitle = `TRỌN BỘ ${arcTitleFor(arc)} | Truyện Ma Dài Kỳ`;
  const mapped = map[arc]?.playlistId;
  // Candidates: the mapped playlist (if still alive) + every playlist
  // sharing this arc's canonical title.
  const cands = new Map();
  if (mapped && byId.has(mapped)) cands.set(mapped, byId.get(mapped));
  for (const p of channelPlaylists) {
    if (p.snippet?.title === wantTitle) cands.set(p.id, p);
  }
  if (!cands.size) continue; // nothing to adopt — create fresh below
  // Keep the one holding the most items; tie-break to the mapped id.
  const ranked = [...cands.values()].sort((a, b) =>
    (b.contentDetails?.itemCount ?? 0) - (a.contentDetails?.itemCount ?? 0)
    || (a.id === mapped ? -1 : 1));
  const keeper = ranked[0];
  if (map[arc]?.playlistId !== keeper.id) {
    map[arc] = { playlistId: keeper.id };
    changed = true;
    console.log(`adopted playlist for ${arc}: ${keeper.id} (${keeper.contentDetails?.itemCount ?? 0} items)`);
  }
  // Merge items from duplicate playlists into the keeper, then delete.
  for (const dupe of ranked.slice(1)) {
    for (const it of await listItems(dupe.id)) {
      await youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: { snippet: { playlistId: keeper.id, resourceId: it.contentDetails.resourceId } },
      }).catch(e => console.warn(`  merge ${it.contentDetails?.videoId} failed: ${e.message?.slice(0, 80)}`));
    }
    await youtube.playlists.delete({ id: dupe.id })
      .catch(e => console.warn(`  delete ${dupe.id} failed: ${e.message?.slice(0, 80)}`));
    channelPlaylists.splice(channelPlaylists.indexOf(dupe), 1);
    changed = true;
    console.log(`deleted duplicate playlist ${dupe.id} (${arc})`);
  }
}

for (const [arc, eps] of Object.entries(arcs)) {
  eps.sort((a, b) => a.ep - b.ep);
  let playlistId = map[arc]?.playlistId;
  if (!playlistId || !byId.has(playlistId)) {
    const arcTitle = arcTitleFor(arc);
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
    byId.set(playlistId, res.data);
    map[arc] = { playlistId };
    changed = true;
    console.log(`created playlist for ${arc}: ${playlistId}`);
  }

  const existing = new Set((await listItems(playlistId)).map(it => it.contentDetails.videoId));

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
