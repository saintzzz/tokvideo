// Builds a ~50s vertical teaser (1080x1920) for a long-form episode:
// the episode's hook image as a blurred-fill background + the first
// beats of committed narration audio, faded out. Pure ffmpeg — no
// Remotion, no TTS, so it runs fine on CI where Edge TTS is blocked.
//
// Usage: node scripts/make-long-teaser.mjs <slug>
// Output: out/teaser-<slug>.mp4  → uploaded by upload-long-teaser.mjs

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { findFfmpeg } from "./lib/ffmpeg.mjs";
import { probeDurationSeconds } from "./lib/audio-probe.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/make-long-teaser.mjs <episode-slug>");
  process.exit(1);
}

const TARGET_SEC = 50;
const repoRoot = path.join(import.meta.dirname, "..");

const episodeFile = path.join(repoRoot, "src", "suckhoe", "long-form", `${slug}.json`);
const episode = (await import(pathToFileURL(episodeFile), { with: { type: "json" } })).default;
if (!episode.beats.every((b) => b.speaker === "narrator")) {
  console.error(`"${slug}" is not a narrator story episode — teasers are story-only.`);
  process.exit(1);
}

const imgDir = path.join(repoRoot, "public", "images", "suckhoe-long", slug);
const imgCandidates = [
  path.join(imgDir, "hook.jpg"),
  path.join(imgDir, "thumb.jpg"),
  ...Object.values(episode.sceneImages || episode.images || {}).map((p) =>
    path.join(repoRoot, "public", p)),
];
const hookPath = imgCandidates.find((f) => existsSync(f));
if (!hookPath) {
  console.error(`Missing hero image for ${slug} (tried ${imgCandidates.length} paths)`);
  process.exit(1);
}

const audioDir = path.join(repoRoot, "public", "audio", "suckhoe-long", slug);
const beats = [];
let total = 0;
for (let i = 0; i < episode.beats.length; i++) {
  const f = path.join(audioDir, `beat-${i}.mp3`);
  if (!existsSync(f)) break;
  const d = probeDurationSeconds(f) ?? 0;
  beats.push({ file: f, sec: d });
  total += d;
  // Take one extra beat past the target so the fade doesn't land
  // mid-word right at the cap — atrim cuts it anyway.
  if (total >= TARGET_SEC) break;
}
if (!beats.length) {
  console.error(`No committed beat audio under ${audioDir}`);
  process.exit(1);
}
console.log(`Teaser audio: ${beats.length} beats, ~${total.toFixed(1)}s -> capped at ${TARGET_SEC}s`);

const outDir = path.join(repoRoot, "out");
await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `teaser-${slug}.mp4`);

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("No runnable ffmpeg found (FFMPEG_BIN / PATH / remotion bundle).");
  process.exit(1);
}

// Inputs: 0 = hook image (looped), 1..N = beat mp3s.
const inputs = ["-loop", "1", "-i", hookPath];
for (const b of beats) inputs.push("-i", b.file);

const audioIns = beats.map((_, i) => `[${i + 1}:a]`).join("");
const fadeStart = TARGET_SEC - 3;
const filter = [
  `${audioIns}concat=n=${beats.length}:v=0:a=1[ca]`,
  `[ca]atrim=0:${TARGET_SEC},afade=t=out:st=${fadeStart}:d=3[aout]`,
  `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=16:3[bg]`,
  `[0:v]scale=1080:-2:force_original_aspect_ratio=decrease[fg]`,
  `[bg][fg]overlay=(W-w)/2:(H-h)/2[v]`,
].join(";");

execFileSync(
  ffmpeg,
  [
    "-y",
    ...inputs,
    "-filter_complex", filter,
    "-map", "[v]",
    "-map", "[aout]",
    "-t", String(TARGET_SEC),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "21",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    outPath,
  ],
  { stdio: "inherit" }
);

console.log(`Teaser written: ${outPath}`);
