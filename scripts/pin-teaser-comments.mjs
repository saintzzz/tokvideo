// Posts a pinned "watch the full episode" comment under every published
// long-form teaser Short — the only clickable bridge from the Shorts
// feed to the full episode (Shorts descriptions are barely read).
// Idempotent: skips teasers whose ledger entry already has
// pinnedCommentId. Runs on CI where YOUTUBE_* secrets live.
//
// Usage: node scripts/pin-teaser-comments.mjs [slug ...]

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("Skipping: YouTube credentials not set.");
  process.exit(0);
}

const root = path.resolve(import.meta.dirname, "..");
const ledgerPath = path.join(root, "src", "suckhoe", "published-long.json");
const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2 });

const requested = process.argv.slice(2);
let dirty = false;

for (const [key, entry] of Object.entries(ledger)) {
  if (!key.endsWith("-teaser") || !entry?.videoId) continue;
  if (requested.length && !requested.includes(key)) continue;
  if (entry.pinnedCommentId) continue;
  const slug = key.replace(/-teaser$/, "");
  const ytId = ledger[slug]?.videoId;
  if (!ytId) continue;
  const text =
    `Nghe TRỌN TẬP đầy đủ trên kênh 👉 https://youtu.be/${ytId}\n` +
    `Trọn bộ câu chuyện trong playlist — ghim bình luận này để quay lại nghe tiếp nhé.`;
  try {
    const res = await youtube.commentThreads.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          videoId: entry.videoId,
          topLevelComment: { snippet: { textOriginal: text } },
        },
      },
    });
    entry.pinnedCommentId = res.data.id;
    dirty = true;
    console.log(`${key}: pinned comment ${res.data.id}`);
  } catch (err) {
    console.error(`${key}: comment failed — ${err.message ?? err}`);
  }
}

if (dirty) {
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  console.log("ledger updated");
}
