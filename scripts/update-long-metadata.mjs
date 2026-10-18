// Retroactive metadata update for already-published long-form videos:
// keyword-first titles ("Truyện Ma Có Thật | Arc - Tập N: hook") plus
// prev/next/playlist links in descriptions — the same builder the
// uploader uses, applied to videos published before this metadata
// convention existed.
//
// Runs on CI via the update-long-metadata repository_dispatch (YouTube
// creds live in repo secrets, not on dev machines).
//
// Usage:
//   node scripts/update-long-metadata.mjs            # all ledger entries
//   node scripts/update-long-metadata.mjs <slug>...  # specific episodes
//   DRY_RUN=1 node scripts/update-long-metadata.mjs  # diff only, no writes

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";
import playlistMap from "../src/suckhoe/playlist-map.json" with { type: "json" };
import {
  longFormTitle,
  longFormDescription,
  longFormTags,
  arcBase,
} from "./lib/long-metadata.mjs";

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
const DRY_RUN = !!process.env.DRY_RUN;

const repoRoot = path.join(import.meta.dirname, "..");
const ledgerPath = path.join(repoRoot, "src", "suckhoe", "published-long.json");
const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));

const argSlugs = process.argv.slice(2);
const slugs = argSlugs.length ? argSlugs : Object.keys(ledger);

const longFormDir = path.join(repoRoot, "src", "suckhoe", "long-form");
const known = existsSync(longFormDir)
  ? (await readdir(longFormDir)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  : [];

async function loadEpisode(slug) {
  const file = path.join(longFormDir, `${slug}.json`);
  try {
    const mod = await import(pathToFileURL(file), { with: { type: "json" } });
    return mod.default;
  } catch {
    return null;
  }
}

function siblingVideoId(slug, delta) {
  const num = parseInt(slug.match(/-tap-(\d+)$/)?.[1] ?? "0", 10);
  if (!num) return null;
  const sib = `${arcBase(slug)}-tap-${String(num + delta).padStart(2, "0")}`;
  return ledger[sib]?.videoId ?? null;
}

const jobs = [];
for (const slug of slugs) {
  const entry = ledger[slug];
  if (!entry?.videoId) {
    console.log(`skip ${slug}: not in ledger`);
    continue;
  }
  const episode = await loadEpisode(slug);
  if (!episode) {
    console.log(`skip ${slug}: no episode JSON (known: ${known.length} files)`);
    continue;
  }
  if (!episode.beats.every((b) => b.speaker === "narrator")) {
    console.log(`skip ${slug}: not a narrator story episode`);
    continue;
  }
  const isEn = episode.locale === "en";
  const playlistId = playlistMap[isEn ? "en" : "vi"]?.["long-form"];
  jobs.push({
    slug,
    videoId: entry.videoId,
    title: longFormTitle(episode, slug),
    description: longFormDescription(episode, {
      playlistId,
      prevVideoId: siblingVideoId(slug, -1),
      nextVideoId: siblingVideoId(slug, +1),
    }),
    tags: longFormTags(episode),
  });
}

console.log(`${jobs.length} episode(s) to check.`);

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("No YouTube credentials — printing computed metadata only.");
  for (const j of jobs) {
    console.log(`\n=== ${j.slug} (${j.videoId}) ===\n${j.title}\n${j.description}`);
  }
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

let updated = 0;
let skipped = 0;
for (const j of jobs) {
  const list = await youtube.videos.list({ part: ["snippet"], id: [j.videoId] });
  const item = list.data.items?.[0];
  if (!item) {
    console.log(`${j.slug}: video ${j.videoId} not found on channel — skipped`);
    continue;
  }
  const cur = item.snippet;
  const same =
    cur.title === j.title &&
    cur.description === j.description &&
    JSON.stringify(cur.tags ?? []) === JSON.stringify(j.tags);
  if (same) {
    console.log(`${j.slug}: metadata already current`);
    skipped++;
    continue;
  }
  console.log(`\n=== ${j.slug} (${j.videoId}) ===`);
  if (cur.title !== j.title) console.log(`title: "${cur.title}"\n  -> "${j.title}"`);
  if (cur.description !== j.description) console.log(`description: changed (${cur.description.length} -> ${j.description.length} chars)`);
  if (DRY_RUN) continue;

  await youtube.videos.update({
    part: ["snippet"],
    requestBody: {
      id: j.videoId,
      snippet: {
        title: j.title,
        description: j.description,
        tags: j.tags,
        categoryId: cur.categoryId,
        defaultLanguage: cur.defaultLanguage,
        defaultAudioLanguage: cur.defaultAudioLanguage,
      },
    },
  });
  updated++;
  console.log("  updated.");
}
console.log(`\nDone: ${updated} updated, ${skipped} already current${DRY_RUN ? " (dry run)" : ""}.`);
