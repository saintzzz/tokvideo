// Builds one continuous .srt for a long-form episode from the committed
// per-beat caption JSONs (word-level Whisper timings, beat-0..N-1).
// Output cue length ~5 words for readability; beat timings are offset by
// cumulative beat duration so cues stay in sync with the concatenated
// audio produced by prep-mpt-task.mjs.
//
// Usage: node scripts/mpt-srt.mjs <slug>
// Output: out/mpt/<slug>.srt

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { probeDurationSeconds } from "./lib/audio-probe.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/mpt-srt.mjs <slug>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const episode = (
  await import(pathToFileURL(path.join(root, "src", "suckhoe", "long-form", `${slug}.json`)), {
    with: { type: "json" },
  })
).default;

const audioDir = path.join(root, "public", "audio", "suckhoe-long", slug);
const capDir = path.join(root, "public", "captions", `suckhoe-long-${slug}`);

const fmt = (sec) => {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const f = ms % 1000;
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(f, 3)}`;
};

const WORDS_PER_CUE = 5;
let offset = 0;
const cues = [];

for (let i = 0; i < episode.beats.length; i++) {
  const mp3 = path.join(audioDir, `beat-${i}.mp3`);
  const dur = probeDurationSeconds(mp3) ?? 0;
  const cap = JSON.parse(await readFile(path.join(capDir, `beat-${i}.json`), "utf8"));
  const words = cap.words ?? [];
  for (let j = 0; j < words.length; j += WORDS_PER_CUE) {
    const chunk = words.slice(j, j + WORDS_PER_CUE);
    if (!chunk.length) continue;
    const start = offset + (chunk[0].start ?? 0);
    const end = offset + (chunk[chunk.length - 1].end ?? dur);
    cues.push({
      start,
      // never let a cue outlive the beat itself
      end: Math.min(end, offset + dur),
      text: chunk.map((w) => w.w).join(" "),
    });
  }
  offset += dur;
}

const srt =
  cues
    .map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}`)
    .join("\n\n") + "\n";

const outDir = path.join(root, "out", "mpt");
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, `${slug}.srt`);
await writeFile(outFile, srt, "utf8");
console.log(`${slug}: ${cues.length} cues, ${offset.toFixed(1)}s total -> ${outFile}`);
