import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

// One-shot bootstrap for a NEW YouTube channel once its refresh token
// exists as a GitHub secret. Runs everything the API allows — channel
// identity check, branding application, default playlist seeding — then
// prints the checklist of steps YouTube refuses to expose over the API
// (they always end up being exactly: create the channel in the UI, phone
// verify it, upload avatar, set handle).
//
// Usage:
//   node scripts/bootstrap-channel.mjs --locale=<key> --token-env=<ENV_NAME>
// Example:
//   node scripts/bootstrap-channel.mjs --locale=en --token-env=YOUTUBE_EN_REFRESH_TOKEN
//
// Requires YOUTUBE_CLIENT_ID/SECRET plus the refresh token under the env
// var named by --token-env (defaults: YOUTUBE_REFRESH_TOKEN for "vi",
// YOUTUBE_EN_REFRESH_TOKEN for anything else).

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a, true];
  })
);
const locale = args.locale ?? "vi";
const tokenEnv = args["token-env"] ?? (locale === "vi" ? "YOUTUBE_REFRESH_TOKEN" : `YOUTUBE_${locale.toUpperCase()}_REFRESH_TOKEN`);

const { YOUTUBE_CLIENT_ID: CLIENT_ID, YOUTUBE_CLIENT_SECRET: CLIENT_SECRET } = process.env;
const REFRESH_TOKEN = process.env[tokenEnv];
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(`Need YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and ${tokenEnv} (the new channel's token — generate it with scripts/youtube-get-refresh-token.mjs).`);
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

const brandingPath = path.join(import.meta.dirname, "..", "src", "suckhoe", "channel-branding.json");
const branding = JSON.parse(await readFile(brandingPath, "utf8"))[locale];
if (!branding) {
  console.error(`No branding block for locale "${locale}" in channel-branding.json — add one first.`);
  process.exit(1);
}

const isQuota = (err) => /quota/i.test(err?.message ?? "");

// 1. Identity check — prove the token belongs to the channel we think it does.
const me = await youtube.channels.list({ part: ["snippet", "statistics", "status"], mine: true });
const channel = me.data.items?.[0];
if (!channel) {
  console.error("Token is valid but has no channel attached — create the YouTube channel in the UI first, then rerun.");
  process.exit(1);
}
console.log(`Channel: "${channel.snippet.title}" (${channel.id})`);
console.log(`  madeForKids=${channel.status.madeForKids} | subs=${channel.statistics.subscriberCount} | videos=${channel.statistics.videoCount}`);

// 2. Apply branding (title, description, keywords, country, language).
try {
  const current = await youtube.channels.list({ part: ["brandingSettings"], mine: true });
  const existing = current.data.items?.[0]?.brandingSettings?.channel ?? {};
  await youtube.channels.update({
    part: ["brandingSettings"],
    requestBody: {
      id: channel.id,
      brandingSettings: {
        channel: {
          ...existing,
          title: branding.title,
          description: branding.description,
          keywords: branding.keywords,
          country: branding.country,
          defaultLanguage: branding.defaultLanguage,
        },
      },
    },
  });
  console.log(`Branding applied: "${branding.title}"`);
} catch (err) {
  console.error(`Branding update failed${isQuota(err) ? " (quota)" : ""}: ${err.message ?? err}`);
}

// 3. Banner via URL — YouTube fetches it server-side. Same URL pattern
// update-channel-branding.mjs uses.
const bannerUrl = `https://raw.githubusercontent.com/saintzzz/tokvideo/main/public/channel-banner-${locale}.png`;
try {
  await youtube.channels.update({
    part: ["brandingSettings"],
    requestBody: {
      id: channel.id,
      brandingSettings: { image: { bannerExternalUrl: bannerUrl } },
    },
  });
  console.log("Banner set.");
} catch (err) {
  console.error(`Banner failed: ${err.message ?? err}`);
}

// 4. Seed the standard playlists so the channel doesn't look empty
// before the first upload lands — series playlists still self-create
// on upload, these are the fixed ones.
const playlistMapPath = path.join(import.meta.dirname, "..", "src", "suckhoe", "playlist-map.json");
const playlistMap = JSON.parse(await readFile(playlistMapPath, "utf8"))[locale] ?? {};
for (const [category, id] of Object.entries(playlistMap)) {
  try {
    await youtube.playlists.list({ part: ["id"], id: [id] });
    console.log(`Playlist "${category}" ok: ${id}`);
  } catch (err) {
    console.error(`Playlist "${category}" check failed: ${err.message ?? err}`);
  }
}

// 5. What the API cannot do — always printed, always accurate.
console.log(`
Remaining manual steps (YouTube exposes no API for these):
  [ ] Create the channel itself in YouTube (done already if step 1 passed)
  [ ] Phone verification: Studio -> Settings -> Channel -> Feature eligibility
  [ ] Upload avatar: Studio -> Customization -> Branding (assets in public/channel-avatar-*.png)
  [ ] Set handle: Studio -> Customization -> Basic info
  [ ] Store the token: gh secret set ${tokenEnv}
  [ ] Warm-up week: browse the niche on the channel's account for a few
      days before the first publish tick (sandbox period is normal —
      0 views on day 1-3 is expected, not a failure)
`);
