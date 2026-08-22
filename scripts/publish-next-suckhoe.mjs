import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Publishes exactly ONE Suc Khoe episode — the next one not yet recorded
// in src/suckhoe/published.json — then records it there. Meant to be run
// on a recurring schedule (see .github/workflows/render.yml's
// publish-next-suckhoe job): each tick advances the queue by one episode
// instead of re-publishing everything every time.
//
// Order is alphabetical by slug. If every episode has already been
// published, this logs that and exits 0 (not an error) — add more
// episodes to src/suckhoe/episodes/ to keep the queue going.

const root = path.join(import.meta.dirname, "..");
const episodesDir = path.join(root, "src", "suckhoe", "episodes");
const publishedPath = path.join(root, "src", "suckhoe", "published.json");

const slugs = (await readdir(episodesDir))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

let published = {};
try {
  published = JSON.parse(await readFile(publishedPath, "utf8"));
} catch {
  // no file yet, or unreadable — treat as nothing published
}

const next = slugs.find((slug) => !published[slug]);

if (!next) {
  console.log(
    "No new Suc Khoe episode to publish — every episode in src/suckhoe/episodes/ is already in published.json. Add more episode content to keep the queue going."
  );
  process.exit(0);
}

console.log(`Publishing next queued episode: ${next}`);

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("node", ["scripts/generate-voiceover.mjs", `suckhoe-${next}`]);
run("node", ["scripts/render-suckhoe.mjs", next]);
run("node", ["scripts/upload-youtube.mjs", next]);

// upload-youtube.mjs exits 0 without uploading if YouTube credentials
// aren't configured yet — don't mark the episode published in that case,
// so it gets picked up again once credentials are added.
if (
  !process.env.YOUTUBE_CLIENT_ID ||
  !process.env.YOUTUBE_CLIENT_SECRET ||
  !process.env.YOUTUBE_REFRESH_TOKEN
) {
  console.log(
    "YouTube credentials not configured — rendered but not marking as published."
  );
  process.exit(0);
}

published[next] = { publishedAt: new Date().toISOString() };
await writeFile(publishedPath, JSON.stringify(published, null, 2) + "\n");
console.log(`Recorded ${next} in ${publishedPath}`);
