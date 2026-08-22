import React from "react";
import { Series } from "remotion";
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
  return (
    <Series>
      {segments.map((segment, i) => {
        if (segment.type === "diagram") {
          const beat = episode.beats[segment.beatIndex];
          if (!beat.factReveal) return null;
          return (
            <Series.Sequence key={i} durationInFrames={segment.durationInFrames}>
              <DiagramScene diagram={beat.factReveal.diagram} locale={episode.locale} />
            </Series.Sequence>
          );
        }
        const beat = episode.beats[segment.beatIndex];
        return (
          <Series.Sequence key={i} durationInFrames={segment.durationInFrames}>
            <DialogueScene
              beat={beat}
              locale={episode.locale}
              hasAudio={segment.hasAudio}
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
  );
};
