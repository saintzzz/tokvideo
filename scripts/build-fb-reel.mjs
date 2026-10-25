// Build an FB-optimized vertical reel (1080x1920, ~50s) from a long-form episode:
// hook image with Ken Burns zoom + burned-in title/subtitle/brand + first 2 beats
// of narration. Motion + text keeps it out of CMP "static video" territory.
// Output: out/fb-reel-<slug>.mp4
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findFfmpeg } from "./lib/ffmpeg.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/build-fb-reel.mjs <long-slug>");
  process.exit(1);
}

const ep = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.promises.readFile(
      path.join(repoRoot, "src/suckhoe/long-form", `${slug}.json`),
      "utf8",
    )),
);
// Hero image: prefer hook.jpg, then thumb.jpg, then the first sceneImages
// entry (arc-shared assets may live under another episode's dir).
const imgDir = path.join(repoRoot, "public/images/suckhoe-long", slug);
const candidates = [
  path.join(imgDir, "hook.jpg"),
  path.join(imgDir, "thumb.jpg"),
  ...Object.values(ep.sceneImages || ep.images || {}).map((p) =>
    path.join(repoRoot, "public", p)),
];
const img = candidates.find((f) => existsSync(f));
const b0 = path.join(repoRoot, "public/audio/suckhoe-long", slug, "beat-0.mp3");
const b1 = path.join(repoRoot, "public/audio/suckhoe-long", slug, "beat-1.mp3");
for (const f of [b0, b1]) {
  if (!existsSync(f)) {
    console.error(`Missing asset: ${f}`);
    process.exit(1);
  }
}
if (!img) {
  console.error(`Missing hero image for ${slug} (tried ${candidates.length} paths)`);
  process.exit(1);
}

// Title: short arc name + episode number, e.g. "HÔN MA - TẬP 1"
const rawTitle = (ep.title || slug).split("|")[0].trim().toUpperCase();
const tap = (ep.title.match(/tập\s*\d+/i) || [""])[0].toUpperCase();
const title = tap ? `${rawTitle} - ${tap}` : rawTitle;
// Subtitle hook: first clause of beat-0, split into 2 short lines
const hook = (ep.beats?.[0]?.text || "").replace(/\s+/g, " ").trim();
const words = hook.split(" ");
const mid = Math.ceil(words.length / 2);
const sub = `${words.slice(0, mid).join(" ")}\n${words.slice(mid).join(" ")}`;

const tmp = "/tmp";
await writeFile(`${tmp}/fb-t.txt`, title);
await writeFile(`${tmp}/fb-s.txt`, sub);
await writeFile(`${tmp}/fb-brand.txt`, "TRUYỆN MA DÀI KỲ");

const outDir = path.join(repoRoot, "out");
await mkdir(outDir, { recursive: true });
const out = path.join(outDir, `fb-reel-${slug}.mp4`);

const FONT =
  process.env.FB_REEL_FONT ||
  [
    "/Library/Fonts/Arial Unicode.ttf", // macOS
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", // ubuntu CI
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
  ].find((f) => existsSync(f));
if (!FONT) {
  console.error("No Vietnamese-capable font found; set FB_REEL_FONT");
  process.exit(1);
}
const filter = `
[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:4[bg];
[0:v]scale=1080:-2:force_original_aspect_ratio=decrease[fg];
[bg][fg]overlay=(W-w)/2:(H-h)/2[comp];
[comp]zoompan=z='min(1+0.0006*on,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=30:s=1080x1920:fps=30[z];
[z]drawtext=fontfile='${FONT}':textfile=${tmp}/fb-t.txt:fontsize=80:fontcolor=white:borderw=3:bordercolor=black@0.8:x=(w-text_w)/2:y=180,
drawtext=fontfile='${FONT}':textfile=${tmp}/fb-s.txt:fontsize=44:fontcolor=white:borderw=2:bordercolor=black@0.8:line_spacing=14:x=(w-text_w)/2:y=h-430,
drawtext=fontfile='${FONT}':textfile=${tmp}/fb-brand.txt:fontsize=34:fontcolor=white@0.9:borderw=2:bordercolor=black@0.7:x=(w-text_w)/2:y=h-140[v]`;

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("No runnable ffmpeg found (FFMPEG_BIN / PATH / remotion bundle).");
  process.exit(1);
}
execFileSync(
  ffmpeg,
  [
    "-y", "-loop", "1", "-framerate", "1", "-t", "52", "-i", img,
    "-i", b0, "-i", b1,
    "-filter_complex", filter,
    "-map", "[v]",
    "-filter_complex", "[1:a][2:a]concat=n=2:v=0:a=1[a]",
    "-map", "[a]",
    "-t", "50",
    "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    out,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`Wrote ${out}`);
