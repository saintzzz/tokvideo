// Rebuilds karaoke caption JSONs for English Arena ads from the
// already-generated mp3s — same word-allocation as
// generate-voiceover.mjs but without any TTS calls. Needed when
// voiceovers were generated on a machine without ffprobe/ffmpeg (the
// caption step silently skips then) or after editing episode text.
// Usage: node scripts/backfill-captions.mjs [ea-slug ...]
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { probeDurationSeconds } from "./lib/audio-probe.mjs";
import { writeCaptions } from "./lib/captions.mjs";

const root = path.resolve(import.meta.dirname, "..");
const episodesDir = path.join(root, "src", "english-arena", "episodes");
const captionsRoot = path.join(root, "public", "captions");

const files = (await readdir(episodesDir)).filter((f) => f.endsWith(".json"));
const requested = new Set(process.argv.slice(2));

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  if (requested.size && !requested.has(slug) && !requested.has(`ea-${slug}`)) {
    continue;
  }
  const mod = await import(pathToFileURL(path.join(episodesDir, file)), {
    with: { type: "json" },
  });
  const episode = mod.default;
  const audioDir = path.join(root, "public", "audio", "english-arena", slug);
  const narration = { hook: episode.hook };
  (episode.parts ?? []).forEach((p, i) => {
    narration[`part-${i}`] = p.text;
  });
  narration.cta = episode.cta;

  for (const [key, text] of Object.entries(narration)) {
    if (!text?.trim()) continue;
    const dur = probeDurationSeconds(path.join(audioDir, `${key}.mp3`));
    if (!dur) {
      console.warn(`SKIP ea-${slug}/${key}: no mp3 or duration unknown`);
      continue;
    }
    await writeCaptions(captionsRoot, `ea-${slug}`, key, text, dur);
    console.log(`captions: ea-${slug}/${key} (${dur.toFixed(1)}s)`);
  }
}
console.log("Done.");
