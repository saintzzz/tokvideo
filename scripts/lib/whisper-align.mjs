// Real word-level alignment via Whisper (faster-whisper equivalent for
// pure Node — @xenova/transformers runs the ONNX model on CPU, no
// Python needed). We already KNOW the text (TTS read it verbatim), so
// Whisper is only used for timestamps: its word timings are mapped back
// onto the expected word list, which also shields us from minor ASR
// misreadings of Vietnamese.
//
// Everything here degrades gracefully: missing package, missing model
// download, or decode failure all return null and callers fall back to
// proportional caption allocation (lib/captions.mjs).
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { findFfmpeg } from "./ffmpeg.mjs";

const MODEL_ID = process.env.WHISPER_MODEL ?? "Xenova/whisper-base";
let asrPipeline;

const loadPipeline = async () => {
  if (asrPipeline !== undefined) return asrPipeline;
  try {
    const { pipeline, env } = await import("@xenova/transformers");
    env.allowLocalModels = false;
    asrPipeline = await pipeline("automatic-speech-recognition", MODEL_ID);
  } catch (err) {
    console.warn(`whisper-align: model unavailable (${err.message}) — proportional captions will be used`);
    asrPipeline = null;
  }
  return asrPipeline;
};

// Whisper expects 16kHz mono PCM. Decode the mp3 to raw f32le via the
// resolved ffmpeg binary into a temp file, then read it straight into a
// Float32Array — no wav header parsing needed.
const decodeToF32 = (mp3Path) => {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) return null;
  const tmp = path.join(tmpdir(), `whisper-${process.pid}-${Date.now()}.pcm`);
  try {
    execFileSync(
      ffmpeg,
      ["-y", "-i", mp3Path, "-ac", "1", "-ar", "16000", "-f", "f32le", tmp],
      { stdio: "ignore" }
    );
    const buf = readFileSync(tmp);
    return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  } catch {
    return null;
  } finally {
    try { unlinkSync(tmp); } catch { /* fine if decode failed */ }
  }
};

const normalize = (w) =>
  w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Map expected words onto whisper's word timeline. Word counts differ
// when whisper merges/splits tokens: expected word i maps to whisper
// word round(i * (W-1)/(E-1)). Consecutive expected words sharing one
// whisper word split its interval evenly so karaoke can still highlight
// every word; a tiny epsilon guarantees no zero-duration word survives.
const mapToExpected = (expected, whisperWords) => {
  const E = expected.length;
  const W = whisperWords.length;
  if (!E || !W) return null;
  const wiOf = (i) => Math.round((i * (W - 1)) / Math.max(E - 1, 1));
  const timed = [];
  for (let i = 0; i < E; ) {
    const wi = wiOf(i);
    let j = i;
    while (j + 1 < E && wiOf(j + 1) === wi) j++;
    const group = j - i + 1;
    const { start, end } = whisperWords[wi];
    const span = Math.max(end - start, 0);
    for (let k = 0; k < group; k++) {
      const s = start + (span * k) / group;
      const e = start + (span * (k + 1)) / group;
      timed.push({
        w: expected[i + k],
        start: +s.toFixed(3),
        end: +Math.max(e, s + 0.04).toFixed(3),
      });
    }
    i = j + 1;
  }
  return timed;
};

/**
 * @param {string} mp3Path
 * @param {string} expectedText - the exact text TTS read
 * @param {"vi"|"en"} language
 * @returns {Promise<{w:string,start:number,end:number}[]|null>}
 */
export const alignWords = async (mp3Path, expectedText, language = "vi") => {
  if (process.env.CAPTION_ALIGN === "off") return null;
  const asr = await loadPipeline();
  if (!asr) return null;
  const audio = decodeToF32(mp3Path);
  if (!audio) return null;
  try {
    const result = await asr(audio, {
      language: language === "vi" ? "vietnamese" : "english",
      task: "transcribe",
      return_timestamps: "word",
      chunk_length_s: 30,
    });
    const chunks = Array.isArray(result) ? result : result.chunks ?? [];
    const whisperWords = chunks
      .map((c) => {
        const [start, end] = c.timestamp ?? [];
        return { w: c.text?.trim() ?? "", start: start ?? 0, end: end ?? start ?? 0 };
      })
      .filter((c) => c.w && Number.isFinite(c.start) && Number.isFinite(c.end));
    if (!whisperWords.length) return null;
    const expected = String(expectedText).split(/\s+/).filter(Boolean);
    return mapToExpected(expected, whisperWords);
  } catch (err) {
    console.warn(`whisper-align failed for ${path.basename(mp3Path)}: ${err.message}`);
    return null;
  }
};
