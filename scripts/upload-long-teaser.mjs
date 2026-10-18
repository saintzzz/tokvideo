// Uploads a teaser Short (made by make-long-teaser.mjs) to the vi
// channel, pointing back at the full long-form episode — the Shorts
// feed is the discovery funnel while the channel's browse distribution
// recovers. Same auth pattern as upload-youtube-long.mjs.
//
// Usage: node scripts/upload-long-teaser.mjs <slug>
// Privacy: YOUTUBE_TEASER_PRIVACY_STATUS, default "public" — the whole
// point of the teaser is reach, and its content is a slice of an
// already-public video.

import { createReadStream, existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";
import playlistMap from "../src/suckhoe/playlist-map.json" with { type: "json" };
import { arcBase, videoUrl, playlistUrl } from "./lib/long-metadata.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/upload-long-teaser.mjs <episode-slug>");
  process.exit(1);
}

const repoRoot = path.join(import.meta.dirname, "..");
const videoPath = path.join(repoRoot, "out", `teaser-${slug}.mp4`);
if (!existsSync(videoPath)) {
  console.error(`Missing teaser file: ${videoPath} — run make-long-teaser.mjs first.`);
  process.exit(1);
}

const episode = (
  await import(pathToFileURL(path.join(repoRoot, "src", "suckhoe", "long-form", `${slug}.json`)), {
    with: { type: "json" },
  })
).default;
if (episode.locale !== "vi") {
  console.error(`Teaser uploads target the vi channel only; "${slug}" is locale=${episode.locale}.`);
  process.exit(1);
}

const ledgerPath = path.join(repoRoot, "src", "suckhoe", "published-long.json");
const ledger = existsSync(ledgerPath) ? JSON.parse(await readFile(ledgerPath, "utf8")) : {};
const longVideoId = ledger[slug]?.videoId ?? null;

const teaserKey = `${slug}-teaser`;
if (ledger[teaserKey]?.videoId) {
  console.log(`Teaser already uploaded for ${slug}: ${ledger[teaserKey].videoId}`);
  process.exit(0);
}

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("Skipping YouTube upload: credentials not set.");
  process.exit(0);
}
const PRIVACY_STATUS = process.env.YOUTUBE_TEASER_PRIVACY_STATUS || "public";

const epNum = slug.match(/-tap-(\d+)$/)?.[1] ?? "";
const arcName = arcBase(slug)
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");
const title = `Truyện Ma | ${arcName} - Tập ${parseInt(epNum, 10)} (xem trước) #Shorts`;

const playlistId = playlistMap.vi?.["long-form"];
const description = [
  longVideoId ? `Nghe trọn tập: ${videoUrl(longVideoId)}` : null,
  playlistId ? `Nghe trọn bộ: ${playlistUrl(playlistId)}` : null,
  "",
  "#Shorts #truyenma #truyenmacothat #nghetruyen",
]
  .filter((l) => l !== null)
  .join("\n");

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

console.log(`Uploading ${videoPath} as "${title}" (privacyStatus=${PRIVACY_STATUS})`);
const res = await youtube.videos.insert({
  part: ["snippet", "status"],
  requestBody: {
    snippet: {
      title,
      description,
      tags: ["truyện ma", "truyện ma có thật", "nghe truyện", "shorts"],
      categoryId: "24",
    },
    status: { privacyStatus: PRIVACY_STATUS, selfDeclaredMadeForKids: false },
  },
  media: { body: createReadStream(videoPath) },
});
console.log(`Uploaded: https://youtube.com/watch?v=${res.data.id}`);

ledger[teaserKey] = {
  videoId: res.data.id,
  publishedAt: new Date().toISOString(),
  locale: "vi",
  privacyStatus: PRIVACY_STATUS,
};
await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
console.log(`Ledger updated: published-long.json[${teaserKey}] = ${res.data.id}`);
