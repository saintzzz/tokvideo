import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { DialogueScene } from "./scenes-suckhoe-long/DialogueScene";
import { DiagramScene } from "./scenes-suckhoe-long/DiagramScene";
import { LongFormEpisode } from "./suckhoe/long-form/types";

export type LongFormSegment =
  | { type: "beat"; beatIndex: number; durationInFrames: number; hasAudio: boolean }
  | { type: "diagram"; beatIndex: number; durationInFrames: number };

export type SucKhoeLongVideoProps = {
  episode: LongFormEpisode;
  segments: LongFormSegment[];
};

// One continuous long-form episode: a fixed sequence of dialogue beats
// (each its own audio-driven Sequence) with a short silent diagram scene
// inserted right after any beat that reveals the research behind a
// remedy. New episodes are added as content
// (src/suckhoe/long-form/*.json), not as new scene code.
export const SucKhoeLongVideo: React.FC<SucKhoeLongVideoProps> = ({ episode, segments }) => {
  // Retention research (2026-08-23): numbered-list/countdown framing ("Top
  // N", "5 mẹo được kiểm chứng") measurably keeps viewers watching to see
  // every item — once you commit to a count, leaving before the end feels
  // like missing something. The episode already checks a fixed number of
  // remedies one by one; this just makes that count EXPLICIT on screen
  // instead of implicit, via a "Mẹo N/total" badge on each diagram reveal.
  const totalFactReveals = episode.beats.filter((b) => b.factReveal).length;
  let factRevealSeen = 0;

  // Dark ambience drone under narrator-only story arcs (remedy episodes
  // are dialogue-driven and shouldn't get horror BGM). Synthesized
  // offline into public/audio/bgm/horror-drone.mp3 — free, loopable.
  const isNarratorStory = episode.beats.every((b) => b.speaker === "narrator");
  const imageFor = (beatIndex: number) =>
    episode.beatImages?.[beatIndex] ??
    episode.sceneImages?.[episode.beats[beatIndex]?.scene];

  return (
    <AbsoluteFill>
      {isNarratorStory ? (
        <Audio loop src={staticFile("audio/bgm/horror-drone.mp3")} volume={0.11} />
      ) : null}
    <Series>
      {segments.map((segment, i) => {
        if (segment.type === "diagram") {
          const beat = episode.beats[segment.beatIndex];
          if (!beat.factReveal) return null;
          factRevealSeen += 1;
          return (
            <Series.Sequence key={i} durationInFrames={segment.durationInFrames}>
              <DiagramScene
                diagram={beat.factReveal.diagram}
                locale={episode.locale}
                factRevealIndex={factRevealSeen}
                factRevealTotal={totalFactReveals}
              />
            </Series.Sequence>
          );
        }
        const beat = episode.beats[segment.beatIndex];
        // A visual "reset" cue right where a new scene/act begins — a
        // quick flash + zoom-punch instead of the usual slow push-in.
        // Acts run roughly 45-70s each, comfortably within the 30-90s
        // window retention research recommends for pattern interrupts.
        const previousBeat = episode.beats[segment.beatIndex - 1];
        const isSceneStart = segment.beatIndex === 0 || previousBeat?.scene !== beat.scene;
        const image = imageFor(segment.beatIndex);
        // Fade-through-black whenever the visible still changes — the
        // previous/next beat's image (or absence of one) differs.
        const prevImage =
          segment.beatIndex > 0 ? imageFor(segment.beatIndex - 1) : undefined;
        const nextBeat = episode.beats[segment.beatIndex + 1];
        const nextImage = nextBeat ? imageFor(segment.beatIndex + 1) : undefined;
        const fadeIn = segment.beatIndex === 0 || prevImage !== image;
        const fadeOut = nextBeat !== undefined && nextImage !== image;
        return (
          <Series.Sequence key={i} durationInFrames={segment.durationInFrames}>
            <DialogueScene
              beat={beat}
              locale={episode.locale}
              hasAudio={segment.hasAudio}
              isSceneStart={isSceneStart}
              image={image}
              variant={segment.beatIndex}
              fadeIn={fadeIn}
              fadeOut={fadeOut}
              audioSrc={
                segment.hasAudio
                  ? `audio/suckhoe-long/${episode.slug}/beat-${segment.beatIndex}.mp3`
                  : undefined
              }
            />
          </Series.Sequence>
        );
      })}
    </Series>
    </AbsoluteFill>
  );
};
