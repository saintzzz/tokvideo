#!/usr/bin/env node
// Pushes local thumb.jpg to the live long-form video when the file's
// md5 differs from what was last pushed (state in
// src/suckhoe/thumb-sync.json). Repairs the identical-thumbnail bug
// where a whole arc shared one ARC_SUBJECT image - regenerated thumbs
// get synced to YouTube automatically in the watchdog job.
//
// Usage: node scripts/fix-thumbnails.mjs

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const STATE = path.join(ROOT, "src/suckhoe/thumb-sync.json");
const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}
const auth = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth });

const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
let changed = false;

for (const [slug, entry] of Object.entries(ledger)) {
  if (slug.endsWith("-teaser") || !entry?.videoId) continue;
  const thumb = path.join(ROOT, "public/images/suckhoe-long", slug, "thumb.jpg");
  if (!existsSync(thumb)) continue;
  const md5 = createHash("md5").update(readFileSync(thumb)).digest("hex");
  if (state[slug] === md5) continue;
  try {
    await youtube.thumbnails.set({
      videoId: entry.videoId,
      media: { mimeType: "image/jpeg", body: readFileSync(thumb) },
    });
    state[slug] = md5;
    changed = true;
    console.log(`${slug}: thumbnail pushed to ${entry.videoId}`);
  } catch (e) {
    console.warn(`${slug}: thumb set failed - ${e.message}`);
  }
}
if (changed) writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
console.log("thumbnail sync done");
