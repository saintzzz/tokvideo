import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";

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

const title = episode.title;
const description = isEn
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

console.log(`Uploading ${videoPath} as "${title}" (privacyStatus=${PRIVACY_STATUS})`);

const res = await youtube.videos.insert({
  part: ["snippet", "status"],
  requestBody: {
    snippet: {
      title,
      description,
      tags: isEn
        ? ["homeremedies", "folkwisdom", "sciencecheck"]
        : ["meodangian", "suckhoe", "kiemchungkhoahoc"],
      categoryId: "27", // Education
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
