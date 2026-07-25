import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import giaCatLuongNarration from "../src/narration.json" with { type: "json" };
import churchillNarration from "../src/narration.churchill.json" with { type: "json" };

// Free Microsoft Edge "Read Aloud" voice, no API key required.
// Other good Vietnamese options: "vi-VN-HoaiMyNeural" (female).
const VOICE = process.env.EDGE_TTS_VOICE ?? "vi-VN-NamMinhNeural";

const publicDir = path.join(import.meta.dirname, "..", "public", "audio");

const VIDEOS = [
  { audioDir: publicDir, narration: giaCatLuongNarration },
  { audioDir: path.join(publicDir, "churchill"), narration: churchillNarration },
];

const synthesize = async (tts, outDir, key, text) => {
  const { audioStream } = tts.toStream(text);
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

for (const video of VIDEOS) {
  await mkdir(video.audioDir, { recursive: true });
  for (const [key, text] of Object.entries(video.narration)) {
    await synthesize(tts, video.audioDir, key, text);
  }
}

tts.close();
console.log("Voiceover generation complete.");
