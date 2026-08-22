import { readFile } from "node:fs/promises";
import { google } from "googleapis";

// Posts one top-level comment on a video, as part of the comment outreach
// growth tactic (see scripts/comment-outreach-prompt.txt). Text comes from
// a file, not a CLI arg — avoids shell-escaping problems with long,
// diacritic-heavy Vietnamese text.
//
// Usage: node scripts/youtube-post-comment.mjs --locale=vi --video-id=XXX --text-file=/path/to/comment.txt
//
// Needs a refresh token with the youtube.force-ssl scope (plain
// youtube/manage scope is NOT enough — confirmed 2026-08-23, failed with
// "insufficient authentication scopes"). See
// scripts/youtube-get-refresh-token.mjs.

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
}

const locale = arg("locale") ?? "vi";
const videoId = arg("video-id");
const textFile = arg("text-file");

if (!videoId || !textFile) {
  console.error("Usage: node scripts/youtube-post-comment.mjs --locale=vi|en --video-id=XXX --text-file=/path/to/comment.txt");
  process.exit(1);
}

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = locale === "en" ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / (YOUTUBE_REFRESH_TOKEN or YOUTUBE_EN_REFRESH_TOKEN).");
  process.exit(1);
}

const text = (await readFile(textFile, "utf8")).trim();
if (!text) {
  console.error(`${textFile} is empty.`);
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

const res = await youtube.commentThreads.insert({
  part: ["snippet"],
  requestBody: {
    snippet: { videoId, topLevelComment: { snippet: { textOriginal: text } } },
  },
});

console.log(`Posted comment ${res.data.id} on video ${videoId}`);
