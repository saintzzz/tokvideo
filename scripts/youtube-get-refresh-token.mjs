import { createServer } from "node:http";
import { google } from "googleapis";

// One-time, run locally by hand — NOT part of CI. Exchanges your Google
// login for a refresh token that CI can then use forever (until you revoke
// it) to upload videos without you logging in again.
//
// Setup before running this:
// 1. https://console.cloud.google.com/ → create a project (or reuse one).
// 2. Enable "YouTube Data API v3" (APIs & Services → Library).
// 3. APIs & Services → Credentials → Create Credentials → OAuth client ID
//    → Application type "Desktop app".
// 4. Under that client's settings, add this exact Authorized redirect URI:
//      http://localhost:8080
// 5. Copy the Client ID and Client secret, then run:
//      YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... node scripts/youtube-get-refresh-token.mjs
// 6. A URL will print — open it, log into the YouTube channel's Google
//    account, approve. The script prints a refresh token; save it as the
//    GitHub secret YOUTUBE_REFRESH_TOKEN (along with YOUTUBE_CLIENT_ID and
//    YOUTUBE_CLIENT_SECRET as their own secrets).
//
// Already have a refresh token from before? Run this again and replace the
// GitHub secret — the scopes below now also include read-only channel/video
// stats + YouTube Analytics, needed for scripts/channel-report.mjs. A token
// issued under the old upload-only scope will fail on those calls with a
// 403 (insufficient scope) until you re-run this and update the secret.
//
// 2026-08-23: added youtube.force-ssl. Manage-only scope covers uploads,
// metadata, playlists, and privacy changes, but NOT posting or moderating
// comments (commentThreads.insert) — confirmed the hard way when the
// comment-outreach growth tactic failed with "insufficient authentication
// scopes" on a manage-scope token. force-ssl is the superset (manage +
// comments/moderation + ratings + subscriptions), requested once here so we
// don't hit a third scope wall later. Run this for BOTH channels (VI and
// EN are separate Google accounts) and update both YOUTUBE_REFRESH_TOKEN
// and YOUTUBE_EN_REFRESH_TOKEN secrets.
//
// 2026-09-02: both refresh tokens died with GaxiosError invalid_grant /
// "Token has been expired or revoked" — 57% of scheduled publish runs
// failed for ~5 days (2026-08-28 onward) before this was caught. Root
// cause: a Google Cloud OAuth consent screen left in "Testing" publishing
// status issues refresh tokens that hard-expire after 7 days, no matter
// how often they're used — re-running this script only buys another 7
// days. THE ACTUAL FIX: in Google Cloud Console -> APIs & Services ->
// OAuth consent screen, check "Publishing status" for the project behind
// YOUTUBE_CLIENT_ID/SECRET. If it says "Testing", move it to "In
// production" (no Google verification review is required to do this for
// an app requesting only YouTube scopes under 100 users — verification is
// a separate, optional step). Do this once and the 7-day expiry stops
// recurring. If it already says "In production" and this still happened,
// something else revoked the token (manually, or a Google account
// security event) and only re-running this script fixes it.

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:8080";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars first (see the comment at the top of this file)."
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    // Superset of "https://www.googleapis.com/auth/youtube" — everything
    // that scope covers (uploads, metadata, playlists, privacy changes)
    // PLUS posting/moderating comments, ratings, and subscriptions.
    // Requesting the broad scope once instead of the narrow one so a new
    // use case (comment outreach, liking a video, etc.) doesn't need yet
    // another re-auth round later.
    "https://www.googleapis.com/auth/youtube.force-ssl",
    // Analytics API is a separate scope regardless — needed by
    // scripts/channel-report.mjs for real subscriber/view/retention data.
    "https://www.googleapis.com/auth/yt-analytics.readonly",
  ],
});

console.log("\nOpen this URL, log into the YOUTUBE CHANNEL's Google account, and approve:\n");
console.log(authUrl);
console.log("\nWaiting for you to approve in the browser...\n");

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, REDIRECT_URI);
    const codeParam = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      res.end("Authorization failed, you can close this tab.");
      server.close();
      reject(new Error(`OAuth error: ${errorParam}`));
      return;
    }

    if (codeParam) {
      res.end("Authorization received, you can close this tab.");
      server.close();
      resolve(codeParam);
    }
  });

  server.listen(8080);
});

const { tokens } = await oauth2Client.getToken(code);

console.log("Success. Save this as the GitHub secret YOUTUBE_REFRESH_TOKEN:\n");
console.log(tokens.refresh_token);
console.log(
  "\n(Also save YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET as their own secrets — same values you passed in above.)"
);
