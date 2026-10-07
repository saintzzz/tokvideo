// Generates per-scene story illustrations via the free Pollinations
// image API (Flux backend, no API key, no signup) and wires them into
// the episode JSON — replacing the procedural silhouette/text template
// that makes every video share one visual signature.
//
// Per-part prompt = explicit `imagePrompts[i]` in the episode JSON when
// present (best quality — write these when authoring the episode), else
// an auto prompt built from the storyPart text + a fixed style suffix.
// The `seed` is derived from the slug so one episode's parts share a
// generation stream; `enhance=true` lets Pollinations' upstream LLM
// expand thin prompts for free.
//
// Usage:
//   node scripts/generate-story-visuals.mjs                # all story episodes missing images
//   node scripts/generate-story-visuals.mjs <slug> [...]   # specific episodes
//   node scripts/generate-story-visuals.mjs --prompts <slug>   # dry-run, print prompts only
//   FORCE=1 ...                                            # regenerate even when images exist
import { readdir, readFile, writeFile, mkdir, access, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { withRetry } from "./lib/retry.mjs";
import { findFfmpeg } from "./lib/ffmpeg.mjs";

const root = path.resolve(import.meta.dirname, "..");
const episodesDir = path.join(root, "src", "suckhoe", "episodes");

const STYLE_VI =
  "Vietnamese folk tale storybook illustration, warm gouache painting, soft cinematic lighting, muted gold and deep green palette, traditional Vietnamese village setting, no text, no watermark";
const STYLE_EN =
  "folk tale storybook illustration, warm painterly gouache style, cinematic lighting, muted earthy palette, no text, no watermark";
// Horror arc (CR-002): cold, desaturated, cinematic — fixed style block
// is what keeps every scene and every episode visually consistent, the
// prompt only supplies the setting.
const STYLE_HORROR =
  "dark cinematic horror illustration, muted desaturated palette of deep teal and cold grey, volumetric fog, single faint light source, Vietnamese rural village atmosphere, film grain, painterly, moody, no text, no watermark, no faces close-up";

const hashSeed = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 2147483647;
};

const autoPrompt = (partText, isEn) => {
  // First ~40 words carry the beat's setting+action; the rest is usually
  // dialogue detail that would dilute the image prompt.
  const excerpt = String(partText).split(/\s+/).slice(0, 40).join(" ");
  return `${excerpt} ${isEn ? STYLE_EN : STYLE_VI}`;
};

// Free anonymous tier (2026-10): flux WITHOUT enhance, plus the zimage
// and klein models. `enhance=true` proxies a paid LLM and returns 402,
// as does model=turbo — so prompts must be written self-contained
// (imagePrompts in the episode JSON) rather than relying on expansion.
const MODEL_CHAIN = (process.env.POLLINATIONS_MODELS ?? "flux,zimage,klein").split(",");

const pollinationsUrl = (prompt, seed, model, w = 1080, h = 1350) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
  `?width=${w}&height=${h}&seed=${seed}&model=${model}&nologo=true`;

