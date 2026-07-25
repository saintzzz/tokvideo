import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import narration from "../src/narration.json" with { type: "json" };

// Free Microsoft Edge "Read Aloud" voice, no API key required.
// Other good Vietnamese options: "vi-VN-HoaiMyNeural" (female).
const VOICE = process.env.EDGE_TTS_VOICE ?? "vi-VN-NamMinhNeural";

const outDir = path.join(import.meta.dirname, "..", "public", "audio");

const synthesize = async (tts, key, text) => {
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

await mkdir(outDir, { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

for (const [key, text] of Object.entries(narration)) {
  await synthesize(tts, key, text);
}

tts.close();
console.log("Voiceover generation complete.");
