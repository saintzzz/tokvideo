import { createReadStream } from "node:fs";
import { google } from "googleapis";

// Uploads and sets a channel's banner ("channel art") — unlike the profile
// picture/avatar, YouTube DOES support this via the Data API, so it's
// fully automated here (no manual YouTube Studio step needed).
//
// Usage: node scripts/set-channel-banner.mjs --locale=vi --image=out/banner-vi.png
//
// Needs a refresh token with the youtube.force-ssl (or plain youtube)
// scope — see scripts/youtube-get-refresh-token.mjs.

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
}

const locale = arg("locale") ?? "vi";
const imagePath = arg("image");

if (!imagePath) {
  console.error("Usage: node scripts/set-channel-banner.mjs --locale=vi|en --image=path/to/banner.png");
  process.exit(1);
}

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

const channelRes = await youtube.channels.list({ part: ["id", "snippet", "brandingSettings"], mine: true });
const channel = channelRes.data.items?.[0];
if (!channel) {
  console.error("Could not resolve own channel.");
  process.exit(1);
}

console.log(`Uploading banner for "${channel.snippet.title}" (${channel.id})...`);

const bannerRes = await youtube.channelBanners.insert({
  media: { body: createReadStream(imagePath) },
});
const bannerUrl = bannerRes.data.url;
console.log(`Banner image uploaded: ${bannerUrl}`);

// channels.update replaces the WHOLE brandingSettings part, not just the
// field you send — merge onto the existing settings (fetched above)
// instead of sending only {image: ...}, which 400s with an unhelpful
// "Required" error (confirmed 2026-08-23).
const brandingSettings = {
  ...channel.brandingSettings,
  image: { ...channel.brandingSettings?.image, bannerExternalUrl: bannerUrl },
};

await youtube.channels.update({
  part: ["brandingSettings"],
  requestBody: { id: channel.id, brandingSettings },
});

console.log("Channel banner set.");