const fetchImage = async (prompt, seed, dims) => {
  let lastErr;
  for (const model of MODEL_CHAIN) {
    const url = pollinationsUrl(prompt, seed, model, dims?.w, dims?.h);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} (${model})`);
        continue; // 402 on quota'd models — try the next free model
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

// The anonymous tier ignores nologo=true — every image comes back with a
// "pollinations.ai" watermark along the bottom-right (~12% of height, the
// source is smaller than requested: 1024x576 regardless of the width
// param). Crop that strip and (long-form only) upscale back to 1920w for
// the 1080p composition. A failed crop must fail the generation — a cached
// watermarked file would otherwise be skipped forever by the resume check.
let ffmpegChecked = false;
let ffmpegBin = null;
const cropWatermark = async (rawFile, outFile, upscaleW) => {
  if (!ffmpegChecked) {
    ffmpegChecked = true;
    ffmpegBin = findFfmpeg();
  }
  if (!ffmpegBin) {
    throw new Error("ffmpeg required to strip the pollinations watermark (set FFMPEG_BIN)");
  }
  const crop = "crop=iw:floor(ih*0.875/2)*2:0:0";
  const vf = upscaleW ? `${crop},scale=${upscaleW}:-2:flags=lanczos` : crop;
  execFileSync(ffmpegBin, ["-y", "-i", rawFile, "-vf", vf, "-q:v", "3", outFile], { stdio: "ignore" });
};

// Downloads land in a `.raw` temp file and are only promoted to the cache
// path after a successful crop — a failed crop must not leave a watermarked
// file behind for the resume check to accept forever.
const fetchToCache = async (prompt, seed, dims, outFile) => {
  const rawFile = `${outFile}.raw.jpg`;
  try {
    const buf = await fetchImage(prompt, seed, dims);
    await writeFile(rawFile, buf);
    await cropWatermark(rawFile, outFile, dims?.w);
    await unlink(rawFile);
    return buf.length;
  } catch (err) {
    await unlink(rawFile).catch(() => {});
    await unlink(outFile).catch(() => {});
    throw err;
  }
};

const args = process.argv.slice(2);
const longMode = args.includes("--long");
const dryRun = args.includes("--prompts");
const force = !!process.env.FORCE;
const requested = args.filter((a) => !a.startsWith("--"));

// --long mode handles only the long-form pipeline below; skip the
// short-form story scan entirely so the two modes are mutually exclusive
// (otherwise `--long` would also regenerate every Shorts episode missing
// images, burning the anonymous quota before reaching the real targets).
if (!longMode) {
  const files = (await readdir(episodesDir)).filter((f) => f.endsWith(".json"));
  const episodes = await Promise.all(
    files.map(async (file) => {
      const mod = await import(pathToFileURL(path.join(episodesDir, file)), {
        with: { type: "json" },
      });
      return { file, ...mod.default };
    })
  );

  const targets = episodes.filter(
    (ep) =>
      ep.kind === "story" &&
      (requested.length === 0 || requested.includes(ep.slug))
  );

  if (!targets.length) {
    console.log("No story episodes matched.");
    process.exit(0);
  }

for (const ep of targets) {
  const isEn = ep.locale === "en";
  const parts = ep.storyParts ?? [];
  const outDir = path.join(root, "public", "images", "suckhoe", ep.slug);
  const relPaths = parts.map((_, i) => `images/suckhoe/${ep.slug}/part-${i}.jpg`);
  const seed = hashSeed(ep.slug);

  const prompts = parts.map(
    (text, i) => ep.imagePrompts?.[i] ?? autoPrompt(text, isEn)
  );

  if (dryRun) {
    console.log(`\n=== ${ep.slug} (seed ${seed}) ===`);
    prompts.forEach((p, i) => console.log(`part-${i}: ${p}`));
    continue;
  }

  // Skip episodes that already have images unless FORCE=1.
  const already = (ep.images ?? []).length >= parts.length;
  if (already && !force) {
    console.log(`SKIP ${ep.slug}: images already set (FORCE=1 to regenerate)`);
    continue;
  }

  await mkdir(outDir, { recursive: true });
  const written = [];
  for (let i = 0; i < parts.length; i++) {
    const outFile = path.join(outDir, `part-${i}.jpg`);
    if (!force) {
      try {
        await access(outFile);
        written.push(relPaths[i]);
        console.log(`exists ${relPaths[i]}`);
        continue;
      } catch { /* not generated yet */ }
    }
    await withRetry(
      async () => {
        const bytes = await fetchToCache(prompts[i], seed, null, outFile);
        console.log(`wrote ${relPaths[i]} (${(bytes / 1024).toFixed(0)}KB)`);
      },
      // Anonymous quota allows roughly one image per ~30-60s — a 402 is
      // a cooldown signal, not a hard failure, so backoff is long.
      { attempts: 6, baseMs: 20000, label: `pollinations ${ep.slug} part-${i}` }
    );
    written.push(relPaths[i]);
    // Anonymous tier is rate-limited — spacing requests keeps us under it.
    await new Promise((r) => setTimeout(r, 15000));
  }

  // Wire generated files into the episode so StoryScene picks them up
  // (and validate-episodes keeps checking they exist).
  const jsonPath = path.join(episodesDir, ep.file);
  const json = JSON.parse(await readFile(jsonPath, "utf8"));
  json.images = relPaths;
  await writeFile(jsonPath, JSON.stringify(json, null, 2) + "\n");
  console.log(`updated ${ep.file}: images[${written.length}]`);
}
}

// ---------------------------------------------------------------------------
// --long mode: long-form episodes carry `scenePrompts` (map scene -> prompt)
// instead of per-part imagePrompts. One still per scene setting is generated
// at 1920x1080 and written into `sceneImages`; beats sharing a scene reuse the
// same image, which is what keeps the arc visually consistent. Resumable —
// existing files are skipped unless FORCE=1.
if (longMode) {
  const longDir = path.join(root, "src", "suckhoe", "long-form");
  const dims = { w: 1920, h: 1080 };
  const lfFiles = (await readdir(longDir)).filter((f) => f.endsWith(".json"));
  for (const file of lfFiles) {
    const mod = await import(pathToFileURL(path.join(longDir, file)), {
      with: { type: "json" },
    });
    const ep = mod.default;
    if (requested.length && !requested.includes(ep.slug)) continue;
    const prompts = ep.scenePrompts ?? {};
    const scenes = Object.keys(prompts);
    if (!scenes.length) continue;

    const outDir = path.join(root, "public", "images", "suckhoe-long", ep.slug);
    await mkdir(outDir, { recursive: true });
    const seed = hashSeed(ep.slug);
    const sceneImages = { ...(ep.sceneImages ?? {}) };

    for (const scene of scenes) {
      const rel = `images/suckhoe-long/${ep.slug}/${scene}.jpg`;
      const outFile = path.join(outDir, `${scene}.jpg`);
      if (!force) {
        try {
          await access(outFile);
          sceneImages[scene] = rel;
          console.log(`exists ${rel}`);
          continue;
        } catch { /* not generated yet */ }
      }
      const prompt = `${prompts[scene]} ${STYLE_HORROR}`;
      if (dryRun) {
        console.log(`${ep.slug} [${scene}]: ${prompt}`);
        continue;
      }
      await withRetry(
        async () => {
          const bytes = await fetchToCache(prompt, seed, dims, outFile);
          console.log(`wrote ${rel} (${(bytes / 1024).toFixed(0)}KB)`);
        },
        { attempts: 6, baseMs: 20000, label: `pollinations ${ep.slug} ${scene}` }
      );
      sceneImages[scene] = rel;
      await new Promise((r) => setTimeout(r, 15000));
    }

    if (!dryRun) {
      const jsonPath = path.join(longDir, file);
      const json = JSON.parse(await readFile(jsonPath, "utf8"));
      json.sceneImages = sceneImages;
      await writeFile(jsonPath, JSON.stringify(json, null, 2) + "\n");
      console.log(`updated ${file}: sceneImages[${Object.keys(sceneImages).length}]`);
    }
  }
}

console.log("Done.");
