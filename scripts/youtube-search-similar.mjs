import { google } from "googleapis";

// Two modes, both read-only YouTube Data API calls used by the comment
// outreach pipeline (see scripts/comment-outreach-prompt.txt) to find and
// vet genuinely relevant third-party videos before writing anything:
//
//   node scripts/youtube-search-similar.mjs --locale=vi --query="..."
//     -> public search, up to 15 results: videoId | channelTitle | title
//
//   node scripts/youtube-search-similar.mjs --locale=vi --video-ids=id1,id2
//     -> full title + description (first 500 chars) for specific videos,
//        so a comment can reference actual content instead of just a title
//
// --locale picks which channel's credentials authenticate the call (auth
// only — a search's results aren't scoped to the authenticating channel).
// Falls back to "vi" if omitted.

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
}

const locale = arg("locale") ?? "vi";
const query = arg("query");
const videoIdsArg = arg("video-ids");

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

if (videoIdsArg) {
  const res = await youtube.videos.list({ part: ["snippet"], id: videoIdsArg.split(",") });
  for (const v of res.data.items) {
    console.log(`=== ${v.id} ===`);
    console.log(`Title: ${v.snippet.title}`);
    console.log(`Channel: ${v.snippet.channelTitle}`);
    console.log(`Description: ${v.snippet.description.slice(0, 500)}`);
    console.log("");
  }
} else if (query) {
  const res = await youtube.search.list({
    part: ["snippet"],
    q: query,
    type: ["video"],
    order: "relevance",
    maxResults: 15,
    relevanceLanguage: locale,
  });
  for (const item of res.data.items) {
    console.log(`${item.id.videoId} | ${item.snippet.channelTitle} | ${item.snippet.title}`);
  }
} else {
  console.error("Usage: --query=\"...\" to search, or --video-ids=id1,id2 for details.");
  process.exit(1);
}
