import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import playlistMap from "../src/suckhoe/playlist-map.json" with { type: "json" };
import { withRetry } from "./lib/retry.mjs";

// Uploads one rendered Suc Khoe episode to YouTube. Needs
// YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN in the
// environment (see scripts/youtube-get-refresh-token.mjs for how to get
// the refresh token once).
//
// Defaults to uploading as "private" — a deliberate safety gate. Someone
// reviews the video in YouTube Studio and flips it to public by hand.
// Override with YOUTUBE_PRIVACY_STATUS=public only once you're confident
// in unattended publishing for this channel.

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/upload-youtube.mjs <episode-slug>");
  process.exit(1);
}

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  // Not a hard failure — lets the render pipeline run fine before YouTube
  // credentials are set up (e.g. as GitHub secrets). See
  // scripts/youtube-get-refresh-token.mjs to generate them.
  console.log(
    "Skipping YouTube upload: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN not set."
  );
  process.exit(0);
}

// `||` on purpose, not `??`: an unset GitHub Actions `vars.*` reference
// evaluates to "" (empty string), not undefined, so `??` alone lets an
// empty string through — which YouTube's API then rejects outright
// (confirmed live on 2026-08-22: YOUTUBE_EN_PRIVACY_STATUS wasn't set yet,
// came through as "", and the upload failed with a 400 on privacy_status).
const PRIVACY_STATUS = process.env.YOUTUBE_PRIVACY_STATUS || "private";

const episodePath = path.join(
  import.meta.dirname,
  "..",
  "src",
  "suckhoe",
  "episodes",
  `${slug}.json`
);
const episodeModule = await import(
  `../src/suckhoe/episodes/${slug}.json`,
  { with: { type: "json" } }
);
const episode = episodeModule.default;

// ── Publish-state dedupe (R-05) ───────────────────────────────────
// published.json is the queue ledger. Entries may be legacy plain
// strings ("<timestamp>") or objects {publishedAt, locale, videoId}.
// A recorded videoId means this slug already lives on the channel —
// re-uploading it is exactly the duplicate-upload bug that hit the EN
// channel on 2026-09-17, so we refuse.
const publishedPath = path.join(
  import.meta.dirname, "..", "src", "suckhoe", "published.json"
);
const readPublished = async () => {
  try {
    const raw = JSON.parse(await readFile(publishedPath, "utf8"));
    // Normalize legacy string values in memory (file normalized on write).
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? { publishedAt: v } : v])
    );
  } catch {
    return {};
  }
};

const published = await readPublished();
const existing = published[slug];
if (existing?.videoId) {
  console.log(
    `Skipping upload: "${slug}" already uploaded as https://youtube.com/watch?v=${existing.videoId} (published.json)`
  );
  process.exit(0);
}

const videoPath = path.join(import.meta.dirname, "..", "out", `SucKhoe-${slug}.mp4`);

const isEn = episode.locale === "en";

// Per-category extra keywords — layered on top of the 3 always-on base
// tags/hashtags. Research on Shorts discoverability (2026-08-23): the
// algorithm uses tags as a "confidence score" signal for topic matching
// and rewards 5-8 relevant tags over a bare 2-3; hashtags work best at
// 3-5 including one niche-specific one, not just #shorts + brand tags.
// Keyed by src/suckhoe/playlist-map.json's category slugs — a missing/
// unmapped category just falls back to the base set, never fails.
const CATEGORY_KEYWORDS = {
  "ho-cam-hong": { tags: ["trị ho", "cảm cúm", "viêm họng"], hashtag: "meoho" },
  "tieu-hoa": { tags: ["tiêu hóa", "đau bụng", "khó tiêu"], hashtag: "tieuhoa" },
  "giac-ngu": { tags: ["mất ngủ", "giấc ngủ ngon"], hashtag: "giacngu" },
  "dau-nhuc-met-moi": { tags: ["đau nhức", "mệt mỏi"], hashtag: "daunhuc" },
  "da-toc-lam-dep": { tags: ["làm đẹp", "dưỡng da", "chăm sóc tóc"], hashtag: "lamdep" },
  "en-cold-throat": { tags: ["cold remedy", "sore throat", "cough relief"], hashtag: "coldremedy" },
  "en-sleep-relax": { tags: ["better sleep", "sleep aid", "relaxation"], hashtag: "sleepremedy" },
  "en-skin-beauty": { tags: ["skincare", "skin remedy", "natural beauty"], hashtag: "skincare" },
  "en-digestion": { tags: ["digestive health", "upset stomach", "digestion tips"], hashtag: "digestivehealth" },
};
const categoryInfo = CATEGORY_KEYWORDS[episode.category];

