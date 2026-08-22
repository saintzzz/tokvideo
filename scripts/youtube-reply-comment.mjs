import { readFile } from "node:fs/promises";
import { google } from "googleapis";

// Posts a reply to an existing top-level comment on one of the channel's
// OWN videos (see scripts/reply-comments-prompt.txt). Text comes from a
// file, not a CLI arg, to avoid shell-escaping issues with long,
// diacritic-heavy Vietnamese text.
//
// Usage: node scripts/youtube-reply-comment.mjs --locale=vi --parent-id=XXX --text-file=/path/to/reply.txt
//
// --parent-id is the top-level COMMENT THREAD id (from
// scripts/youtube-list-new-comments.mjs's first column), not a video id.
// Needs a refresh token with the youtube.force-ssl scope.

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
}

const locale = arg("locale") ?? "vi";
const parentId = arg("parent-id");
const textFile = arg("text-file");

if (!parentId || !textFile) {
  console.error("Usage: node scripts/youtube-reply-comment.mjs --locale=vi|en --parent-id=XXX --text-file=/path/to/reply.txt");
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

const res = await youtube.comments.insert({
  part: ["snippet"],
  requestBody: { snippet: { parentId, textOriginal: text } },
});

console.log(`Posted reply ${res.data.id} to thread ${parentId}`);
