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
const frameYhigh = (t) => {
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
  return { yavg, yhigh };
};
let minYhigh = Infinity;
let sumYhigh = 0;
let darkCount = 0;
for (let i = 1; i <= 6; i++) {
  const t = (dur * i) / 7;
  const { yavg, yhigh } = frameYhigh(t);
  minYhigh = Math.min(minYhigh, yhigh);
  sumYhigh += yhigh;
  if (yhigh < 25) darkCount++;
  console.log(`  frame@${t.toFixed(0)}s YAVG=${yavg.toFixed(1)} YHIGH=${yhigh.toFixed(0)}`);
}
// Sparse keyframes make point sampling unreliable: -ss before -i snaps
// to the PREVIOUS keyframe, so probes seconds apart can read the same
// frame — a single dark keyframe once fake-reported as an 8s black hole
// (2026-11-18, quan-tai-troi-tap-01 refused over a ~0.6s fade). The
// black-segment check below (blackdetect, full decode) is authoritative;
// the samples are informational. Fail fast only if MOST samples are
// dark — that really is a dead video, no need for the slow pass.
if (darkCount >= 4) {
  console.warn(`  note: ${darkCount}/6 samples read dark (keyframe-snapped, informational only)`);
}
// Authoritative check: blackdetect over the whole file (single decode
// pass, keyframe-independent). pix_th=0.06 ≈ "no pixel brighter than
// ~15/255"; d=6 refuses only >=6s of true black — a genuine missing
// visual, not a fade or dark scene.
const bd = spawnSync(
  "ffmpeg",
  ["-v", "info", "-i", mp4, "-vf", "blackdetect=d=6:pix_th=0.06", "-an", "-f", "null", "-"],
  { encoding: "utf8", timeout: 300_000 },
);
const bdOut = (bd.stderr ?? "") + (bd.stdout ?? "");
const holes = [...bdOut.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)];
if (holes.length) {
  for (const h of holes) console.error(`  black segment ${h[1]}s-${h[2]}s (${(h[2] - h[1]).toFixed(1)}s)`);
  console.error(
    `VISUAL-GATE FAIL: ${holes.length} black segment(s) >=6s in rendered video — refusing to upload`,
  );
  process.exit(1);
}
console.log(`VISUAL-GATE OK post-render: min YHIGH=${minYhigh.toFixed(0)}, mean YHIGH=${(sumYhigh / 6).toFixed(0)}, no black segment >=6s`);
