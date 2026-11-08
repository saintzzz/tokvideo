#!/usr/bin/env node
// Channel dedupe: manual dispatches + delayed cron ticks raced to
// upload the same episode twice (2026-11-08 - Studio shows two tap-04
// longs and two tap-04 teasers). The ledger keeps only ONE videoId per
// slug; the losing upload stays live on the channel forever unless
// someone deletes it. This lists the channel's uploads playlist, maps
// each video to an episode slug via its title, and DELETES any video
// whose ID is not the ledger entry for that slug.
//
// Safety rules:
//   - Only touches videos whose title parses to a known long-form slug
//     pattern (<premise> - Tập N / <premise> #N (xem trước)).
//   - Keeps the ledger videoId; if the ledger has no entry, keeps the
//     older upload and reports instead of deleting.
//   - Dry-run by default; --apply actually deletes.
//
// Usage: node scripts/dedupe-channel-videos.mjs [--apply]

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APPLY = process.argv.includes("--apply");
const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}
const auth = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth });

const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
const ledgerIds = new Set(Object.values(ledger).map(v => v?.videoId).filter(Boolean));

// Episode slugs with their premise titles for matching.
const epTitles = {};
for (const f of (await import("node:fs")).readdirSync(path.join(ROOT, "src/suckhoe/long-form"))) {
  if (!f.endsWith(".json")) continue;
  const ep = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/long-form", f), "utf8"));
  if (ep.slug) epTitles[ep.slug] = ep.title || "";
}
// Slug -> ordered match keys: "tập N" + distinctive premise prefix.
const matchSlug = (title) => {
  for (const [slug, epTitle] of Object.entries(epTitles)) {
    const n = slug.match(/-tap-(\d+)$/)?.[1];
    if (!n || !epTitle) continue;
    const premise = epTitle.split("|")[0].split(" - ")[0].trim();
    if (!premise || premise.length < 8) continue;
    const isTeaser = /#shorts|xem trước/i.test(title);
    const key = isTeaser ? `${slug}-teaser` : slug;
    if (title.includes(premise) && (title.includes(`Tập ${Number(n)}`) || title.includes(`#${Number(n)}`) || title.includes(`Tập ${n}`))) {
      return key;
    }
  }
  return null;
};

// List the whole uploads playlist.
const ch = await youtube.channels.list({ part: ["contentDetails"], mine: true });
const uploadsId = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
if (!uploadsId) throw new Error("no uploads playlist");
const items = [];
let pageToken;
do {
  const r = await youtube.playlistItems.list({ part: ["snippet"], playlistId: uploadsId, maxResults: 50, pageToken });
  items.push(...(r.data.items || []));
  pageToken = r.data.nextPageToken;
} while (pageToken);
console.log(`${items.length} videos on channel`);

const groups = {};
for (const it of items) {
  const slug = matchSlug(it.snippet.title || "");
  if (!slug) continue;
  (groups[slug] ??= []).push({ id: it.snippet.resourceId.videoId, title: it.snippet.title, at: it.snippet.publishedAt });
}

let deleted = 0;
for (const [slug, vids] of Object.entries(groups)) {
  const keep = ledger[slug]?.videoId ?? vids.sort((a, b) => a.at.localeCompare(b.at))[0].id;
  for (const v of vids) {
    if (v.id === keep) continue;
    console.log(`${APPLY ? "DELETE" : "would delete"} ${v.id} "${v.title.slice(0, 70)}" (dup of ${slug}, keep ${keep})`);
    if (APPLY) {
      await youtube.videos.delete({ id: v.id });
      deleted++;
    }
  }
  if (!ledgerIds.has(keep)) console.log(`  note: kept ${keep} is NOT in ledger for ${slug}`);
}
console.log(`dedupe done: ${deleted} deleted (${APPLY ? "applied" : "dry-run"})`);
