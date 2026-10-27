// Prepares a MoneyPrinterTurbo task for one long-form episode:
//   1. Concatenates beat-0..N-1.mp3 into out/mpt/<slug>.mp3 (custom audio)
//   2. Copies the episode's scene images (story order) into
//      <mpt>/storage/local_videos/<slug>-*.jpg
//   3. Prints the cli.py command to run inside MoneyPrinterTurbo.
//
// Usage: node scripts/prep-mpt-task.mjs <slug> [--exec]
//   --exec also runs the ffmpeg concat + file copies (default: do it too —
//   there is no dry-run; the flag exists for future streaming use)

import { existsSync } from "node:fs";
import { mkdir, writeFile, copyFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { findFfmpeg } from "./lib/ffmpeg.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/prep-mpt-task.mjs <slug>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const mptRoot = "C:/Users/linhl/LOCAL_DEVIN/MoneyPrinterTurbo";
const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("No ffmpeg (set FFMPEG_BIN).");
  process.exit(1);
}

const episode = (
  await import(pathToFileURL(path.join(root, "src", "suckhoe", "long-form", `${slug}.json`)), {
    with: { type: "json" },
  })
).default;

// 1. concat audio
const outDir = path.join(root, "out", "mpt");
await mkdir(outDir, { recursive: true });
const audioDir = path.join(root, "public", "audio", "suckhoe-long", slug);
const listFile = path.join(outDir, `${slug}-concat.txt`);
const fwd = (p) => p.split(path.sep).join("/");
const list = episode.beats
  .map((_, i) => `file '${fwd(path.join(audioDir, `beat-${i}.mp3`))}'`)
  .join("\n");
await writeFile(listFile, list);
const audioOut = path.join(outDir, `${slug}.mp3`);
execFileSync(ffmpeg, [
  "-y", "-f", "concat", "-safe", "0", "-i", listFile,
  "-c:a", "libmp3lame", "-q:a", "4", audioOut,
], { stdio: "inherit" });

// 2. copy scene images, preserving story order, into MPT local_videos
const lvDir = path.join(mptRoot, "storage", "local_videos");
await mkdir(lvDir, { recursive: true });
const imgDir = path.join(root, "public", "images", "suckhoe-long", slug);
const copied = [];
if (existsSync(imgDir)) {
  const files = (await readdir(imgDir))
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && f !== "thumb.jpg")
    // hook first, then scene order (part-N sorted numerically)
    .sort((a, b) => {
      const rank = (f) => (f === "hook.jpg" ? -1 : Number(f.match(/\d+/)?.[0] ?? 99));
      return rank(a) - rank(b);
    });
  for (const f of files) {
    const dest = path.join(lvDir, `${slug}-${f}`);
    await copyFile(path.join(imgDir, f), dest);
    copied.push(dest);
  }
}
if (!copied.length) {
  console.error(`No scene images under ${imgDir}`);
  process.exit(1);
}

// 3. script text for whisper subtitle reference (full narration)
const script = episode.beats.map((b) => b.text).join("\n");
const scriptFile = path.join(outDir, `${slug}-script.txt`);
await writeFile(scriptFile, script, "utf8");

console.log(`\nPrepared ${slug}: ${copied.length} images, audio ${audioOut}`);
console.log(`Run inside ${mptRoot}:`);
console.log(
  `.venv/Scripts/python.exe cli.py ` +
    `--video-subject "${episode.title}" ` +
    `--video-source local ` +
    `--video-materials "${copied.map((p) => fwd(p)).join(",")}" ` +
    `--custom-audio-file "${fwd(audioOut)}" ` +
    `--video-aspect "16:9" --video-concat-mode sequential`
);
