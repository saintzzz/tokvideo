import React from "react";
import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";
import type { SucKhoeEpisode } from "../suckhoe/types";

// Ambient music bed under the whole composition (PRD Q-01). Track is
// picked by episode category + locale, with a generic fallback; when no
// file exists the component renders nothing (silent, never breaks).
// Starter tracks are ffmpeg-synthesized pads in public/music/ — swap in
// licensed tracks under the same filenames to upgrade without code
// changes. Volume ducks to bed level; voice sits on top via each scene's
// own <Audio>.

const TRACK_VOLUME = 0.14;

const candidates = (episode: SucKhoeEpisode): string[] => {
  const locale = episode.locale === "en" ? "en" : "vi";
  const names = [];
  if (episode.category) names.push(`music/${episode.category}-${locale}.mp3`);
  names.push(`music/default-${locale}.mp3`);
  names.push("music/default.mp3");
  return names;
};

// staticFile paths are resolved at bundle time — a missing file would
// 404 at render. Keep the manifest of bundled tracks in sync with
// scripts/generate-audio-assets.mjs output.
const KNOWN_TRACKS = new Set([
  "music/default-vi.mp3",
  "music/default-en.mp3",
  "music/ho-cam-hong-vi.mp3",
  "music/tieu-hoa-vi.mp3",
  "music/giac-ngu-vi.mp3",
  "music/dau-nhuc-met-moi-vi.mp3",
  "music/da-toc-lam-dep-vi.mp3",
  "music/en-cold-throat-en.mp3",
  "music/en-sleep-relax-en.mp3",
  "music/en-skin-beauty-en.mp3",
  "music/en-digestion-en.mp3",
]);

export const MusicBed: React.FC<{ episode: SucKhoeEpisode }> = ({ episode }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const track = candidates(episode).find((c) => KNOWN_TRACKS.has(c));
  if (!track) return null;

  const volume = (frame: number) =>
    interpolate(
      frame,
      [0, fps * 0.8, durationInFrames - fps * 1.2, durationInFrames - 1],
      [0, TRACK_VOLUME, TRACK_VOLUME, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

  return <Audio src={staticFile(track)} volume={volume} loop />;
};
