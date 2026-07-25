import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import narration from "../src/narration.json" with { type: "json" };

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — override with a Vietnamese voice from the ElevenLabs Voice Library for best results
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5";

if (!API_KEY) {
  console.error(
    "Missing ELEVENLABS_API_KEY. Set it as an environment variable (locally) or a repo secret (GitHub Actions)."
  );
  process.exit(1);
}

const outDir = path.join(import.meta.dirname, "..", "public", "audio");

const synthesize = async (key, text) => {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `ElevenLabs request failed for "${key}": ${res.status} ${body}`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const outFile = path.join(outDir, `${key}.mp3`);
  await writeFile(outFile, buffer);
  console.log(`Wrote ${outFile} (${buffer.byteLength} bytes)`);
};

await mkdir(outDir, { recursive: true });

for (const [key, text] of Object.entries(narration)) {
  await synthesize(key, text);
}

console.log("Voiceover generation complete.");
