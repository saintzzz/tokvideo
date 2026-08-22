import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Uploads specific rendered Suc Khoe episodes found under
// src/suckhoe/episodes/ — mirrors scripts/render-suckhoe.mjs's discovery
// so a new episode needs no changes here either.
//
// Deliberately requires explicit slugs (or --all) rather than defaulting
// to "every episode" — a no-args call here uploaded the entire back
// catalog as new public videos with no check against published.json,
// which fired for real from CI on 2026-08-22 (9 episodes went public in
// ~30 seconds). The queue-based scripts/publish-next-suckhoe.mjs is the
// only script that should run unattended; this one is for a human
// deliberately choosing which episode(s) to (re-)upload by hand.
const episodesDir = path.join(
  import.meta.dirname,
  "..",
  "src",
  "suckhoe",
  "episodes"
);
const slugs = (await readdir(episodesDir))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

const requested = process.argv.slice(2);

if (requested.length === 0) {
  console.error(
    "Usage: node scripts/upload-youtube-all.mjs <slug> [<slug> ...] | --all\n" +
      "Refuses to run with no arguments — pass explicit slugs, or --all to " +
      "deliberately upload every episode (this WILL re-upload episodes " +
      "already published via the queue, as new duplicate videos)."
  );
  process.exit(1);
}

const targets = requested.includes("--all") ? slugs : requested;

for (const slug of targets) {
  if (!slugs.includes(slug)) {
    console.error(`Unknown Suc Khoe episode "${slug}". Known: ${slugs.join(", ")}`);
    process.exit(1);
  }
}

for (const slug of targets) {
  const result = spawnSync(
    "node",
    [path.join(import.meta.dirname, "upload-youtube.mjs"), slug],
    { stdio: "inherit", shell: true }
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
