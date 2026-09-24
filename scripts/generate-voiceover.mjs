import { createWriteStream } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { withRetry } from "./lib/retry.mjs";
import { probeDurationSeconds, sanityCheckAudio } from "./lib/audio-probe.mjs";
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
// locale routes to different connector phrasing — "en" episodes are
// written in English from the start (culturally-appropriate Western home
// remedies, not translations), so their narration needs English
// connectors too, not just a different TTS voice.
const buildSucKhoeNarration = (episode) => {
  if (episode.locale === "en") {
    return {
      hook: episode.hook,
      remedy: episode.remedy,
      steps: `Here's all it takes. ${episode.steps
        .map((step, i) => `Step ${i + 1}, ${step}`)
        .join(". ")}.`,
      cta: episode.caution
        ? `${episode.cta}. One quick note: ${episode.caution.toLowerCase()}.`
        : episode.cta,
    };
  }
  return {
    hook: episode.hook,
    remedy: episode.remedy,
    steps: `Cách làm rất đơn giản. ${episode.steps
      .map((step, i) => `Bước ${i + 1}, ${step}`)
      .join(". ")}.`,
    cta: episode.caution
      ? `${episode.cta}. Lưu ý, ${episode.caution.toLowerCase()}.`
      : episode.cta,
  };
};

// Free Microsoft Edge "Read Aloud" voices, no API key required.
// Other good Vietnamese options: "vi-VN-HoaiMyNeural" (female).
// Other good English options: "en-US-AriaNeural", "en-GB-SoniaNeural".
const VOICE_VI = process.env.EDGE_TTS_VOICE ?? "vi-VN-NamMinhNeural";
const VOICE_EN = process.env.EDGE_TTS_VOICE_EN ?? "en-US-JennyNeural";

// Punchier "ad read" delivery instead of flat narration: a bit faster,
// a bit brighter/louder. Override per-run with env vars if a specific
// video needs a calmer read.
const PROSODY = {
  rate: process.env.TTS_RATE ?? "+14%",
  pitch: process.env.TTS_PITCH ?? "+4%",
  volume: process.env.TTS_VOLUME ?? "+15%",
};

// Long-form (~20 min) episodes have multiple recurring characters in one
// video, so each needs its own voice/delivery rather than one voice for
// the whole thing. Vietnamese Edge TTS only has one realistic female
// voice, so grandma vs. granddaughter are differentiated by prosody
// (rate/pitch) on the same voice; English has more voices available, so
// the granddaughter gets a genuinely different voice there.
const LONG_FORM_VOICES = {
  vi: {
    narrator: { voice: VOICE_VI, prosody: { rate: "+0%", pitch: "+0%", volume: "+10%" } },
    grandma: { voice: VOICE_VI, prosody: { rate: "+8%", pitch: "-2%", volume: "+15%" } },
    granddaughter: { voice: VOICE_VI, prosody: { rate: "+16%", pitch: "+10%", volume: "+15%" } },
  },
  en: {
    narrator: { voice: "en-US-GuyNeural", prosody: { rate: "+0%", pitch: "+0%", volume: "+10%" } },
    grandma: { voice: VOICE_EN, prosody: { rate: "+6%", pitch: "-2%", volume: "+15%" } },
    granddaughter: { voice: "en-US-AriaNeural", prosody: { rate: "+12%", pitch: "+4%", volume: "+15%" } },
  },
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
    voice: episode.locale === "en" ? VOICE_EN : VOICE_VI,
  };
}

// Long-form (~20 min) episodes — each beat of dialogue is its own audio
// file (beat-<index>.mp3), voiced according to which recurring character
// speaks it. Unlike the Shorts above, narration entries here are
// {text, voice, prosody} objects (per-beat voice), not plain strings.
const longFormDir = path.join(
  import.meta.dirname,
  "..",
  "src",
  "suckhoe",
  "long-form"
);
const longFormFiles = (await readdir(longFormDir)).filter(
  (f) => f.endsWith(".json")
);
const LONG_FORM_EPISODES = await Promise.all(
  longFormFiles.map(async (file) => {
    const url = pathToFileURL(path.join(longFormDir, file));
    const mod = await import(url, { with: { type: "json" } });
    return mod.default;
  })
);

for (const episode of LONG_FORM_EPISODES) {
  const voices = LONG_FORM_VOICES[episode.locale] ?? LONG_FORM_VOICES.vi;
  const narration = {};
  episode.beats.forEach((beat, i) => {
    const { voice, prosody } = voices[beat.speaker] ?? voices.narrator;
    narration[`beat-${i}`] = { text: beat.text, voice, prosody };
  });
  VIDEOS[`suckhoe-long-${episode.slug}`] = {
    audioDir: path.join(publicDir, "suckhoe-long", episode.slug),
    narration,
  };
}

