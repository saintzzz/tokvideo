// Karaoke caption emission (Q-03) — shared by generate-voiceover.mjs
// (writes during synthesis) and backfill-captions.mjs (rebuilds caption
// JSONs from already-generated mp3s without hitting TTS again).
// Word timings are allocated proportionally across the real mp3
// duration — see docs/ARCHITECTURE.md D1. Written next to the audio in
// public/captions/<videoId>/<scene>.json for KaraokeCaption to fetch.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Preferred entry point: real word timings from Whisper alignment when
// the model/ffmpeg are available (lib/whisper-align.mjs), proportional
// fallback otherwise — the JSON shape is identical either way.
// Whisper is skipped for very short clips: proportional allocation is
// accurate enough on a handful of words and the model load/decode cost
// is not worth it.
const MIN_ALIGN_SEC = 4.5;
export const writeAlignedCaptions = async (
  captionsRoot,
  videoId,
  key,
  text,
  mp3Path,
  durationSec,
  language = "vi"
) => {
  try {
    if (durationSec < MIN_ALIGN_SEC) throw new Error("short clip");
    const { alignWords } = await import("./whisper-align.mjs");
    const aligned = await alignWords(mp3Path, text, language);
    if (aligned?.length) {
      const dir = path.join(captionsRoot, videoId);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `${key}.json`),
        JSON.stringify(
          { durationSec: +durationSec.toFixed(3), aligned: true, words: aligned },
          null,
          1
        )
      );
      return;
    }
  } catch { /* fall back below */ }
  await writeCaptions(captionsRoot, videoId, key, text, durationSec);
};

export const writeCaptions = async (captionsRoot, videoId, key, text, durationSec) => {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length || !durationSec) return;
  // 92% of the clip is spoken words; the rest is leading/trailing breath.
  const budget = durationSec * 0.92;
  const lead = durationSec * 0.04;
  const weights = words.map((w) => {
    // Longer words take longer; sentence-ending punctuation adds a pause.
    const pause = /[.!?,;:…—]$/.test(w) ? 2.5 : 0;
    return Math.max(w.replace(/[^\p{L}\p{N}]/gu, "").length, 1) + pause;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let t = lead;
  const timed = words.map((w, i) => {
    const dur = (weights[i] / total) * budget;
    const entry = { w, start: +t.toFixed(3), end: +(t + dur).toFixed(3) };
    t += dur;
    return entry;
  });
  const dir = path.join(captionsRoot, videoId);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${key}.json`),
    JSON.stringify({ durationSec: +durationSec.toFixed(3), words: timed }, null, 1)
  );
};
