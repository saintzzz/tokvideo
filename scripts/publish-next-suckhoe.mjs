import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

// Publishes exactly ONE Suc Khoe episode for one locale/channel — the next
// one of that locale not yet recorded in src/suckhoe/published.json — then
// records it there. Meant to be run on a recurring schedule (see
// .github/workflows/render.yml's publish-next-suckhoe job): each tick
// advances that locale's queue by one episode instead of re-publishing
// everything every time.
//
// Usage: node scripts/publish-next-suckhoe.mjs [--locale=vi|en]
// Defaults to "vi" (the original Suc Khoe channel) if omitted.
//
// Order is alphabetical by slug, within the requested locale only — the
// "vi" and "en" channels each have their own independent queue even
// though episodes live in one shared src/suckhoe/episodes/ directory. If
// every episode of that locale has already been published, this logs that
// and exits 0 (not an error) — add more episodes to keep the queue going.

const root = path.join(import.meta.dirname, "..");
const episodesDir = path.join(root, "src", "suckhoe", "episodes");
const publishedPath = path.join(root, "src", "suckhoe", "published.json");

const localeArg = process.argv.find((arg) => arg.startsWith("--locale="));
const locale = localeArg ? localeArg.split("=")[1] : "vi";

const episodeFiles = (await readdir(episodesDir)).filter((f) => f.endsWith(".json"));
const episodes = await Promise.all(
  episodeFiles.map(async (file) => {
    const url = pathToFileURL(path.join(episodesDir, file));
    const mod = await import(url, { with: { type: "json" } });
    return mod.default;
  })
);

const slugs = episodes
  .filter((episode) => (episode.locale ?? "vi") === locale)
  .map((episode) => episode.slug)
  .sort();

let published = {};
try {
  const raw = JSON.parse(await readFile(publishedPath, "utf8"));
  // Normalize legacy plain-string values ("<timestamp>") into objects so
  // the videoId dedupe in upload-youtube.mjs works uniformly.
  published = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? { publishedAt: v } : v])
  );
} catch {
  // no file yet, or unreadable — treat as nothing published
}

const next = slugs.find((slug) => !published[slug]?.publishedAt && !published[slug]?.videoId);

if (!next) {
  console.log(
    `No new Suc Khoe episode to publish for locale "${locale}" — every ${locale} episode in src/suckhoe/episodes/ is already in published.json. Add more episode content to keep the queue going.`
  );
  process.exit(0);
}

console.log(`Publishing next queued episode (locale=${locale}): ${next}`);

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

// The English channel is a separate Google/YouTube account, so it needs
// its own refresh token — but reuses the same OAuth client (Client ID/
// Secret identify the app, not the channel) and can have its own privacy
// default independent of the Vietnamese channel's.
const uploadEnv =
  locale === "en"
    ? {
        YOUTUBE_REFRESH_TOKEN: process.env.YOUTUBE_EN_REFRESH_TOKEN,
        YOUTUBE_PRIVACY_STATUS: process.env.YOUTUBE_EN_PRIVACY_STATUS,
      }
    : {};

run("node", ["scripts/generate-voiceover.mjs", `suckhoe-${next}`]);
run("node", ["scripts/render-suckhoe.mjs", next]);
run("node", ["scripts/upload-youtube.mjs", next], uploadEnv);

// upload-youtube.mjs exits 0 without uploading if YouTube credentials
// aren't configured yet — don't mark the episode published in that case,
// so it gets picked up again once credentials are added.
const refreshToken =
  locale === "en" ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN;
if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !refreshToken) {
  console.log(
    `YouTube credentials for locale "${locale}" not configured — rendered but not marking as published.`
  );
  process.exit(0);
}

// upload-youtube.mjs records the authoritative {publishedAt, videoId}
// right after a successful insert — only fill in a bare entry here when
// it somehow didn't (older script versions, manual upload paths).
if (!published[next]?.videoId) {
  published[next] = { ...(published[next] ?? {}), publishedAt: new Date().toISOString(), locale };
  await writeFile(publishedPath, JSON.stringify(published, null, 2) + "\n");
  console.log(`Recorded ${next} in ${publishedPath}`);
} else {
  console.log(`${next} already recorded with videoId ${published[next].videoId} — nothing to write`);
}
