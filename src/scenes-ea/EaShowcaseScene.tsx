import React from "react";
import {
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../fonts";
import { EaBackdrop, EA_GOLD, EA_INK } from "./EaBackdrop";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { EnglishArenaEpisode } from "../english-arena/types";

// Product-proof beat: the narration line plays over a real app
// screenshot (slow zoom inside a rounded card) — actual product UI is
// the ad's credibility. Beats without a shot render as a text card.
export const EaShowcaseScene: React.FC<{
  episode: EnglishArenaEpisode;
  hasAudio: boolean;
  partIndex: number;
  audioKey: string;
}> = ({ episode, hasAudio, partIndex, audioKey }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const part = episode.parts[partIndex];
  const text = part?.text ?? "";

  const cardIn = spring({ frame: frame - 8, fps, config: { damping: 16 } });
  const cardY = interpolate(cardIn, [0, 1], [70, 0]);
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <EaBackdrop>
      {hasAudio ? (
        <Audio
          src={staticFile(`audio/english-arena/${episode.slug}/${audioKey}.mp3`)}
        />
      ) : null}

      {part?.label ? (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [6, 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 3,
              color: "#0A1730",
              backgroundColor: EA_GOLD,
              borderRadius: 999,
              padding: "10px 30px",
            }}
          >
            {part.label}
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          top: part?.label ? 230 : 190,
          bottom: 400,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 44px",
        }}
      >
        {part?.shot ? (
          <div
            style={{
              position: "relative",
              width: 660,
              height: "100%",
              maxHeight: 1240,
              overflow: "hidden",
              borderRadius: 40,
              border: `3px solid ${EA_GOLD}55`,
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
              transform: `translateY(${cardY}px)`,
              opacity: cardIn,
            }}
          >
            <Img
              src={staticFile(`images/english-arena/${part.shot}`)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                transform: `scale(${zoom})`,
                transformOrigin: "center 30%",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 820,
              opacity: cardIn,
              transform: `translateY(${cardY}px)`,
              backgroundColor: "rgba(10,23,48,0.72)",
              border: `2px solid ${EA_GOLD}44`,
              borderRadius: 32,
              padding: "44px 48px",
            }}
          >
            <div
              style={{
                fontFamily: fonts.sans,
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1.45,
                color: EA_INK,
                textAlign: "center",
              }}
            >
              {text}
            </div>
          </div>
        )}
      </div>

      <KaraokeCaption
        videoId={`ea-${episode.slug}`}
        scene={audioKey}
        accent={EA_GOLD}
      />
    </EaBackdrop>
  );
};
