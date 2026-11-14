import { createReadStream, existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";
import playlistMap from "../src/suckhoe/playlist-map.json" with { type: "json" };
import {
  longFormTitle,
  longFormDescription,
  longFormTags,
  videoUrl,
  arcBase,
} from "./lib/long-metadata.mjs";

// Uploads one rendered long-form Suc Khoe episode. Manual/dispatch-only —
// NOT part of the automated Shorts publish queue. Regular long-form video,
// not a Short: no #Shorts tag, landscape source file, Education category.
//
// Needs YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN
// (vi channel) or the YOUTUBE_EN_* equivalents (en channel), same as the
// Shorts upload script.

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/upload-youtube-long.mjs <episode-slug>");
  process.exit(1);
}

// Reads the JSON directly rather than importing the .ts index — plain
// Node ESM can't import .ts files without a transpiler, same reason every
// other script here reads src/suckhoe/episodes/*.json off disk instead.
const longFormDir = path.join(import.meta.dirname, "..", "src", "suckhoe", "long-form");
const longFormFile = path.join(longFormDir, `${slug}.json`);
let episode;
try {
  const url = pathToFileURL(longFormFile);
  const mod = await import(url, { with: { type: "json" } });
  episode = mod.default;
} catch {
  const known = (await readdir(longFormDir))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
  console.error(`Unknown long-form episode "${slug}". Known: ${known.join(", ")}`);
  process.exit(1);
}

const isEn = episode.locale === "en";

// Narrator-audiobook story episodes (xianxia/fiction arcs) carry a
// completely different metadata contract than the remedy-fact-check
// episodes: different description boilerplate, tags, and category.
// Narrator-only beats = story; grandma/granddaughter dialogue = remedy.
const isStory = episode.beats.every((b) => b.speaker === "narrator");

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: isEn ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN,
};

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log(
    "Skipping YouTube upload: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / (YOUTUBE_REFRESH_TOKEN or YOUTUBE_EN_REFRESH_TOKEN) not set."
  );
  process.exit(0);
}

// Deliberately defaults to private — this is an experimental format,
// someone should watch it through once before it goes out to the channel.
const PRIVACY_STATUS = process.env.YOUTUBE_LONG_PRIVACY_STATUS || "private";

const videoPath = path.join(import.meta.dirname, "..", "out", `SucKhoeLong-${slug}.mp4`);

// YouTube rejects the whole upload with a generic "invalid or empty video
// title" error if the title exceeds 100 characters — confirmed live on
// 2026-08-22 (a 108-char title silently killed an otherwise-successful
// render/upload). Fail loudly and early instead of burning another full
// render on a title that was always going to be rejected.
const title = longFormTitle(episode, slug);
if ([...title].length > 100) {
  console.error(
    `Episode title is ${[...title].length} characters, over YouTube's 100-char limit: "${title}"`
  );
  process.exit(1);
}

// The ledger is needed before upload too: the previous arc episode's
// videoId feeds the "Tập trước" link in this description, and after the
// upload the previous video's description gets patched with the link to
// this one (binge-session chaining — same pattern update-long-metadata
// applies retroactively).
const ledgerPath = path.join(import.meta.dirname, "..", "src", "suckhoe", "published-long.json");
let ledger = {};
if (existsSync(ledgerPath)) {
  ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
}
// Watchdog can dispatch the same slug a delayed cron also picks — bail
// early when the ledger already has this episode so double-dispatch is
// a no-op instead of a duplicate upload (2026-11-07 missed-tick fix).
if (ledger[slug]?.videoId) {
  console.log(`Already published ${slug}: ${ledger[slug].videoId} - skipping upload.`);
  process.exit(0);
}
const arc = arcBase(slug);
const epNum = parseInt(slug.match(/-tap-(\d+)$/)?.[1] ?? "0", 10);
const prevEntry = epNum > 1 ? ledger[`${arc}-tap-${String(epNum - 1).padStart(2, "0")}`] : null;
const nextEntry = ledger[`${arc}-tap-${String(epNum + 1).padStart(2, "0")}`] ?? null;

const localeKeyEarly = isEn ? "en" : "vi";
const longPlaylistId = playlistMap[localeKeyEarly]?.["long-form"];

