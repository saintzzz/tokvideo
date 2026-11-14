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
import { arcDisplayName, videoUrl, playlistUrl } from "./lib/long-metadata.mjs";

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
const arcName = arcDisplayName(episode, slug);
// Audit 2026-11-06 (vidIQ): premise-first titles beat the generic
// "Truyện Ma | Series - Tập X (xem trước)" template - lead with the
// episode's hook, keep series+ep at the tail for recognition.
const premise = (episode.title || `Tập ${parseInt(epNum, 10) || "?"}`)
  .replace(/\s*[-–—]\s*Tập\s*\d+.*$/i, "")
  .replace(/\s*\|.*$/, "")
  .trim();
const suffix = ` | ${arcName} #${parseInt(epNum, 10) || "?"} (xem trước) #Shorts`;
const title = (premise.length > 100 - suffix.length ? premise.slice(0, 100 - suffix.length).replace(/\s+\S*$/, "") : premise) + suffix;

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

// Quota pool 2 fallback for the 1600-unit videos.insert (weekend boost
// 2026-11-14) - same VI channel account, second GCP project.
const quotaErr = (e) => /quotaExceeded|uploadLimitExceeded/i.test(`${e.message} ${JSON.stringify(e.errors || [])}`);
const insertWithFallback = async (params) => {
  try {
    return await youtube.videos.insert(params);
  } catch (e) {
    const { YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2, YOUTUBE_REFRESH_TOKEN_2 } = process.env;
    if (!quotaErr(e) || !YOUTUBE_CLIENT_ID_2 || !YOUTUBE_CLIENT_SECRET_2 || !YOUTUBE_REFRESH_TOKEN_2) throw e;
    console.warn(`Primary quota pool exhausted - retrying teaser insert on pool 2`);
    const o = new google.auth.OAuth2(YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2);
    o.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN_2 });
    return await google.youtube({ version: "v3", auth: o }).videos.insert(params);
  }
};

// Race-safe dedupe (same fix as upload-youtube-long): a second job can
// pass the ledger check before the first commits - adopt the live
// video with this exact title instead of double-uploading.
try {
  const ch = await youtube.channels.list({ part: ["contentDetails"], mine: true });
  const uploadsId = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (uploadsId) {
    const recent = await youtube.playlistItems.list({ part: ["snippet"], playlistId: uploadsId, maxResults: 25 });
    const dup = (recent.data.items || []).find(
      (i) => (i.snippet.title || "").normalize("NFC") === title.normalize("NFC")
    );
    if (dup) {
      const vid = dup.snippet.resourceId.videoId;
      console.log(`Teaser title already live (${vid}) - recording into ledger instead of re-uploading.`);
      ledger[teaserKey] = {
        videoId: vid,
        publishedAt: dup.snippet.publishedAt ?? new Date().toISOString(),
        locale: "vi",
      };
      await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
      process.exit(0);
    }
  }
} catch (e) {
  console.warn(`Channel dedupe pre-check failed (${e.message}) - continuing upload`);
}

console.log(`Uploading ${videoPath} as "${title}" (privacyStatus=${PRIVACY_STATUS})`);
const res = await insertWithFallback({
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

// Pinned comment right at upload - the only clickable bridge from the
// Shorts feed to the full episode (audit funnel 2026-11-06). Failure
// must not fail the job; the watchdog's pin-teaser-comments sweep
// backfills any miss on its next run.
try {
  const cmt = await youtube.commentThreads.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        videoId: res.data.id,
        topLevelComment: {
          snippet: {
            textOriginal:
              `Nghe TRỌN TẬP đầy đủ trên kênh 👉 https://youtu.be/${longVideoId ?? ""}\n` +
              `Trọn bộ câu chuyện trong playlist - ghim bình luận này để quay lại nghe tiếp nhé.`,
          },
        },
      },
    },
  });
  ledger[teaserKey].pinnedCommentId = cmt.data.id;
  console.log(`Pinned comment: ${cmt.data.id}`);
} catch (e) {
  console.warn(`Pinned comment failed (watchdog sweep will retry): ${e.message}`);
}

await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
console.log(`Ledger updated: published-long.json[${teaserKey}] = ${res.data.id}`);
