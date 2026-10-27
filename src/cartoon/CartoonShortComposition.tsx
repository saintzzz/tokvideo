import { Composition } from "remotion";
import path from "path";
import { existsSync, statSync } from "fs";
import { CartoonShortVideo, CartoonEpisode } from "./CartoonShortVideo";
import { FPS } from "../timing";

// One <Composition> per cartoon short episode (src/cartoon/episodes/*.json).
// 1080x1920 vertical. Beat durations come from committed mp3s when present
// (probeDurationSeconds) else durationSec in the JSON — same convention as
// suckhoe-long so generate-voiceover/RESUME stays reusable.
import demoEpisode from "./episodes/demo-tam-cam.json";

const EPISODES: CartoonEpisode[] = [demoEpisode as CartoonEpisode];

// Beat audio probe: mp3 duration via CBR header read (same math as
// scripts/lib/audio-probe.mjs, inlined to keep this file type-clean).
const probe = (slug: string, i: number): number | null => {
  const p = path.resolve("public", "audio", "cartoon", slug, `beat-${i}.mp3`);
  if (!existsSync(p) || statSync(p).size < 4096) return null;
  // Edge-TTS output is 96k CBR mp3 — duration ≈ size*8/96000. Good
  // enough for scene timing; precise sync uses captions later anyway.
  return (statSync(p).size * 8) / 96000;
};

export const CartoonShortCompositions = () => (
  <>
    {EPISODES.map((episode) => (
      <Composition
        key={episode.slug}
        id={`CartoonShort-${episode.slug}`}
        component={CartoonShortVideo}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={FPS * 90}
        defaultProps={{ episode, durations: [], hasAudio: [] }}
        calculateMetadata={async () => {
          const durations: number[] = [];
          const hasAudio: boolean[] = [];
          for (let i = 0; i < episode.beats.length; i++) {
            const dur = probe(episode.slug, i);
            hasAudio.push(dur != null);
            durations.push(
              Math.ceil((dur ?? episode.beats[i].durationSec ?? 4) * FPS) + 6
            );
          }
          return {
            durationInFrames: durations.reduce((a, b) => a + b, 0),
            props: { episode, durations, hasAudio },
            fps: FPS,
            width: 1080,
            height: 1920,
          };
        }}
      />
    ))}
  </>
);
