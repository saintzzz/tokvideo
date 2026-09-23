// Generates the starter audio assets used by MusicBed + scene SFX:
//   public/music/<category>-<locale>.mp3  — soft ambient pad loops
//   public/sfx/{whoosh,pop,chime}.mp3      — transition/step/CTA cues
// Everything is synthesized with ffmpeg — copyright-clean, and meant to
// be REPLACED with licensed tracks under the same filenames later (the
// components resolve by filename, see MusicBed.tsx KNOWN_TRACKS).
//
// Usage: node scripts/generate-audio-assets.mjs   (requires ffmpeg)

import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const musicDir = path.join(root, "public", "music");
const sfxDir = path.join(root, "public", "sfx");
mkdirSync(musicDir, { recursive: true });
mkdirSync(sfxDir, { recursive: true });

const ffmpeg = (args) => {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
  console.log(`  wrote ${args.at(-1)}`);
};

const pad = (out, freqs, seconds = 36) => {
  const inputs = freqs.flatMap((f) => ["-f", "lavfi", "-i", `sine=frequency=${f}:duration=${seconds}`]);
  const mix = freqs.map((_, i) => `[${i}]`).join("");
  ffmpeg([
    ...inputs,
    "-filter_complex",
    `${mix}amix=inputs=${freqs.length}:normalize=0,` +
      `lowpass=f=900,tremolo=f=0.18:d=0.35,` +
      `aecho=0.6:0.35:40|70:0.25|0.15,` +
      `volume=0.55,afade=t=in:d=3,afade=t=out:st=${seconds - 3}:d=3`,
    "-c:a", "libmp3lame", "-q:a", "6",
    out,
  ]);
};

// Minor-ish warm pads per mood family (Hz triplets).
const MUSIC = {
  "default-vi": [196, 246.9, 293.7],            // G3 B3 D4 — warm neutral
  "default-en": [220, 261.6, 329.6],            // A3 C4 E4
  "ho-cam-hong-vi": [174.6, 220, 261.6],        // F3 A3 C4 — cozy
  "tieu-hoa-vi": [196, 246.9, 293.7],
  "giac-ngu-vi": [146.8, 174.6, 220],           // D3 F3 A3 — sleepy
  "dau-nhuc-met-moi-vi": [164.8, 196, 246.9],   // E3 G3 B3
  "da-toc-lam-dep-vi": [185, 233.1, 277.2],     // F#3 A#3 C#4 — soft
  "en-cold-throat-en": [174.6, 207.7, 261.6],
  "en-sleep-relax-en": [138.6, 174.6, 207.7],   // C#3 F3 G#3 — deep calm
  "en-skin-beauty-en": [185, 220, 277.2],
  "en-digestion-en": [196, 233.1, 293.7],
};

for (const [name, freqs] of Object.entries(MUSIC)) {
  pad(path.join(musicDir, `${name}.mp3`), freqs);
}

// ── SFX ────────────────────────────────────────────────────────────
// whoosh: rising sine sweep + noise, ~0.45s
ffmpeg([
  "-f", "lavfi", "-i", "aevalsrc=sin(2*PI*(220+1400*t)*t)*0.4:d=0.45",
  "-f", "lavfi", "-i", "anoisesrc=d=0.45:color=pink:amplitude=0.25",
  "-filter_complex",
  "[1]highpass=f=600,lowpass=f=5000[n];[0][n]amix=inputs=2:normalize=0," +
    "afade=t=in:d=0.05,afade=t=out:st=0.2:d=0.25,volume=0.9",
  "-c:a", "libmp3lame", "-q:a", "5",
  path.join(sfxDir, "whoosh.mp3"),
]);

// pop: short 700Hz blip with fast decay
ffmpeg([
  "-f", "lavfi", "-i", "sine=frequency=700:duration=0.14",
  "-af", "afade=t=out:st=0:d=0.14:curve=exp,volume=0.8",
  "-c:a", "libmp3lame", "-q:a", "5",
  path.join(sfxDir, "pop.mp3"),
]);

// chime: two-tone bell with long soft decay
ffmpeg([
  "-f", "lavfi", "-i", "sine=frequency=880:duration=0.9",
  "-f", "lavfi", "-i", "sine=frequency=1318.5:duration=0.9",
  "-filter_complex",
  "[0][1]amix=inputs=2:normalize=0,afade=t=out:st=0.05:d=0.85:curve=exp,volume=0.7",
  "-c:a", "libmp3lame", "-q:a", "5",
  path.join(sfxDir, "chime.mp3"),
]);

console.log("Audio assets generated.");
