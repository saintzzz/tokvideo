import React from "react";
import {
  AbsoluteFill,
  Audio,
  Series,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CartoonPuppet, PuppetPalette } from "./CartoonPuppet";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export type CartoonBeat = {
  text: string;
  caption?: string;
  /** seconds this beat occupies; resolved from audio when available */
  durationSec?: number;
  talkLevel?: number; // 0..1 drive for the puppet mouth
};

export type CartoonEpisode = {
  slug: string;
  locale?: "vi" | "en";
  title: string;
  palette?: Partial<PuppetPalette>;
  background?: [string, string]; // gradient stops
  beats: CartoonBeat[];
};

// Vertical shorts pipeline (1080x1920): gradient scene + mascot puppet
// + bottom karaoke-style caption card. Audio reuses the committed
// beat-N.mp3 convention under public/audio/cartoon/<slug>/ — missing
// audio falls back to silent with text timing, so the rig can be
// previewed before voiceover exists.
export const CartoonShortVideo: React.FC<{
  episode: CartoonEpisode;
  durations: number[]; // frames per beat
  hasAudio: boolean[];
}> = ({ episode, durations, hasAudio }) => {
  const [from, to] = episode.background ?? ["#2C3E50", "#141E28"];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${from}, ${to})` }}>
      <Series>
        {episode.beats.map((beat, i) => (
          <Series.Sequence key={i} durationInFrames={durations[i]}>
            <Beat
              beat={beat}
              index={i}
              slug={episode.slug}
              palette={episode.palette}
              hasAudio={hasAudio[i]}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

const Beat: React.FC<{
  beat: CartoonBeat;
  index: number;
  slug: string;
  palette?: Partial<PuppetPalette>;
  hasAudio: boolean;
}> = ({ beat, index, slug, palette, hasAudio }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Talk envelope: while audio exists use a lively sine mix (per-beat
  // caption word timings can replace this once wired); silent beats
  // breathe with a small amplitude.
  const talking = hasAudio;
  const talkLevel = talking
    ? Math.min(1, 0.45 + 0.35 * Math.abs(Math.sin(frame * 0.55)) + 0.2 * Math.abs(Math.sin(frame * 1.3)))
    : 0.05 + 0.03 * Math.abs(Math.sin(frame * 0.1));

  const fade = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {hasAudio ? <Audio src={staticFile(`audio/cartoon/${slug}/beat-${index}.mp3`)} /> : null}
      <div style={{ position: "absolute", top: "12%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CartoonPuppet talkLevel={talkLevel} scale={1.5} palette={palette} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 18,
            padding: "14px 30px",
            maxWidth: 900,
          }}
        >
          <KineticText
            key={index}
            text={beat.caption ?? beat.text}
            fontSize={54}
            fontFamily={fonts.sans}
            fontWeight={800}
            color="#FFFFFF"
            highlightColor="#F1C40F"
            highlightStyle="chip"
            stagger={2}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
