// Sets the custom thumbnail on an already-published long-form video
// (YouTube thumbnails.set on the ledger videoId). Pair with
// gen-thumb-visuals.mjs + make-long-thumbnail.mjs — this script only
// does the API call.
//
// Usage: node scripts/set-long-thumbnail.mjs <slug> [<slug>...]

import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("Usage: node scripts/set-long-thumbnail.mjs <slug> [<slug>...]");
  process.exit(1);
}

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}

const repoRoot = path.join(import.meta.dirname, "..");
const ledger = JSON.parse(
  await readFile(path.join(repoRoot, "src", "suckhoe", "published-long.json"), "utf8")
);

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

for (const slug of slugs) {
  const videoId = ledger[slug]?.videoId;
  const thumbPath = path.join(repoRoot, "out", `SucKhoeLong-${slug}-thumb.png`);
  if (!videoId) {
    console.log(`${slug}: not in ledger — skipped`);
    continue;
  }
  if (!existsSync(thumbPath)) {
    console.log(`${slug}: no thumb file at ${thumbPath} — skipped`);
    continue;
  }
  try {
    await youtube.thumbnails.set({
      videoId,
      media: { body: createReadStream(thumbPath) },
    });
    console.log(`${slug}: thumbnail set on ${videoId}`);
  } catch (err) {
    console.error(`${slug}: thumbnails.set failed — ${err.message ?? err}`);
  }
}