// "Nha Ba Tu" animated-film series (src/animated-film/) — a much larger
// cast than the long-form dialogue pairs above, but Edge TTS only has one
// realistic Vietnamese voice per gender, so every character is
// differentiated by prosody (rate/pitch/volume) on top of just 2 base
// voices, same technique as LONG_FORM_VOICES.
const ANIMATED_FILM_VOICES = {
  narrator: { voice: VOICE_VI, prosody: { rate: "+0%", pitch: "+0%", volume: "+10%" } },
  ba_tu: { voice: "vi-VN-HoaiMyNeural", prosody: { rate: "-6%", pitch: "-4%", volume: "+12%" } },
  mai: { voice: "vi-VN-HoaiMyNeural", prosody: { rate: "+10%", pitch: "+8%", volume: "+14%" } },
  huy: { voice: VOICE_VI, prosody: { rate: "+2%", pitch: "-2%", volume: "+12%" } },
  co_sau: { voice: "vi-VN-HoaiMyNeural", prosody: { rate: "+6%", pitch: "+2%", volume: "+16%" } },
  chu_bay: { voice: VOICE_VI, prosody: { rate: "-10%", pitch: "-8%", volume: "+12%" } },
  be_tom: { voice: "vi-VN-HoaiMyNeural", prosody: { rate: "+18%", pitch: "+18%", volume: "+14%" } },
  bac_si_long: { voice: VOICE_VI, prosody: { rate: "-2%", pitch: "+0%", volume: "+10%" } },
  y_ta_hoa: { voice: "vi-VN-HoaiMyNeural", prosody: { rate: "+4%", pitch: "-2%", volume: "+12%" } },
  chi_ngoc: { voice: "vi-VN-HoaiMyNeural", prosody: { rate: "+8%", pitch: "+4%", volume: "+12%" } },
};

const animatedFilmDir = path.join(
  import.meta.dirname,
  "..",
  "src",
  "animated-film",
  "episodes"
);
let ANIMATED_FILM_EPISODES = [];
try {
  const animatedFilmFiles = (await readdir(animatedFilmDir)).filter((f) =>
    f.endsWith(".json")
  );
  ANIMATED_FILM_EPISODES = await Promise.all(
    animatedFilmFiles.map(async (file) => {
      const url = pathToFileURL(path.join(animatedFilmDir, file));
      const mod = await import(url, { with: { type: "json" } });
      return { slug: file.replace(/\.json$/, ""), ...mod.default };
    })
  );
} catch {
  // Directory doesn't exist yet if no episode script has been written.
}

for (const episode of ANIMATED_FILM_EPISODES) {
  const narration = {};
  episode.beats.forEach((beat, i) => {
    const { voice, prosody } =
      ANIMATED_FILM_VOICES[beat.speaker] ?? ANIMATED_FILM_VOICES.narrator;
    narration[`beat-${i}`] = { text: beat.text, voice, prosody };
  });
  VIDEOS[`animated-film-${episode.slug}`] = {
    audioDir: path.join(publicDir, "animated-film", episode.slug),
    narration,
  };
}

// Pass one or more video ids as CLI args to generate only those. The bare
// id "suckhoe" expands to every "suckhoe-<slug>" Short episode (NOT the
// long-form ones — those are ~20 minutes each and far too expensive to
// bundle into the "render everything for review" path unnoticed), so CI
// doesn't need updating when a new episode is added. "suckhoe-long"
// expands to every long-form episode. With no args, generates every video
// (used for local dev — this DOES include long-form, since that's an
// explicit, deliberate local run).
const requested = process.argv.slice(2);
const ids =
  requested.length > 0
    ? requested.flatMap((id) => {
        if (id === "suckhoe") {
          return Object.keys(VIDEOS).filter(
            (key) => key.startsWith("suckhoe-") && !key.startsWith("suckhoe-long-")
          );
        }
        if (id === "suckhoe-long") {
          return Object.keys(VIDEOS).filter((key) => key.startsWith("suckhoe-long-"));
        }
        if (id === "animated-film") {
          return Object.keys(VIDEOS).filter((key) => key.startsWith("animated-film-"));
        }
        return [id];
      })
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
const synthesizeOnce = async (outFile, text, voice, prosody) => {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, prosody);

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

// Fallback voices per locale when the primary is unhealthy — msedge-tts
// is an unofficial endpoint, individual voices can disappear or degrade.
// Voice pools are ordered; a voice that fails the healthcheck below is
// swapped for the next candidate for THIS RUN ONLY (no config mutation).
const FALLBACK_VOICES = {
  vi: ["vi-VN-NamMinhNeural", "vi-VN-HoaiMyNeural"],
  en: ["en-US-JennyNeural", "en-US-AriaNeural", "en-US-GuyNeural"],
};
const localeOfVoice = (voice) => (voice.startsWith("vi-") ? "vi" : "en");

// voice -> working substitute, filled by the healthcheck pass below.
const voiceSubstitutions = new Map();
const resolveVoice = (voice) => voiceSubstitutions.get(voice) ?? voice;

