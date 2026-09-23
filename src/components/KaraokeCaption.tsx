import React from "react";
import {
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../fonts";

// Word-level karaoke caption synced to the voiceover (PRD Q-03). Reads
// public/captions/<videoId>/<scene>.json emitted by
// generate-voiceover.mjs; when the file is absent the component renders
// nothing. The active word is highlighted in the theme accent.

type CaptionFile = {
  durationSec: number;
  words: { w: string; start: number; end: number }[];
};

// Caption JSONs are fetched at runtime via staticFile — cache the fetch
// per URL so every word's render doesn't re-request.
const cache = new Map<string, Promise<CaptionFile | null>>();
const loadCaptions = (src: string): Promise<CaptionFile | null> => {
  if (!cache.has(src)) {
    cache.set(
      src,
      fetch(staticFile(src))
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    );
  }
  return cache.get(src)!;
};

// Generous bottom offset keeps captions above the Shorts UI overlay
// (title + action rail live in the bottom ~22% — see SafeZone).
export const KaraokeCaption: React.FC<{
  videoId: string;
  scene: string;
  accent: string;
  enabled?: boolean;
}> = ({ videoId, scene, accent, enabled = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [data, setData] = React.useState<CaptionFile | null>(null);

  React.useEffect(() => {
    let live = true;
    loadCaptions(`captions/${videoId}/${scene}.json`).then((d) => {
      if (live) setData(d);
    });
    return () => {
      live = false;
    };
  }, [videoId, scene]);

  if (!enabled || !data?.words?.length) return null;

  const t = frame / fps;
  const active = data.words.findIndex((w) => t >= w.start && t < w.end);
  // Show a sliding window of words around the active one — full-scene
  // text would overflow the frame and reads like a transcript, not a
  // caption.
  const WINDOW = 9;
  const anchor = active === -1 ? data.words.findIndex((w) => t < w.start) : active;
  const start = Math.max(0, Math.min(anchor - 3, data.words.length - WINDOW));
  const slice = data.words.slice(start, start + WINDOW);

  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        bottom: 300,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "6px 10px",
        textAlign: "center",
      }}
    >
      {slice.map((w, i) => {
        const idx = start + i;
        const isActive = idx === active;
        const isPast = idx < active;
        const scale = isActive
          ? interpolate(t, [w.start, w.start + 0.08], [1, 1.12], {
              extrapolateRight: "clamp",
            })
          : 1;
        return (
          <span
            key={idx}
            style={{
              fontFamily: fonts.sans,
              fontWeight: isActive ? 800 : 600,
              fontSize: isActive ? 44 : 40,
              color: isActive ? accent : isPast ? "#ffffffcc" : "#ffffff88",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              transform: `scale(${scale})`,
              display: "inline-block",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
