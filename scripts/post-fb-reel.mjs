// Post an FB reel (built by build-fb-reel.mjs) to the Facebook Page via the
// Graph API video_reels 3-phase flow, then comment the full-episode YouTube
// link as the first comment (external links in captions suppress reach).
// Records <slug>-fb in published-long.json so re-runs never double-post.
//
// Usage: node scripts/post-fb-reel.mjs <long-slug>
// Env: FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN, optional FB_API_VERSION (default v21.0)
// Without credentials it exits cleanly with a clear note (posting-pack path).

import { createReadStream, existsSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { arcDisplayName, videoUrl } from "./lib/long-metadata.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/post-fb-reel.mjs <long-slug>");
  process.exit(1);
}

const repoRoot = path.join(import.meta.dirname, "..");
const videoPath = path.join(repoRoot, "out", `fb-reel-${slug}.mp4`);
if (!existsSync(videoPath)) {
  console.error(`Missing reel: ${videoPath} — run build-fb-reel.mjs first.`);
  process.exit(1);
}

const episode = (
  await import(pathToFileURL(path.join(repoRoot, "src", "suckhoe", "long-form", `${slug}.json`)), {
    with: { type: "json" },
  })
).default;

const ledgerPath = path.join(repoRoot, "src", "suckhoe", "published-long.json");
const ledger = existsSync(ledgerPath) ? JSON.parse(await readFile(ledgerPath, "utf8")) : {};
const fbKey = `${slug}-fb`;
if (ledger[fbKey]?.videoId) {
  console.log(`FB reel already posted for ${slug}: ${ledger[fbKey].videoId}`);
  process.exit(0);
}
const longVideoId = ledger[slug]?.videoId ?? null;

const { FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN } = process.env;
const API = `https://graph.facebook.com/${process.env.FB_API_VERSION || "v21.0"}`;
if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
  console.log("Skipping FB post: FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN not set.");
  process.exit(0);
}

async function fbPost(url, params, body) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  const res = await fetch(u, { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(`FB API ${res.status}: ${json.error?.message || res.statusText}`);
  }
  return json;
}

const epNum = slug.match(/-tap-(\d+)$/)?.[1] ?? "";
const arcName = arcDisplayName(episode, slug);
const title = `${arcName} - Tập ${parseInt(epNum, 10)}`;
const hook = (episode.beats?.[0]?.text || "").replace(/\s+/g, " ").trim();
const description = [
  hook.length > 220 ? `${hook.slice(0, 217)}...` : hook,
  "",
  "Xem video đầu tiên ở comment để nghe trọn tập.",
  "",
  "#truyenma #kechuyendem #truyencotich #reels #xuhuong",
].join("\n");

// Phase 1: start
const start = await fbPost(`${API}/${FB_PAGE_ID}/video_reels`, {
  upload_phase: "start",
  access_token: FB_PAGE_ACCESS_TOKEN,
});
const videoId = start.video_id;
const uploadUrl = start.upload_url;
console.log(`reel session started: ${videoId}`);

// Phase 2: upload binary to rupload host
const fileSize = (await stat(videoPath)).size;
const upRes = await fetch(uploadUrl, {
  method: "POST",
  headers: {
    Authorization: `OAuth ${FB_PAGE_ACCESS_TOKEN}`,
    file_offset: "0",
    "Content-Type": "application/octet-stream",
  },
  body: createReadStream(videoPath),
  // Node fetch needs duplex for stream bodies
  duplex: "half",
});
const upJson = await upRes.json().catch(() => ({}));
if (!upRes.ok || upJson.error || !upJson.success) {
  throw new Error(
    `FB upload ${upRes.status}: ${upJson.error?.message || JSON.stringify(upJson)} (size=${fileSize})`,
  );
}
console.log("reel binary uploaded");

// Phase 3: finish + publish
const fin = await fbPost(`${API}/${FB_PAGE_ID}/video_reels`, {
  upload_phase: "finish",
  video_id: videoId,
  video_state: "PUBLISHED",
  title,
  description,
  access_token: FB_PAGE_ACCESS_TOKEN,
});
console.log(`reel publish requested: ${JSON.stringify(fin)}`);

// First comment with the full-episode link (keeps the caption link-free)
if (longVideoId) {
  try {
    await fbPost(`${API}/${videoId}/comments`, {
      message: `Nghe trọn tập trên YouTube: ${videoUrl(longVideoId)}`,
      access_token: FB_PAGE_ACCESS_TOKEN,
    });
    console.log("posted first comment with YT link");
  } catch (e) {
    console.log(`comment failed (non-fatal): ${e.message}`);
  }
}

ledger[fbKey] = {
  videoId,
  publishedAt: new Date().toISOString(),
  platform: "facebook",
};
await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`ledger updated: ${fbKey} -> ${videoId}`);
