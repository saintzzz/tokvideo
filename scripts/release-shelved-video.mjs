import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

// Releases exactly ONE already-uploaded-but-private video back to public,
// then removes it from the shelf. Exists specifically to recover the 7
// legitimate episodes caught by the 2026-08-22 mass-upload incident (they
// were privated as an emergency fix, not deleted — real content, just
// dumped all at once by a bug) without dumping them all back to public at
// once and recreating the exact same problem. One per scheduled tick,
// same spirit as scripts/publish-next-suckhoe.mjs.
//
// src/suckhoe/shelved-videos.json is a plain array of {slug, videoId} —
// add to it by hand if another batch ever needs the same treatment.

const root = path.join(import.meta.dirname, "..");
const shelfPath = path.join(root, "src", "suckhoe", "shelved-videos.json");

let shelf = [];
try {
  shelf = JSON.parse(await readFile(shelfPath, "utf8"));
} catch {
  // no file, or unreadable — nothing to release
}

if (shelf.length === 0) {
  console.log("Shelf is empty — nothing to release.");
  process.exit(0);
}

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log(
    "Skipping shelf release: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN not set."
  );
  process.exit(0);
}

const [next, ...rest] = shelf;
console.log(`Releasing shelved video: ${next.slug} (${next.videoId})`);

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

await youtube.videos.update({
  part: ["status"],
  requestBody: {
    id: next.videoId,
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
  },
});

await writeFile(shelfPath, JSON.stringify(rest, null, 2) + "\n");
console.log(`Released ${next.slug}. ${rest.length} remaining on the shelf.`);
