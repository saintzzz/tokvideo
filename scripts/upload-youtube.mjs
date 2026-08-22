import { createReadStream } from "node:fs";
import path from "node:path";
import { google } from "googleapis";

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

const PRIVACY_STATUS = process.env.YOUTUBE_PRIVACY_STATUS ?? "private";

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

const videoPath = path.join(import.meta.dirname, "..", "out", `SucKhoe-${slug}.mp4`);

const isEn = episode.locale === "en";

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
      "#homeremedies #folkwisdom #shorts",
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
      "#suckhoe #meodangian #shorts",
    ].join("\n");

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
      tags: isEn
        ? ["homeremedies", "folkwisdom", "shorts"]
        : ["suckhoe", "meodangian", "shorts"],
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
});

console.log(`Uploaded: https://youtube.com/watch?v=${res.data.id}`);
console.log(`(episode JSON: ${episodePath})`);
