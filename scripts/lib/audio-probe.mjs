// Audio sanity + duration probing for generated voiceover files.
// Uses ffprobe when present (CI images and most dev machines have it);
// degrades to a size heuristic so the check never becomes a dependency.

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

let ffprobePath;
const findFfprobe = () => {
  if (ffprobePath !== undefined) return ffprobePath;
  try {
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    ffprobePath = "ffprobe";
    return ffprobePath;
  } catch { /* not on PATH — try the bundled one below */ }
  // Remotion ships ffprobe/ffmpeg inside @remotion/compositor-<platform>
  // — usable when no system ffmpeg is installed (Windows dev machines).
  try {
    const scopeDir = path.resolve(
      import.meta.dirname,
      "..",
      "..",
      "node_modules",
      "@remotion"
    );
    for (const dir of readdirSync(scopeDir)) {
      if (!dir.startsWith("compositor-")) continue;
      const candidate = path.join(
        scopeDir,
        dir,
        process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
      );
      try {
        execFileSync(candidate, ["-version"], { stdio: "ignore" });
        ffprobePath = candidate;
        return ffprobePath;
      } catch { /* not this platform's binary */ }
    }
  } catch { /* no @remotion scope installed */ }
  ffprobePath = null;
  return ffprobePath;
};

// Last-resort pure-JS probe for CBR mp3s (the TTS output is always
// 96kbit CBR): find the first MPEG frame sync, read its bitrate from
// the header, then duration = payload_bits / bitrate. Accurate to a few
// percent — fine for caption timing and sanity checks.
// Bitrate tables (kbps) indexed by the header's bitrate-index nibble.
const MPEG1_L3_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const MPEG2_L3_KBPS = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const probeViaMp3Header = (filePath) => {
  try {
    const buf = readFileSync(filePath);
    // Skip an ID3v2 tag if present (size is syncsafe in bytes 6-9).
    let off = 0;
    if (buf.length > 10 && buf.toString("latin1", 0, 3) === "ID3") {
      off =
        10 +
        ((buf[6] & 0x7f) << 21) +
        ((buf[7] & 0x7f) << 14) +
        ((buf[8] & 0x7f) << 7) +
        (buf[9] & 0x7f);
    }
    for (let i = off; i < buf.length - 4; i++) {
      // Frame sync (111) + Layer III (01 in bits 2-1); version bits 4-3
      // pick the bitrate table: 11=MPEG1, 10=MPEG2, 00=MPEG2.5.
      if (buf[i] === 0xff && (buf[i + 1] & 0xe6) === 0xe2) {
        const mpeg1 = (buf[i + 1] & 0x18) === 0x18;
        const table = mpeg1 ? MPEG1_L3_KBPS : MPEG2_L3_KBPS;
        const kbps = table[(buf[i + 2] >> 4) & 0x0f];
        if (kbps > 0) {
          const d = ((buf.length - i) * 8) / (kbps * 1000);
          return d > 0 ? d : null;
        }
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/** Duration in seconds, or null when it can't be determined. */
export const probeDurationSeconds = (filePath) => {
  const ffprobe = findFfprobe();
  if (ffprobe) {
    try {
      const out = execFileSync(
        ffprobe,
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
        { encoding: "utf8" }
      ).trim();
      const d = Number.parseFloat(out);
      if (Number.isFinite(d) && d > 0) return d;
    } catch { /* fall through to the mp3-header probe */ }
  }
  return probeViaMp3Header(filePath);
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
