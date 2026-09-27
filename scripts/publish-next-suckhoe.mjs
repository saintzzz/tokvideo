import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

// Publishes the next queue position for one locale/channel — usually ONE
// episode, but when the next episode belongs to a story series
// (seriesTitle), ALL of that series' remaining unpublished parts go out
// in the same tick so viewers get the whole arc at once. Recorded in
// src/suckhoe/published.json. Meant to be run on a recurring schedule
// (see .github/workflows/render.yml's publish-next-suckhoe job): each
// tick advances that locale's queue instead of re-publishing everything.
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

// Serialized stories: a series lands ALL its remaining parts in the
// same tick. Spreading parts across days kills retention — a viewer
// who finishes part 1 wants part 2 immediately, not tomorrow. Only
// still-unpublished parts are batched, so a mid-series failure resumes
// cleanly on the next tick.
const nextEpisode = episodes.find((e) => e.slug === next);
const isUnpublished = (slug) => !published[slug]?.publishedAt && !published[slug]?.videoId;
const batch = nextEpisode?.seriesTitle
  ? episodes
      .filter(
        (e) =>
          (e.locale ?? "vi") === locale &&
          e.seriesTitle === nextEpisode.seriesTitle &&
          isUnpublished(e.slug)
      )
      .sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
      .map((e) => e.slug)
  : [next];

console.log(
  batch.length > 1
    ? `Publishing full series "${nextEpisode.seriesTitle}" (${batch.length} parts, locale=${locale}): ${batch.join(", ")}`
    : `Publishing next queued episode (locale=${locale}): ${next}`
);

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

// Owner-ordered channel purge (docs/CHANNEL-CLEANUP.md): when
// pending-cleanup.json flags this locale, wipe every video not tied to a
// current story episode BEFORE publishing anything new. The script
// clears its own flag when finished — a partial run (quota) resumes on
// the next tick instead of re-deleting.
const cleanupFlagPath = path.join(root, "src", "suckhoe", "pending-cleanup.json");
try {
  const flag = JSON.parse(await readFile(cleanupFlagPath, "utf8"));
  if (flag[locale]) {
    console.log(`pending-cleanup flag set for "${locale}" — running channel purge first.`);
    run("node", ["scripts/cleanup-channel-videos.mjs", `--locale=${locale}`], uploadEnv);
  }
} catch {
  // no flag file — normal publish path
}

for (const slug of batch) {
  console.log(`\n--- ${slug} ---`);
  run("node", ["scripts/generate-voiceover.mjs", `suckhoe-${slug}`]);
  run("node", ["scripts/render-suckhoe.mjs", slug]);
  run("node", ["scripts/upload-youtube.mjs", slug], uploadEnv);
}

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
// Re-read the file first: upload-youtube.mjs may have just written the
// videoId, and this script's `published` map was loaded BEFORE the
// upload ran — writing the stale map back used to clobber the videoId,
// silently breaking the videoId dedupe on every publish.
try {
  const fresh = JSON.parse(await readFile(publishedPath, "utf8"));
  published = Object.fromEntries(
    Object.entries(fresh).map(([k, v]) => [k, typeof v === "string" ? { publishedAt: v } : v])
  );
} catch {
  // unreadable — keep the earlier snapshot
}
let wroteAny = false;
for (const slug of batch) {
  if (published[slug]?.videoId) {
    console.log(`${slug} already recorded with videoId ${published[slug].videoId} — nothing to write`);
    continue;
  }
  published[slug] = { ...(published[slug] ?? {}), publishedAt: new Date().toISOString(), locale };
  wroteAny = true;
  console.log(`Recorded ${slug} in ${publishedPath}`);
}
if (wroteAny) {
  await writeFile(publishedPath, JSON.stringify(published, null, 2) + "\n");
}
