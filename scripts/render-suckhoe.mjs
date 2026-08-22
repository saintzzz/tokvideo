import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Renders every Suc Khoe episode found under src/suckhoe/episodes/ — new
// episodes are picked up automatically, no need to add a render script per
// episode.
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

// Pass one or more slugs as CLI args to render only those.
const requested = process.argv.slice(2);
const targets = requested.length > 0 ? requested : slugs;

for (const slug of targets) {
  if (!slugs.includes(slug)) {
    console.error(`Unknown Suc Khoe episode "${slug}". Known: ${slugs.join(", ")}`);
    process.exit(1);
  }
}

for (const slug of targets) {
  const id = `SucKhoe-${slug}`;
  const outFile = `out/${id}.mp4`;
  console.log(`Rendering ${id} -> ${outFile}`);
  const result = spawnSync(
    "npx",
    ["remotion", "render", id, outFile],
    { stdio: "inherit", shell: true }
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
