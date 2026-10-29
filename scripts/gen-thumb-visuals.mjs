// Generates a dedicated thumbnail still (thumb.jpg) for each long-form
// episode — deliberately scarier than the in-video hook scene, because
// the thumbnail's job is stopping the scroll, not matching the frame
// content. Owner feedback 2026-10-18: the moody scene stills "aren't
// scary" — the new prompts lead with blood/ghost/corpse faces.
//
// Output: public/images/suckhoe-long/<slug>/thumb.jpg (landscape)
// Usage:
//   node scripts/gen-thumb-visuals.mjs            # all missing thumbs
//   node scripts/gen-thumb-visuals.mjs <slug>...  # specific episodes
//   FORCE=1 ...                                    # regenerate existing

import { existsSync } from "node:fs";
import { mkdir, writeFile, unlink, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { findFfmpeg } from "./lib/ffmpeg.mjs";
import { arcBase } from "./lib/long-metadata.mjs";

const root = path.resolve(import.meta.dirname, "..");
const longFormDir = path.join(root, "src", "suckhoe", "long-form");

// One frightening subject per arc — the thumbnail reads at feed size,
// so it's always a face/figure/death object filling the frame, never
// scenery. Episode-level `thumbPrompt` in the JSON overrides this.
const ARC_SUBJECT = {
  "loi-nguyen-gieng-cu":
    "a drowned Vietnamese ghost woman rising out of an ancient stone well at midnight, pale rotting face, hollow pitch-black eyes staring at the camera, long wet black hair dripping bloody water, hands gripping the well rim",
  "dung-tra-loi":
    "a gaunt ghost mother in a torn white ao ba ba standing in a dark doorway at night, face half-rotted, milky white eyes, mouth open in a scream, one hand reaching through the door frame",
  "hu-ma-ga":
    "a demonic pale face with bloodshot eyes and bared teeth emerging from an old clay jar wrapped in blood-soaked red cloth, strands of black hair sticking out of the jar mouth, candlelight horror",
  "dem-kham-liem":
    "a dead old man in a white funeral shroud sitting upright inside an open wooden coffin, grey rotting face, eyes snapped open, funeral candles burning around, incense smoke",
  "quan-tai-troi":
    "a black wooden coffin floating on dark floodwater at night with a pale drowned ghost face rising half out of the lid, hollow black eyes, wet hair over grey skin, a hand gripping the coffin edge, thin fog",
};

const THUMB_STYLE =
  "YouTube horror movie thumbnail, extreme close-up filling the frame, blood-red rim lighting, thin fog, pitch black background, hyper-detailed skin texture, cinematic horror film poster, high contrast, terrifying, unsettling";

const MODEL_CHAIN = (process.env.POLLINATIONS_MODELS ?? "flux,zimage,klein").split(",");
const pollinationsUrl = (prompt, seed, model, w, h) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
  `?width=${w}&height=${h}&seed=${seed}&model=${model}&nologo=true`;

const fetchImage = async (prompt, seed) => {
  let lastErr;
  for (const model of MODEL_CHAIN) {
    try {
      const res = await fetch(pollinationsUrl(prompt, seed, model, 1280, 720), {
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} (${model})`);
        continue;
      }
      const type = res.headers.get("content-type") ?? "";
      const buf = Buffer.from(await res.arrayBuffer());
      if (!type.includes("image") || buf.length < 20_000) {
        lastErr = new Error(`unexpected payload (${type}, ${buf.length}B)`);
        continue;
      }
      return buf;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("all image models failed");
};

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("No runnable ffmpeg (needed to crop the watermark).");
  process.exit(1);
}

const requested = process.argv.slice(2);
const files = (await readdir(longFormDir)).filter((f) => f.endsWith(".json"));
const force = !!process.env.FORCE;

let done = 0;
let skipped = 0;
for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  if (requested.length && !requested.includes(slug)) continue;
  const episode = (await import(pathToFileURL(path.join(longFormDir, file)), { with: { type: "json" } }))
    .default;
  if (!episode.beats.every((b) => b.speaker === "narrator")) continue; // story arcs only

  const outDir = path.join(root, "public", "images", "suckhoe-long", slug);
  const outFile = path.join(outDir, "thumb.jpg");
  if (existsSync(outFile) && !force) {
    skipped++;
    continue;
  }

  const subject = episode.thumbPrompt ?? ARC_SUBJECT[arcBase(slug)];
  if (!subject) {
    console.warn(`${slug}: no ARC_SUBJECT and no thumbPrompt — skipping`);
    continue;
  }
  const prompt = `${subject}. ${THUMB_STYLE}`;
  const seed = Math.abs(
    [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 2147483647
  );

  await mkdir(outDir, { recursive: true });
  const rawFile = `${outFile}.raw.jpg`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const buf = await fetchImage(prompt, seed + attempt);
      await writeFile(rawFile, buf);
      execFileSync(ffmpeg, ["-y", "-i", rawFile, "-vf", "crop=iw:floor(ih*0.875/2)*2:0:0", "-q:v", "3", outFile], {
        stdio: "ignore",
      });
      await unlink(rawFile);
      done++;
      console.log(`${slug}: thumb.jpg written`);
      break;
    } catch (err) {
      await unlink(rawFile).catch(() => {});
      console.warn(`${slug} attempt ${attempt}/6 failed: ${err.message}`);
      if (attempt < 6) await new Promise((r) => setTimeout(r, 20_000));
    }
  }
}
console.log(`Done: ${done} generated, ${skipped} already existed.`);