// Per-arc metadata overrides (episode.hashtags / episode.tags) replace
// the generic story boilerplate - the horror arc needs horror tags, not
// the xianxia defaults this description block was written for.
const description = isStory
  ? longFormDescription(episode, {
      playlistId: longPlaylistId,
      prevVideoId: prevEntry?.videoId,
      nextVideoId: nextEntry?.videoId,
    })
  : isEn
  ? [
      episode.description,
      "",
      "Every claim in this video is checked against real published research — sources for each one are summarized on screen when it comes up.",
      "",
      "Shared as folk wisdom and general information, not medical advice — please see a doctor for any real health concern.",
      "",
      "#homeremedies #folkwisdom #sciencecheck",
    ].join("\n")
  : [
      episode.description,
      "",
      "Mỗi mẹo dân gian trong video đều được đối chiếu với nghiên cứu khoa học thật, nguồn được tóm tắt ngay trên màn hình lúc nhắc đến.",
      "",
      "Nội dung mang tính chia sẻ kinh nghiệm dân gian và thông tin tham khảo, không thay thế lời khuyên của bác sĩ.",
      "",
      "#meodangian #suckhoe #kiemchungkhoahoc",
    ].join("\n");

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// Quota pool 2 (weekend boost 2026-11-14): 5 long + 5 teaser a day is
// ~16k units, over one 10k project quota. A second GCP project's
// *_2 creds serve as spillover - same channel account, different quota.
// Only the 1600-unit videos.insert gets fallback; read calls stay on
// pool 1. Never falls back for EN uploads (the _2 token is the VI
// channel account).
const quotaErr = (e) => /quotaExceeded|uploadLimitExceeded/i.test(`${e.message} ${JSON.stringify(e.errors || [])}`);
let youtube2 = null;
const fallbackPool = () => {
  if (isEn) return null;
  if (youtube2 !== null) return youtube2 || null;
  const { YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2, YOUTUBE_REFRESH_TOKEN_2 } = process.env;
  if (!YOUTUBE_CLIENT_ID_2 || !YOUTUBE_CLIENT_SECRET_2 || !YOUTUBE_REFRESH_TOKEN_2) { youtube2 = false; return null; }
  const o = new google.auth.OAuth2(YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2);
  o.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN_2 });
  youtube2 = google.youtube({ version: "v3", auth: o });
  return youtube2;
};
const insertWithFallback = async (params) => {
  try {
    return await youtube.videos.insert(params);
  } catch (e) {
    const fb = fallbackPool();
    if (!fb || !quotaErr(e)) throw e;
    console.warn(`Primary quota pool exhausted (${e.message?.slice(0, 80)}) - retrying insert on pool 2`);
    return await fb.videos.insert(params);
  }
};

// Race-safe dedupe: two concurrent jobs can BOTH pass the ledger check
// above before either commits - the first upload's title is already
// live when the second reaches here (observed 2026-11-09: dispatch +
// delayed cron tick double-uploaded longs and teasers). Check the
// channel's own recent uploads for this exact title; if present,
// adopt its videoId into the ledger instead of double-uploading.
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
      console.log(`Title already live on channel (${vid}) - raced double-dispatch; recording into ledger instead of re-uploading.`);
      ledger[slug] = {
        videoId: vid,
        publishedAt: dup.snippet.publishedAt ?? new Date().toISOString(),
        locale: localeKeyEarly,
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
      tags: isStory
        ? longFormTags(episode)
        : isEn
        ? ["homeremedies", "folkwisdom", "sciencecheck"]
        : ["meodangian", "suckhoe", "kiemchungkhoahoc"],
      // Fiction stories -> Entertainment; remedy fact-checks -> Education.
      categoryId: isStory ? "24" : "27",
    },
    status: {
      privacyStatus: PRIVACY_STATUS,
      selfDeclaredMadeForKids: false,
    },
  },
  media: {
    body: createReadStream(videoPath),
  },
});

console.log(`Uploaded: https://youtube.com/watch?v=${res.data.id}`);

// Persist the videoId immediately — cleanup-channel-videos.mjs sweeps any
// channel video it cannot tie back to a ledger entry, and this script used
// to record nothing, so every long-form upload was purged by the next
// cleanup tick (observed 2026-10-09: kiem-hon-thuc-tinh-tap-01 deleted).
ledger[slug] = {
  videoId: res.data.id,
  publishedAt: new Date().toISOString(),
  locale: isEn ? "en" : "vi",
  privacyStatus: PRIVACY_STATUS,
};
await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
console.log(`Ledger updated: published-long.json[${slug}] = ${res.data.id}`);

