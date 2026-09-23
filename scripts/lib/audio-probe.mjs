// Audio sanity + duration probing for generated voiceover files.
// Uses ffprobe when present (CI images and most dev machines have it);
// degrades to a size heuristic so the check never becomes a dependency.

import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";

let ffprobePath;
const findFfprobe = () => {
  if (ffprobePath !== undefined) return ffprobePath;
  try {
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    ffprobePath = "ffprobe";
  } catch {
    ffprobePath = null;
  }
  return ffprobePath;
};

/** Duration in seconds, or null when it can't be determined. */
export const probeDurationSeconds = (filePath) => {
  if (!findFfprobe()) return null;
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { encoding: "utf8" }
    ).trim();
    const d = Number.parseFloat(out);
    return Number.isFinite(d) && d > 0 ? d : null;
  } catch {
    return null;
  }
};

const MIN_BYTES = 4 * 1024; // a valid scene mp3 is never under ~4 KB
const MIN_SECONDS = 0.5;

/**
 * @returns {{ ok: boolean, durationSec: number|null, reason?: string }}
 */
export const sanityCheckAudio = (filePath) => {
  let size;
  try {
    size = statSync(filePath).size;
  } catch {
    return { ok: false, durationSec: null, reason: "missing file" };
  }
  if (size < MIN_BYTES) {
    return { ok: false, durationSec: null, reason: `suspiciously small (${size} B)` };
  }
  const durationSec = probeDurationSeconds(filePath);
  if (durationSec !== null && durationSec < MIN_SECONDS) {
    return { ok: false, durationSec, reason: `too short (${durationSec}s)` };
  }
  return { ok: true, durationSec };
};
