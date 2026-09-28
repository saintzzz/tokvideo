import { existsSync } from "node:fs";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Builds a 1280x720 YouTube thumbnail for one long-form episode: grabs a
// frame from inside the rendered video (past the intro), darkens the lower
// third, and stamps the episode title on it. Long-form CTR lives and dies
// by the thumbnail — the auto-picked frame alone is not enough.
//
// Usage: node scripts/make-long-thumbnail.mjs <episode-slug>
// Output: out/SucKhoeLong-<slug>-thumb.png

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/make-long-thumbnail.mjs <episode-slug>");
  process.exit(1);
}

const outDir = path.join(import.meta.dirname, "..", "out");
const videoPath = path.join(outDir, `SucKhoeLong-${slug}.mp4`);
const thumbPath = path.join(outDir, `SucKhoeLong-${slug}-thumb.png`);

if (!existsSync(videoPath)) {
  console.error(`No rendered video at ${videoPath} — render first.`);
  process.exit(1);
}

const longFormDir = path.join(import.meta.dirname, "..", "src", "suckhoe", "long-form");
const episode = (await import(pathToFileURL(path.join(longFormDir, `${slug}.json`)), { with: { type: "json" } })).default;
const title = episode.title.replace(/\s*\|\s*/g, " · ");

// drawtext wants a font file; probe the usual locations (Ubuntu runners
// ship DejaVu, macOS has Arial in Supplemental).
const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/System/Library/Fonts/Helvetica.ttc",
];
const font = FONT_CANDIDATES.find(existsSync);
if (!font) {
  console.error("No usable font found for drawtext.");
  process.exit(1);
}

// Write the title through a file — drawtext's text= escaping is brittle
// with Vietnamese punctuation (colons, apostrophes in titles).
const tmp = await mkdtemp(path.join(tmpdir(), "thumb-"));
const titleFile = path.join(tmp, "title.txt");
await writeFile(titleFile, title, "utf8");

// Frame from ~2 minutes in: past the hook card, into the actual scene.
const result = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-ss", "120",
    "-i", videoPath,
    "-vf",
    [
      "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
      "drawbox=y=ih-300:w=iw:h=300:color=black@0.6:t=fill",
      `drawtext=fontfile='${font}':textfile='${titleFile}':fontcolor=white:fontsize=46:x=60:y=h-260:borderw=2:bordercolor=black@0.8:line_spacing=10`,
    ].join(","),
    "-frames:v", "1",
    thumbPath,
  ],
  { stdio: "inherit" }
);

await rm(tmp, { recursive: true, force: true });

if (result.status !== 0 || !existsSync(thumbPath)) {
  console.error("ffmpeg thumbnail generation failed");
  process.exit(result.status ?? 1);
}
console.log(`Thumbnail written: ${thumbPath}`);
