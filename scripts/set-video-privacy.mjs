import { google } from "googleapis";

// Sets privacyStatus on specific existing YouTube videos by ID. Manual/
// incident-response tool — not part of the automated pipeline. Built to
// pull back the batch of episodes accidentally published all at once by
// the render-suckhoe CI bug on 2026-08-22 (see git history for
// .github/workflows/render.yml and scripts/upload-youtube-all.mjs).
//
// Usage: node scripts/set-video-privacy.mjs <private|public|unlisted> <videoId> [<videoId> ...]

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN must be set."
  );
  process.exit(1);
}

const [privacyStatus, ...videoIds] = process.argv.slice(2);

if (!["private", "public", "unlisted"].includes(privacyStatus) || videoIds.length === 0) {
  console.error(
    "Usage: node scripts/set-video-privacy.mjs <private|public|unlisted> <videoId> [<videoId> ...]"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

let failures = 0;

for (const videoId of videoIds) {
  try {
    await youtube.videos.update({
      part: ["status"],
      requestBody: {
        id: videoId,
        status: { privacyStatus, selfDeclaredMadeForKids: false },
      },
    });
    console.log(`${videoId}: set to ${privacyStatus}`);
  } catch (err) {
    failures += 1;
    console.error(`${videoId}: FAILED - ${err.message ?? err}`);
  }
}

// Exit nonzero if anything failed — a run that "succeeds" in CI while
// every single update silently failed (e.g. insufficient token scope) is
// exactly how the 2026-08-22 incident stayed unnoticed as long as it did.
if (failures > 0) {
  console.error(`${failures}/${videoIds.length} update(s) failed.`);
  process.exit(1);
}
