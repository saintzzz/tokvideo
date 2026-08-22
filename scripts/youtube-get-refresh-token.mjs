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
  scope: ["https://www.googleapis.com/auth/youtube.upload"],
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
