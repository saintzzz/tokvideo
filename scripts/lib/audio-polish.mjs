// Post-processing for TTS voiceover clips (free-tier polish, no paid
// tools): trims leading/trailing silence so scene gaps stay tight
// (Shorts pacing rule: <= ~0.2s dead air at the seams), then evens out
// level and loudness so voiceover sits consistently over the music bed.
// Runs through an external ffmpeg — findFfmpeg() handles env override,
// PATH, and the Remotion-bundled binary (broken on some Windows
// machines, hence the env escape hatch).
import { execFileSync } from "node:child_process";
import { copyFileSync, unlinkSync } from "node:fs";
import { findFfmpeg } from "./ffmpeg.mjs";

// Head/tail silence removal uses the areverse trick: trim the head,
// flip, trim what is now the head (the original tail), flip back.
// -45dB threshold catches the quiet "room tone" TTS puts around speech
// without biting into soft syllables.
const FILTER =
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05," +
  "areverse," +
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08," +
  "areverse," +
  // EQ: cut rumble below speech and add a little presence so the TTS
  // voice cuts through the music bed on phone speakers.
  "highpass=f=80," +
  "equalizer=f=3000:t=q:w=1.5:g=1.5," +
  "acompressor=threshold=-18dB:ratio=3:attack=8:release=120," +
  "loudnorm=I=-16:TP=-1.5:LRA=11";

/** Returns true when the file was polished; false when skipped (env
 *  bypass or no ffmpeg available — callers should treat that as
 *  non-fatal). */
export const polishVoiceover = (mp3Path) => {
  if (process.env.SKIP_POLISH === "1") return false;
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) return false;
  const tmp = `${mp3Path}.polish.mp3`;
  try {
    execFileSync(
      ffmpeg,
      ["-y", "-i", mp3Path, "-af", FILTER, "-codec:a", "libmp3lame", "-q:a", "4", tmp],
      { stdio: "ignore" }
    );
    // fs.rename cannot overwrite an existing destination on Windows —
    // copy over, then drop the temp.
    copyFileSync(tmp, mp3Path);
    unlinkSync(tmp);
    return true;
  } catch {
    try { unlinkSync(tmp); } catch { /* tmp may not exist */ }
    return false;
  }
};