// Pinned comment on the long video too: playlist funnel + an
// engagement question (comments are a ranking signal; every episode is
// a mystery so "who is behind it" works arc-wide). Fail-soft - the
// watchdog pin-teaser-comments sweep backfills any miss.
try {
  const arcLabel = arcDisplayName(episode, slug);
  const playlistLine = longPlaylistId ? playlistUrl(longPlaylistId) : null;
  const text = isEn
    ? `📌 Full ${arcLabel} playlist: ${playlistLine ?? "on the channel"}\n` +
      `New episode every day - subscribe so you don't miss it.\n` +
      `Who do you think is behind it all? Drop your guess below.`
    : `📌 Nghe trọn bộ ${arcLabel}: ${playlistLine ?? "trên kênh"}\n` +
      `Tập mới lên mỗi ngày - nhấn chuông để không bỏ lỡ.\n` +
      `Bạn đoán ai là kẻ đứng sau chuyện này? Kể bên dưới nhé.`;
  const cmt = await youtube.commentThreads.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        videoId: res.data.id,
        topLevelComment: { snippet: { textOriginal: text } },
      },
    },
  });
  ledger[slug].pinnedCommentId = cmt.data.id;
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  console.log(`Pinned comment: ${cmt.data.id}`);
} catch (e) {
  console.warn(`Pinned comment failed (watchdog sweep will retry): ${e.message}`);
}

// Custom thumbnail if one was rendered alongside the video
// (scripts/make-long-thumbnail.mjs). Long-form CTR is thumbnail-driven;
// the auto-picked frame is usually a dark scene. Fail-soft: a missing or
// rejected thumbnail never fails the upload.
const thumbPath = path.join(import.meta.dirname, "..", "out", `SucKhoeLong-${slug}-thumb.png`);
if (existsSync(thumbPath)) {
  // YouTube rate-limits thumbnails.set per channel ("uploaded too many
  // thumbnails recently") — it cleared in under a minute in every
  // observed case, so retry a few times before giving up. A persistent
  // failure marks the ledger entry thumbnailPending so the watchdog
  // sweep retries on a later run instead of silently shipping a raw
  // video frame as the thumbnail (observed 2026-11-14).
  let thumbSet = false;
  for (let attempt = 0; attempt < 4 && !thumbSet; attempt++) {
    try {
      await youtube.thumbnails.set({
        videoId: res.data.id,
        media: { body: createReadStream(thumbPath) },
      });
      thumbSet = true;
      console.log("Custom thumbnail set.");
    } catch (err) {
      const msg = err.message ?? String(err);
      const rateLimited = /too many thumbnails|rate.?limit|quota/i.test(msg);
      console.error(`Thumbnail upload attempt ${attempt + 1}/4 failed: ${msg}`);
      if (!rateLimited) break;
      await new Promise((r) => setTimeout(r, 45_000));
    }
  }
  ledger[slug] = { ...ledger[slug], thumbnailPending: !thumbSet };
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  if (!thumbSet) console.error("Custom thumbnail NOT applied — flagged thumbnailPending for watchdog sweep.");
} else {
  console.log("No thumbnail file found — YouTube auto frame will be used.");
}

// Add to the dedicated "long-form" playlist, same pattern as the Shorts
// upload script (scripts/upload-youtube.mjs) — this was missing entirely
// until 2026-08-23 (caught when the user asked why the long-form test
// upload never showed up in a playlist). Never fails the upload over
// this: a missing/unmapped playlist just means the video isn't added to
// one, logged and moved on.
const playlistId = longPlaylistId;

if (playlistId) {
  try {
    await youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: { kind: "youtube#video", videoId: res.data.id },
        },
      },
    });
    console.log(`Added to playlist ${playlistId} (long-form)`);
  } catch (err) {
    console.error(`Failed to add to playlist ${playlistId}: ${err.message ?? err}`);
  }
} else {
  console.log(`No "long-form" playlist mapped for locale "${localeKeyEarly}" — skipping.`);
}

// Back-patch the previous arc episode's description with a direct
// "Tập tiếp theo" link to this upload — the strongest binge-session
// signal available in metadata. Fail-soft, skips silently when the
// link is already present (e.g. re-runs).
if (isStory && prevEntry?.videoId) {
  try {
    const prevList = await youtube.videos.list({
      part: ["snippet"],
      id: [prevEntry.videoId],
    });
    const prevItem = prevList.data.items?.[0];
    if (prevItem) {
      const nextLine = `▶ Tập tiếp theo: ${videoUrl(res.data.id)}`;
      if (!prevItem.snippet.description.includes(res.data.id)) {
        await youtube.videos.update({
          part: ["snippet"],
          requestBody: {
            id: prevEntry.videoId,
            snippet: {
              title: prevItem.snippet.title,
              description: `${prevItem.snippet.description}\n${nextLine}`,
              tags: prevItem.snippet.tags,
              categoryId: prevItem.snippet.categoryId,
            },
          },
        });
        console.log(`Patched next-episode link on previous video ${prevEntry.videoId}`);
      }
    }
  } catch (err) {
    console.error(`Next-link patch on ${prevEntry.videoId} failed (upload unaffected): ${err.message ?? err}`);
  }
}
