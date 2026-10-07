import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Renders long-form (~20 min, landscape) Suc Khoe episodes. Separate from
// render-suckhoe.mjs (the Shorts) deliberately — these are much longer
// renders and are never part of the "render everything for review" path.
const longFormDir = path.join(import.meta.dirname, "..", "src", "suckhoe", "long-form");
const slugs = (await readdir(longFormDir))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

const requested = process.argv.slice(2);
const targets = requested.length > 0 ? requested : slugs;

for (const slug of targets) {
  if (!slugs.includes(slug)) {
    console.error(`Unknown long-form episode "${slug}". Known: ${slugs.join(", ")}`);
    process.exit(1);
  }
}

// Windows dev machines need REMOTION_BIN_DIR pointing at a working
// ffmpeg build (bundled compositor ffmpeg crashes there) — see
// AGENTS.md "Local renders on Windows". CI leaves it unset.
const binFlag = process.env.REMOTION_BIN_DIR
  ? [`--binaries-directory=${process.env.REMOTION_BIN_DIR}`]
  : [];

// Invoke the Remotion CLI entry point directly with node — `npx` needs
// shell:true on Windows, which concatenates args and breaks
// --binaries-directory paths containing spaces.
const remotionCli = path.join(
  import.meta.dirname,
  "..",
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js"
);

for (const slug of targets) {
  const id = `SucKhoeLong-${slug}`;
  const outFile = `out/${id}.mp4`;
  console.log(`Rendering ${id} -> ${outFile}`);
  const result = spawnSync(process.execPath, [remotionCli, "render", id, outFile, ...binFlag], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