function buildTags() {
  const base = isEn
    ? ["homeremedies", "folkwisdom", "shorts"]
    : ["suckhoe", "meodangian", "shorts"];
  const ingredientTags = episode.ingredientName
    .split(/,| và | and |\//i)
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = [...base, ...ingredientTags, ...(categoryInfo?.tags ?? [])];
  return [...new Set(tags)].slice(0, 8);
}

function buildHashtagLine() {
  const base = isEn
    ? ["#homeremedies", "#folkwisdom", "#shorts"]
    : ["#suckhoe", "#meodangian", "#shorts"];
  const extra = [categoryInfo ? `#${categoryInfo.hashtag}` : null, isEn ? "#naturalremedies" : "#meovat"].filter(
    Boolean
  );
  return [...base, ...extra].join(" ");
}

const title = `${episode.channelTitle} #Shorts`;
const description = isEn
  ? [
      episode.remedy,
      "",
      "How to:",
      ...episode.steps.map((step, i) => `${i + 1}. ${step}`),
      "",
      "Shared as traditional folk wisdom, not medical advice — talk to a doctor for any real health concern.",
      episode.caution ?? "",
      "",
      buildHashtagLine(),
    ].join("\n")
  : [
      episode.remedy,
      "",
      "Cách làm:",
      ...episode.steps.map((step, i) => `${i + 1}. ${step}`),
      "",
      "Kinh nghiệm dân gian, không thay thế ý kiến bác sĩ.",
      episode.caution ?? "",
      "",
      buildHashtagLine(),
    ].join("\n");

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// Second dedupe layer: if the state file lost the record (missed commit,
// force-pushed history), check the channel for an existing upload with
// the exact same title before inserting. Costs one search.list call —
// worth it to never double-upload.
const dupeCheck = await youtube.search.list({
  part: ["id", "snippet"],
  forMine: true,
  type: ["video"],
  q: episode.channelTitle,
  maxResults: 5,
});
const dupe = (dupeCheck.data.items ?? []).find(
  (item) => item.snippet?.title === title
);
if (dupe) {
  const videoId = dupe.id.videoId;
  console.log(`Skipping upload: identical title already on channel: https://youtube.com/watch?v=${videoId}`);
  published[slug] = {
    ...(existing ?? {}),
    publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    locale: isEn ? "en" : "vi",
    videoId,
  };
  await writeFile(publishedPath, JSON.stringify(published, null, 2) + "\n");
  console.log(`Recorded existing videoId in ${publishedPath}`);
  process.exit(0);
}

console.log(`Uploading ${videoPath} as "${title}" (privacyStatus=${PRIVACY_STATUS})`);

const res = await withRetry(
  () =>
    youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags: buildTags(),
          categoryId: "26", // Howto & Style
        },
        status: {
          privacyStatus: PRIVACY_STATUS,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(videoPath),
      },
    }),
  {
    attempts: 3,
    baseMs: 5000,
    label: "videos.insert",
    // Quota exhaustion and permission errors are terminal — retrying
    // them just burns time. Only transient failures retry.
    retryOn: (err) => {
      const reason = err?.errors?.[0]?.reason ?? "";
      return !/quotaExceeded|forbidden|insufficientPermissions|invalid_grant/i.test(reason);
    },
  }
);

console.log(`Uploaded: https://youtube.com/watch?v=${res.data.id}`);
console.log(`(episode JSON: ${episodePath})`);

// Record the authoritative videoId immediately — the queue ledger is
// idempotent at the API boundary now, not just at the slug level.
published[slug] = {
  ...(existing ?? {}),
  publishedAt: existing?.publishedAt ?? new Date().toISOString(),
  locale: isEn ? "en" : "vi",
  videoId: res.data.id,
};
await writeFile(publishedPath, JSON.stringify(published, null, 2) + "\n");
console.log(`Recorded videoId in ${publishedPath}`);

// Add the video to its topic playlist, if it has a category and that
// category has a playlist mapped for this locale — groups related videos
// together, which encourages longer watch sessions (the algorithm rewards
// that). Never fails the upload over this: a missing category/playlist
// mapping just means the video isn't added to one, logged and moved on.
const localeKey = isEn ? "en" : "vi";
const playlistId = episode.category ? playlistMap[localeKey]?.[episode.category] : undefined;

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
    console.log(`Added to playlist ${playlistId} (category: ${episode.category})`);
  } catch (err) {
    console.error(`Failed to add to playlist ${playlistId}: ${err.message ?? err}`);
  }
} else if (episode.category) {
  console.log(`No playlist mapped for category "${episode.category}" (locale ${localeKey}) — skipping.`);
}
