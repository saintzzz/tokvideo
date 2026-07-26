import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import giaCatLuongNarration from "../src/narration.json" with { type: "json" };
import churchillNarration from "../src/narration.churchill.json" with { type: "json" };
import hippocratesNarration from "../src/narration.hippocrates.json" with { type: "json" };
import ideverrayNarration from "../src/narration.ideverray.json" with { type: "json" };

// Free Microsoft Edge "Read Aloud" voice, no API key required.
// Other good Vietnamese options: "vi-VN-HoaiMyNeural" (female).
const VOICE = process.env.EDGE_TTS_VOICE ?? "vi-VN-NamMinhNeural";

// Punchier "ad read" delivery instead of flat narration: a bit faster,
// a bit brighter/louder. Override per-run with env vars if a specific
// video needs a calmer read.
const PROSODY = {
  rate: process.env.TTS_RATE ?? "+14%",
  pitch: process.env.TTS_PITCH ?? "+4%",
  volume: process.env.TTS_VOLUME ?? "+15%",
};

const publicDir = path.join(import.meta.dirname, "..", "public", "audio");

const VIDEOS = {
  "gia-cat-luong": { audioDir: publicDir, narration: giaCatLuongNarration },
  churchill: {
    audioDir: path.join(publicDir, "churchill"),
    narration: churchillNarration,
  },
  hippocrates: {
    audioDir: path.join(publicDir, "hippocrates"),
    narration: hippocratesNarration,
  },
  ideverray: {
    audioDir: path.join(publicDir, "ideverray"),
    narration: ideverrayNarration,
  },
};

// Pass one or more video ids as CLI args to generate only those.
// With no args, generates every video (used for local dev).
const requested = process.argv.slice(2);
const ids = requested.length > 0 ? requested : Object.keys(VIDEOS);

for (const id of ids) {
  if (!VIDEOS[id]) {
    console.error(`Unknown video id "${id}". Known ids: ${Object.keys(VIDEOS).join(", ")}`);
    process.exit(1);
  }
}

const synthesize = async (tts, outDir, key, text) => {
  const { audioStream } = tts.toStream(text, PROSODY);
  const outFile = path.join(outDir, `${key}.mp3`);

  await new Promise((resolve, reject) => {
    const write = createWriteStream(outFile);
    audioStream.pipe(write);
    write.on("finish", resolve);
    write.on("error", reject);
    audioStream.on("error", reject);
  });

  console.log(`Wrote ${outFile}`);
};

const tts = new MsEdgeTTS();
await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

for (const id of ids) {
  const video = VIDEOS[id];
  await mkdir(video.audioDir, { recursive: true });
  for (const [key, text] of Object.entries(video.narration)) {
    await synthesize(tts, video.audioDir, key, text);
  }
}

tts.close();
console.log("Voiceover generation complete.");
