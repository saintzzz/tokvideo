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
import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { withRetry } from "./lib/retry.mjs";

const root = path.resolve(import.meta.dirname, "..");
const episodesDir = path.join(root, "src", "suckhoe", "episodes");

const STYLE_VI =
  "Vietnamese folk tale storybook illustration, warm gouache painting, soft cinematic lighting, muted gold and deep green palette, traditional Vietnamese village setting, no text, no watermark";
const STYLE_EN =
  "folk tale storybook illustration, warm painterly gouache style, cinematic lighting, muted earthy palette, no text, no watermark";

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

const pollinationsUrl = (prompt, seed, model) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
  `?width=1080&height=1350&seed=${seed}&model=${model}&nologo=true`;

const fetchImage = async (prompt, seed) => {
  let lastErr;
  for (const model of MODEL_CHAIN) {
    const url = pollinationsUrl(prompt, seed, model);
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

const args = process.argv.slice(2);
const dryRun = args.includes("--prompts");
const force = !!process.env.FORCE;
const requested = args.filter((a) => !a.startsWith("--"));

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
        const buf = await fetchImage(prompts[i], seed);
        await writeFile(outFile, buf);
        console.log(`wrote ${relPaths[i]} (${(buf.length / 1024).toFixed(0)}KB)`);
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

console.log("Done.");
