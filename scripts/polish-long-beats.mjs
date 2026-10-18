// Polish + caption pass for long-form beats whose mp3 was produced
// OUTSIDE generate-voiceover.mjs (e.g. by the Python edge-tts fallback
// when msedge-tts gets 403'd). generate-voiceover's RESUME path skips
// polish+captions for already-present beats, so this script finishes
// them. Usage: node scripts/polish-long-beats.mjs <slug>
import { readdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { polishVoiceover } from "./lib/audio-polish.mjs";
import { probeDurationSeconds } from "./lib/audio-probe.mjs";
import { writeAlignedCaptions } from "./lib/captions.mjs";

const ep = process.argv[2];
if (!ep) { console.error("usage: polish-long-beats.mjs <slug>"); process.exit(1); }
const root = path.join(import.meta.dirname, "..");
const audioDir = path.join(root, "public", "audio", "suckhoe-long", ep);
const captionsRoot = path.join(root, "public", "captions");
const videoId = `suckhoe-long-${ep}`;
const episode = JSON.parse(
  readFileSync(path.join(root, "src", "suckhoe", "long-form", `${ep}.json`), "utf8")
);

const files = readdirSync(audioDir)
  .filter((f) => /^beat-\d+\.mp3$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
for (const f of files) {
  const i = parseInt(f.match(/\d+/)[0]);
  const mp3 = path.join(audioDir, f);
  const captionPath = path.join(captionsRoot, videoId, `beat-${i}.json`);
  polishVoiceover(mp3);
  const dur = probeDurationSeconds(mp3);
  if (dur && !existsSync(captionPath)) {
    await writeAlignedCaptions(captionsRoot, videoId, `beat-${i}`, episode.beats[i].text, mp3, dur, "vi");
  }
  console.log(`${ep} beat-${i} ok (${dur?.toFixed(1)}s)`);
}
console.log(`${ep} done`);
