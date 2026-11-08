#!/usr/bin/env node
// Repairs live teaser titles damaged by the arcDisplayName bug fixed
// 2026-11-08 (titles came out as "Premise Frag | Premise Full #N
// #Shorts"). Idempotent: lists each teaser's current title, updates
// only when it differs from the intended premise-first format.
// Runs inside the watchdog job where YouTube creds live.
//
// Usage: node scripts/fix-teaser-titles.mjs

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import { arcDisplayName } from "./lib/long-metadata.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}
const auth = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth });

const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
const wanted = (episode, slug) => {
  const epNum = slug.match(/-tap-(\d+)$/)?.[1] ?? "";
  const arcName = arcDisplayName(episode, slug);
  const premise = (episode.title || "").split("|")[0].trim();
  const suffix = ` | ${arcName} #${parseInt(epNum, 10) || "?"} #Shorts`;
  return (premise.length > 100 - suffix.length ? premise.slice(0, 100 - suffix.length).replace(/\s+\S*$/, "") : premise) + suffix;
};

for (const [key, entry] of Object.entries(ledger)) {
  if (!key.endsWith("-teaser") || !entry?.videoId) continue;
  const slug = key.replace(/-teaser$/, "");
  const epFile = path.join(ROOT, "src/suckhoe/long-form", `${slug}.json`);
  if (!existsSync(epFile)) continue;
  const episode = JSON.parse(readFileSync(epFile, "utf8"));
  const target = wanted(episode, slug);
  const cur = (await youtube.videos.list({ part: ["snippet"], id: [entry.videoId] })).data.items?.[0];
  if (!cur) { console.log(`${key}: video ${entry.videoId} not found - skip`); continue; }
  if (cur.snippet.title === target) continue;
  await youtube.videos.update({
    part: ["snippet"],
    requestBody: { id: entry.videoId, snippet: { ...cur.snippet, title: target } },
  });
  console.log(`${key}: title fixed -> "${target}"`);
}
console.log("teaser title sweep done");
