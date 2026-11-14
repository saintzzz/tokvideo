// Hard visual-coverage gate for long-form episodes.
// Every beat MUST resolve to a beatImages entry, a sceneImages still, or a
// sceneVideos clip — otherwise DialogueScene falls back to the procedural
// dark background, which ships as a near-black video (observed
// 2026-11-14: chiec-khan-trang-tap-02 uploaded black because the arc had
// scenePrompts but generate-story-visuals --long never ran for it).
//
// Usage: node scripts/verify-scene-visuals.mjs <slug> [--post-render <mp4>]
//   --post-render additionally samples frames from the rendered mp4 and
//   fails when the mean luma is black-level (catches cases where the JSON
//   looks covered but the render still produced darkness).
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const [slug, ...rest] = process.argv.slice(2);
const postIdx = rest.indexOf("--post-render");
const mp4 = postIdx >= 0 ? rest[postIdx + 1] : null;

if (!slug) {
  console.error("usage: node scripts/verify-scene-visuals.mjs <slug> [--post-render <mp4>]");
  process.exit(2);
}

const ep = JSON.parse(
  await readFile(path.join(root, "src/suckhoe/long-form", `${slug}.json`), "utf8"),
);

const missing = [];
const covered = { image: 0, video: 0 };
ep.beats.forEach((beat, i) => {
  const img = ep.beatImages?.[i] ?? ep.sceneImages?.[beat.scene];
  const vid = ep.sceneVideos?.[beat.scene];
  if (vid) covered.video += 1;
  else if (img) covered.image += 1;
  else missing.push({ beat: i, scene: beat.scene });
});

// Verify referenced files actually exist under public/.
const fileMissing = [];
const refs = new Set([
  ...Object.values(ep.sceneImages ?? {}),
  ...Object.values(ep.beatImages ?? {}),
  ...Object.values(ep.sceneVideos ?? {}),
]);
for (const rel of refs) {
  try {
    await access(path.join(root, "public", rel));
  } catch {
    fileMissing.push(rel);
  }
}

if (fileMissing.length) {
  console.error(`VISUAL-GATE FAIL ${slug}: ${fileMissing.length} referenced file(s) missing:`);
  fileMissing.slice(0, 10).forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

if (missing.length) {
  console.error(
    `VISUAL-GATE FAIL ${slug}: ${missing.length}/${ep.beats.length} beats have no image and no clip:`,
  );
  missing.slice(0, 10).forEach((m) => console.error(`  beat ${m.beat} scene=${m.scene}`));
  console.error("Run: node scripts/generate-story-visuals.mjs --long " + slug);
  process.exit(1);
}

console.log(
  `VISUAL-GATE OK ${slug}: ${ep.beats.length} beats covered (image=${covered.image} video=${covered.video})`,
);

if (!mp4) process.exit(0);

// Post-render luma sample: pull 6 evenly spaced frames and read YHIGH (95th
// percentile luma). Calibrated 2026-11-14 on real renders: procedural
// fallback = YAVG ~12.7, YHIGH ~15, SATAVG ~1.4 (a flat dark frame with
// captions). Real horror stills/footage = YHIGH 60+ and SATAVG 5+ even in
// night scenes — candlelight, fog, moon always produce highlights.
const probe = spawnSync(
  "ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4],
  { encoding: "utf8" },
);
const dur = parseFloat(probe.stdout.trim()) || 0;
if (!dur) {
  console.error(`VISUAL-GATE FAIL: cannot probe duration of ${mp4}`);
  process.exit(1);
}
let minYhigh = Infinity;
for (let i = 1; i <= 6; i++) {
  const t = (dur * i) / 7;
  const stat = spawnSync(
    "ffmpeg",
    [
      "-v", "info", "-ss", String(t.toFixed(1)), "-i", mp4,
      "-frames:v", "1", "-vf", "signalstats,metadata=print",
      "-f", "null", "-",
    ],
    { encoding: "utf8" },
  );
  const out = stat.stderr + stat.stdout;
  const yavg = parseFloat(/YAVG=([\d.]+)/.exec(out)?.[1] ?? "0");
  const yhigh = parseFloat(/YHIGH=([\d.]+)/.exec(out)?.[1] ?? "0");
  minYhigh = Math.min(minYhigh, yhigh);
  console.log(`  frame@${t.toFixed(0)}s YAVG=${yavg.toFixed(1)} YHIGH=${yhigh.toFixed(0)}`);
}
if (minYhigh < 25) {
  console.error(
    `VISUAL-GATE FAIL: rendered video is black-level (min YHIGH=${minYhigh.toFixed(0)} < 25) — refusing to upload`,
  );
  process.exit(1);
}
console.log(`VISUAL-GATE OK post-render: min YHIGH=${minYhigh.toFixed(0)}`);
