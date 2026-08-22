import { createWriteStream } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import giaCatLuongNarration from "../src/narration.json" with { type: "json" };
import churchillNarration from "../src/narration.churchill.json" with { type: "json" };
import hippocratesNarration from "../src/narration.hippocrates.json" with { type: "json" };
import ideverrayNarration from "../src/narration.ideverray.json" with { type: "json" };
import ammuuNarration from "../src/narration.ammuu.json" with { type: "json" };

// Suc Khoe (health channel) episodes — each is its own video id
// (`suckhoe-<slug>`), its own audio subfolder, and its own JSON file
// under src/suckhoe/episodes/. Adding a new episode is just adding a new
// JSON file there — this reads the directory instead of a hardcoded list,
// so nothing here needs to change.
const episodesDir = path.join(
  import.meta.dirname,
  "..",
  "src",
  "suckhoe",
  "episodes"
);
const episodeFiles = (await readdir(episodesDir)).filter((f) =>
  f.endsWith(".json")
);
const SUCKHOE_EPISODES = await Promise.all(
  episodeFiles.map(async (file) => {
    const url = pathToFileURL(path.join(episodesDir, file));
    const mod = await import(url, { with: { type: "json" } });
    return mod.default;
  })
);

// Spoken narration is derived from the same structured content the on
// screen text uses, so there is only one place to edit per episode.
const buildSucKhoeNarration = (episode) => ({
  hook: episode.hook,
  remedy: episode.remedy,
  steps: `Cách làm rất đơn giản. ${episode.steps
    .map((step, i) => `Bước ${i + 1}, ${step}`)
    .join(". ")}.`,
  cta: episode.caution
    ? `${episode.cta}. Lưu ý, ${episode.caution.toLowerCase()}.`
    : episode.cta,
});

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
  ammuu: {
    audioDir: path.join(publicDir, "ammuu"),
    narration: ammuuNarration,
  },
};

for (const episode of SUCKHOE_EPISODES) {
  VIDEOS[`suckhoe-${episode.slug}`] = {
    audioDir: path.join(publicDir, "suckhoe", episode.slug),
    narration: buildSucKhoeNarration(episode),
  };
}

// Pass one or more video ids as CLI args to generate only those. The bare
// id "suckhoe" expands to every "suckhoe-<slug>" episode, so CI doesn't
// need updating when a new episode is added. With no args, generates
// every video (used for local dev).
const requested = process.argv.slice(2);
const ids =
  requested.length > 0
    ? requested.flatMap((id) =>
        id === "suckhoe"
          ? Object.keys(VIDEOS).filter((key) => key.startsWith("suckhoe-"))
          : [id]
      )
    : Object.keys(VIDEOS);

for (const id of ids) {
  if (!VIDEOS[id]) {
    console.error(`Unknown video id "${id}". Known ids: ${Object.keys(VIDEOS).join(", ")}`);
    process.exit(1);
  }
}

// The underlying WebSocket to Microsoft's endpoint sometimes drops mid
// stream on a long-lived connection (seen in practice after ~10+ requests
// in a row), leaving a 0-byte mp3 behind. Opening a fresh connection per
// request and verifying the file actually has bytes — with a couple of
// retries — has been reliable in practice.
const synthesizeOnce = async (outFile, text) => {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, PROSODY);

    await new Promise((resolve, reject) => {
      const write = createWriteStream(outFile);
      audioStream.pipe(write);
      write.on("finish", resolve);
      write.on("error", reject);
      audioStream.on("error", reject);
    });
  } finally {
    tts.close();
  }
};

const MAX_ATTEMPTS = 3;

const synthesize = async (outDir, key, text) => {
  const outFile = path.join(outDir, `${key}.mp3`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await synthesizeOnce(outFile, text);
      const { size } = await stat(outFile);
      if (size > 0) {
        console.log(`Wrote ${outFile}`);
        return;
      }
      console.warn(`${outFile} came back empty (attempt ${attempt}/${MAX_ATTEMPTS}), retrying...`);
    } catch (err) {
      console.warn(`${outFile} failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`);
    }
  }

  throw new Error(`Failed to synthesize ${outFile} after ${MAX_ATTEMPTS} attempts`);
};

for (const id of ids) {
  const video = VIDEOS[id];
  await mkdir(video.audioDir, { recursive: true });
  for (const [key, text] of Object.entries(video.narration)) {
    await synthesize(video.audioDir, key, text);
  }
}

console.log("Voiceover generation complete.");
