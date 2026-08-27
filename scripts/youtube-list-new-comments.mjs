import { google } from "googleapis";

// Lists the most recent top-level comments across ALL of a channel's own
// videos, for the daily "reply to your own audience" pipeline (see
// scripts/reply-comments-prompt.txt). Engagement research (2026-08-23):
// replying on your own videos is unambiguously safe (no outreach/ToS risk,
// it's your own content) and a real ranking signal — YouTube reads
// back-and-forth conversation on a video as a sign of an engaged audience.
//
// Usage: node scripts/youtube-list-new-comments.mjs --locale=vi
//
// Prints one line per comment: commentId | totalReplyCount | videoId |
// author | text (single line, newlines stripped). totalReplyCount > 0
// means SOMEONE already replied (not necessarily us) — the prompt cross-
// checks against src/suckhoe/replied-comments-log.json for certainty.

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
}

const locale = arg("locale") ?? "vi";

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = locale === "en" ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / (YOUTUBE_REFRESH_TOKEN or YOUTUBE_EN_REFRESH_TOKEN).");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

const channelRes = await youtube.channels.list({ part: ["id"], mine: true });
const channelId = channelRes.data.items?.[0]?.id;
if (!channelId) {
  console.error("Could not resolve own channel id.");
  process.exit(1);
}

const res = await youtube.commentThreads.list({
  part: ["snippet"],
  allThreadsRelatedToChannelId: channelId,
  order: "time",
  maxResults: 30,
  textFormat: "plainText",
});

// Filter out the channel's OWN comments (2026-08-27 finding: this channel
// is a repurposed 12-year-old account with a prior life as a bushcraft/
// camping channel — allThreadsRelatedToChannelId returns that channel's
// FULL comment history, not just comments on its current videos, so
// dozens of old self-authored promotional comments from Dec 2025/Jan
// 2026 on OTHER channels' videos completely buried any real audience
// comments on actual Suc Khoe content under "order: time"). Comparing
// authorChannelId against our own resolved channelId is robust to
// content/handle changes, unlike matching on display name or topic.
const threads = (res.data.items ?? []).filter(
  (thread) => thread.snippet.topLevelComment.snippet.authorChannelId?.value !== channelId
);

if (threads.length === 0) {
  console.log("No genuine audience comments found (only this channel's own historical comments on other videos).");
}

for (const thread of threads) {
  const top = thread.snippet.topLevelComment.snippet;
  const oneLine = top.textDisplay.replace(/\s+/g, " ").trim();
  console.log(
    `${thread.id} | ${thread.snippet.totalReplyCount} | ${top.videoId} | ${top.authorDisplayName} | ${oneLine}`
  );
}
