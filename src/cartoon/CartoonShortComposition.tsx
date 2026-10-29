import { Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { CartoonShortVideo, CartoonEpisode } from "./CartoonShortVideo";
import { FPS } from "../timing";

// One <Composition> per cartoon short episode (src/cartoon/episodes/*.json).
// 1080x1920 vertical. Beat durations come from committed mp3s when present
// (getAudioDurationInSeconds via staticFile, same convention as
// suckhoe-long's resolveLongFormDurations) else durationSec in the JSON.
// No node builtins here — this file is bundled for the browser, so
// fs/path imports break every composition in the project.
import demoEpisode from "./episodes/demo-tam-cam.json";

const EPISODES: CartoonEpisode[] = [demoEpisode as CartoonEpisode];

// Beat audio probe via HTTP on the bundled public/ asset — returns null
// when the file is missing or undecodable.
const probe = async (slug: string, i: number): Promise<number | null> => {
  try {
    return await getAudioDurationInSeconds(
      staticFile(`audio/cartoon/${slug}/beat-${i}.mp3`)
    );
  } catch {
    return null;
  }
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
            const dur = await probe(episode.slug, i);
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
