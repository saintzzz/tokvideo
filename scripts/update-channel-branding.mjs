import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

// Rebrands the channel to the story-telling direction (owner decision
// 2026-09-28): title, description, keywords, country, language from
// src/suckhoe/channel-branding.json. Runs inside the publish job (same
// credentials as upload-youtube.mjs), gated by pending-cleanup.json so
// it only applies while the purge flag for this locale is set — after
// the owner removes the flag it stops touching channel settings.
//
// Usage: node scripts/update-channel-branding.mjs --locale=vi|en

const localeArg = process.argv.find((a) => a.startsWith("--locale="));
const locale = localeArg ? localeArg.split("=")[1] : "vi";

const root = path.join(import.meta.dirname, "..");
const branding = JSON.parse(
  await readFile(path.join(root, "src", "suckhoe", "channel-branding.json"), "utf8")
)[locale];
if (!branding) {
  console.error(`No branding config for locale "${locale}"`);
  process.exit(1);
}

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("Branding skipped: YouTube credentials not set.");
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// channels.update requires the FULL brandingSettings back — a partial
// update can wipe fields it didn't return. Read current settings first
// and merge.
const current = await youtube.channels.list({ part: ["brandingSettings"], mine: true });
const existing = current.data.items?.[0]?.brandingSettings ?? {};
const channelId = current.data.items?.[0]?.id;

const updated = {
  ...existing,
  channel: {
    ...(existing.channel ?? {}),
    title: branding.title,
    description: branding.description,
    keywords: branding.keywords,
    country: branding.country,
    defaultLanguage: branding.defaultLanguage,
  },
  image: {
    ...(existing.image ?? {}),
    // Banner art lives in the repo so it's versioned with the brand;
    // YouTube fetches it from the raw GitHub URL on every update.
    bannerExternalUrl: `https://raw.githubusercontent.com/saintzzz/tokvideo/main/public/channel-banner-${locale}.png`,
  },
};

await youtube.channels.update({
  part: ["brandingSettings"],
  requestBody: { id: channelId, brandingSettings: updated },
});

console.log(`Channel ${channelId} rebranded: "${branding.title}" (country=${branding.country}, lang=${branding.defaultLanguage})`);