const synthesize = async (outDir, key, text, voice, prosody) => {
  const outFile = path.join(outDir, `${key}.mp3`);

  await withRetry(
    async () => {
      await synthesizeOnce(outFile, text, voice, prosody);
      const check = sanityCheckAudio(outFile);
      if (!check.ok) {
        throw new Error(`sanity check failed: ${check.reason}`);
      }
      console.log(`Wrote ${outFile}`);
    },
    { attempts: 3, baseMs: 1500, label: `tts ${key}` }
  ).catch((err) => {
    throw new Error(`Failed to synthesize ${outFile}: ${err.message}`);
  });
};

// Healthcheck every distinct voice the run needs: one short synthesis
// each. A voice that fails gets swapped to the next candidate in its
// locale pool; if the whole pool fails we abort loudly — that means the
// TTS endpoint itself is down and every file would come out broken.
const healthcheckVoices = async () => {
  const needed = new Set();
  for (const id of ids) {
    const video = VIDEOS[id];
    for (const entry of Object.values(video.narration)) {
      const isPerBeatEntry = typeof entry === "object" && entry !== null;
      needed.add(isPerBeatEntry ? entry.voice : video.voice ?? VOICE_VI);
    }
  }

  await mkdir(publicDir, { recursive: true });
  const probeFile = path.join(publicDir, ".voice-healthcheck.mp3");
  for (const voice of needed) {
    let healthy = false;
    try {
      await withRetry(
        () => synthesizeOnce(probeFile, "kiểm tra giọng đọc.", voice, { rate: "+0%", pitch: "+0%", volume: "+0%" }),
        { attempts: 2, baseMs: 1000, label: `healthcheck ${voice}` }
      );
      healthy = sanityCheckAudio(probeFile).ok;
    } catch {
      healthy = false;
    }

    if (healthy) continue;

    const pool = FALLBACK_VOICES[localeOfVoice(voice)] ?? [];
    let swapped = null;
    for (const candidate of pool) {
      if (candidate === voice || needed.has(candidate) && voiceSubstitutions.get(candidate)) continue;
      try {
        await withRetry(
          () => synthesizeOnce(probeFile, "voice check.", candidate, { rate: "+0%", pitch: "+0%", volume: "+0%" }),
          { attempts: 2, baseMs: 1000, label: `fallback ${candidate}` }
        );
        if (sanityCheckAudio(probeFile).ok) {
          swapped = candidate;
          break;
        }
      } catch { /* try next candidate */ }
    }
    if (!swapped) {
      throw new Error(
        `TTS voice "${voice}" is unhealthy and every fallback in the "${localeOfVoice(voice)}" pool failed too — the msedge-tts endpoint is likely down. Aborting rather than writing broken audio.`
      );
    }
    console.warn(`Voice "${voice}" unhealthy — substituting "${swapped}" for this run`);
    voiceSubstitutions.set(voice, swapped);
  }
};

await healthcheckVoices();

// ── Karaoke caption emission (Q-03) ───────────────────────────────
// Word timings are allocated proportionally across the real mp3
// duration — see docs/ARCHITECTURE.md D1. Written next to the audio in
// public/captions/<videoId>/<scene>.json for KaraokeCaption to fetch.
const writeCaptions = async (videoId, key, text, durationSec) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || !durationSec) return;
  // 92% of the clip is spoken words; the rest is leading/trailing breath.
  const budget = durationSec * 0.92;
  const lead = durationSec * 0.04;
  const weights = words.map((w) => {
    // Longer words take longer; sentence-ending punctuation adds a pause.
    const pause = /[.!?,;:…—]$/.test(w) ? 2.5 : 0;
    return Math.max(w.replace(/[^\p{L}\p{N}]/gu, "").length, 1) + pause;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let t = lead;
  const timed = words.map((w, i) => {
    const dur = (weights[i] / total) * budget;
    const entry = { w, start: +t.toFixed(3), end: +(t + dur).toFixed(3) };
    t += dur;
    return entry;
  });
  const dir = path.join(import.meta.dirname, "..", "public", "captions", videoId);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${key}.json`),
    JSON.stringify({ durationSec: +durationSec.toFixed(3), words: timed }, null, 1)
  );
};

for (const id of ids) {
  const video = VIDEOS[id];
  await mkdir(video.audioDir, { recursive: true });
  for (const [key, entry] of Object.entries(video.narration)) {
    // Long-form entries are {text, voice, prosody} objects (per-beat
    // voice); every other video's narration is a plain string sharing the
    // video-level voice and the global PROSODY.
    const isPerBeatEntry = typeof entry === "object" && entry !== null;
    const text = isPerBeatEntry ? entry.text : entry;
    const voice = resolveVoice(isPerBeatEntry ? entry.voice : video.voice ?? VOICE_VI);
    const prosody = isPerBeatEntry ? entry.prosody : PROSODY;
    await synthesize(video.audioDir, key, text, voice, prosody);
    const dur = probeDurationSeconds(path.join(video.audioDir, `${key}.mp3`));
    if (dur) await writeCaptions(id, key, text, dur);
  }
}

console.log("Voiceover generation complete.");
