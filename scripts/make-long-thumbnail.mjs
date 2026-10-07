import { existsSync } from "node:fs";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { findFfmpeg } from "./lib/ffmpeg.mjs";

// Builds a 1280x720 YouTube thumbnail for one long-form episode.
//
// Source image: the episode's `hook` scene still when available
// (public/images/suckhoe-long/... — generated, consistent, and always
// present even before the video renders); falls back to a frame at
// 120s inside the rendered mp4 for remedy episodes without sceneImages.
//
// Layout: slight brighten (the horror stills are very dark), a dark
// lower-half gradient for text contrast, a red "TẬP N" badge top-left,
// the series name in gold above a large bold `thumbTitle` bottom-left.
//
// Usage: node scripts/make-long-thumbnail.mjs <episode-slug>
// Output: out/SucKhoeLong-<slug>-thumb.png

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/make-long-thumbnail.mjs <episode-slug>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "out");
const videoPath = path.join(outDir, `SucKhoeLong-${slug}.mp4`);
const thumbPath = path.join(outDir, `SucKhoeLong-${slug}-thumb.png`);

const longFormDir = path.join(root, "src", "suckhoe", "long-form");
const episode = (await import(pathToFileURL(path.join(longFormDir, `${slug}.json`)), { with: { type: "json" } })).default;

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("No runnable ffmpeg found (set FFMPEG_BIN).");
  process.exit(1);
}

// hook still -> rendered frame -> fail
const hookRel = episode.sceneImages?.hook;
const hookPath = hookRel ? path.join(root, "public", hookRel) : null;
let inputArgs;
if (hookPath && existsSync(hookPath)) {
  inputArgs = ["-loop", "1", "-i", hookPath];
} else if (existsSync(videoPath)) {
  inputArgs = ["-ss", "120", "-i", videoPath];
} else {
  console.error(`No hook image and no rendered video at ${videoPath}.`);
  process.exit(1);
}

const epNum = (slug.match(/tap-(\d+)/)?.[1] ?? "1").replace(/^0/, "");
const badge = `TẬP ${epNum}`;
const thumbTitle = episode.thumbTitle ?? episode.title.replace(/\s*\|\s*/g, " · ");
const series = episode.title.split("|")[0]?.trim() ?? "";

// drawtext wants a font file; probe the usual locations (Ubuntu runners
// ship DejaVu, macOS has Arial in Supplemental, Windows has arialbd).
const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/System/Library/Fonts/Helvetica.ttc",
  "C:/Windows/Fonts/arialbd.ttf",
];
const font = FONT_CANDIDATES.find(existsSync);
if (!font) {
  console.error("No usable font found for drawtext.");
  process.exit(1);
}

// Write text through files — drawtext's text= escaping is brittle with
// Vietnamese punctuation (colons, apostrophes).
const tmp = await mkdtemp(path.join(tmpdir(), "thumb-"));
const badgeFile = path.join(tmp, "badge.txt");
const titleFile = path.join(tmp, "title.txt");
const seriesFile = path.join(tmp, "series.txt");
await writeFile(badgeFile, badge, "utf8");
await writeFile(titleFile, thumbTitle, "utf8");
await writeFile(seriesFile, series, "utf8");

// ffmpeg filtergraph treats `:` as an option separator — Windows drive
// letters ("C:/...") must have it escaped, and backslashes turned to /.
const fpath = (p) => p.replace(/\\/g, "/").replace(/:/g, "\\:");

const result = spawnSync(
  ffmpeg,
  [
    "-y",
    ...inputArgs,
    "-vf",
    [
      "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
      // horror stills are intentionally very dark — lift them a touch so
      // the scene reads at thumbnail size
      "eq=brightness=0.05:contrast=1.05:saturation=1.1",
      // lower-half dark gradient for text contrast
      "drawbox=y=ih*0.45:w=iw:h=ih*0.55:color=black@0.6:t=fill",
      // red episode badge top-left
      "drawbox=x=44:y=44:w=170:h=66:color=0xB02A20@0.95:t=fill",
      `drawtext=fontfile='${fpath(font)}':textfile='${fpath(badgeFile)}':fontcolor=white:fontsize=36:x=60:y=56`,
      // series name in gold, then the big hook line
      `drawtext=fontfile='${fpath(font)}':textfile='${fpath(seriesFile)}':fontcolor=0xE8B84B:fontsize=34:x=60:y=h-236`,
      `drawtext=fontfile='${fpath(font)}':textfile='${fpath(titleFile)}':fontcolor=white:fontsize=56:x=60:y=h-180:borderw=3:bordercolor=black@0.85:line_spacing=8`,
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
