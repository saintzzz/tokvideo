// Comments → content ideas (PRD M-02): mines recent audience comments
// for question-like entries and turns them into episode ideas the daily
// content writer can pick up. Audience-ordered content = engagement is
// pre-validated.
//
// Reads comments via the YouTube Data API (same creds as the reply job),
// dedupes against src/suckhoe/comment-ideas.json, appends new ideas with
// the source comment for traceability. Exits 0 with a note when creds
// are absent so CI never breaks.
//
// Usage: node scripts/comments-to-content.mjs --locale=vi|en

import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const locale = arg("locale") ?? "vi";

const root = path.join(import.meta.dirname, "..");
const ideasPath = path.join(root, "src", "suckhoe", "comment-ideas.json");

const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } = process.env;
const REFRESH_TOKEN =
  locale === "en" ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN;

if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log(`Skipping comments-to-content (${locale}): YouTube env vars not set.`);
  process.exit(0);
}

const oauth2 = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2 });

const channelId = (await youtube.channels.list({ part: ["id"], mine: true })).data.items?.[0]?.id;
if (!channelId) {
  console.error("Could not resolve channel id.");
  process.exit(1);
}

const res = await youtube.commentThreads.list({
  part: ["snippet"],
  allThreadsRelatedToChannelId: channelId,
  order: "time",
  maxResults: 50,
  textFormat: "plainText",
});

// Question-like = has "?" or starts/contains a question word (vi + en).
const QUESTION_RE =
  /\?|\b(how|what|why|which|can i|should i|is it|does it|where|when)\b|bằng cách nào|như thế nào|tại sao|có nên|bao nhiêu|ở đâu|khi nào|có được không/i;

const store = existsSync(ideasPath)
  ? JSON.parse(readFileSync(ideasPath, "utf8"))
  : { ideas: [] };
const seen = new Set(store.ideas.map((i) => i.commentId));

let added = 0;
for (const t of res.data.items ?? []) {
  const c = t.snippet?.topLevelComment?.snippet;
  if (!c || c.authorChannelId?.value === channelId) continue;
  const text = (c.textDisplay ?? "").replace(/\s+/g, " ").trim();
  if (!QUESTION_RE.test(text) || seen.has(t.id)) continue;
  store.ideas.push({
    commentId: t.id,
    locale,
    videoId: t.snippet?.videoId,
    author: c.authorDisplayName,
    text,
    likes: c.likeCount ?? 0,
    foundAt: new Date().toISOString(),
    status: "new", // writer flips to "used" when an episode ships
  });
  added++;
}

store.updatedAt = new Date().toISOString();
writeFileSync(ideasPath, JSON.stringify(store, null, 2));
console.log(`${added} new question idea(s) (${locale}); total ${store.ideas.length} in ${ideasPath}`);
