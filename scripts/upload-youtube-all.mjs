import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Uploads every rendered Suc Khoe episode found under
// src/suckhoe/episodes/ — mirrors scripts/render-suckhoe.mjs's discovery
// so a new episode needs no changes here either.
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
const targets = requested.length > 0 ? requested : slugs;

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
