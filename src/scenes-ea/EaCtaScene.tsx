import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../fonts";
import { EaBackdrop, EA_GOLD, EA_INK, EA_NAVY_DEEP } from "./EaBackdrop";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { EnglishArenaEpisode } from "../english-arena/types";

// Closing card — the whole ad funnels to one action: open
// ea.vieschool.com and let the kid play a free round. Guest trial needs
// no account, which is the lowest-friction CTA this product has.
export const EaCtaScene: React.FC<{
  episode: EnglishArenaEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pigIn = spring({ frame: frame - 2, fps, config: { damping: 12 } });
  const cardIn = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const shimmer = interpolate(frame % 50, [0, 25, 50], [0.9, 1.15, 0.9]);

  return (
    <EaBackdrop>
      {hasAudio ? (
        <Audio src={staticFile(`audio/english-arena/${episode.slug}/cta.mp3`)} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          padding: "0 48px",
          paddingBottom: 200,
        }}
      >
        <div style={{ fontSize: 130, transform: `scale(${pigIn})` }}>🐷</div>

        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 6,
            color: EA_GOLD,
            opacity: interpolate(frame, [8, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          ENGLISH ARENA
        </div>

        <div
          style={{
            transform: `translateY(${interpolate(cardIn, [0, 1], [60, 0])}px)`,
            opacity: cardIn,
            backgroundColor: EA_GOLD,
            borderRadius: 30,
            padding: "30px 54px",
            boxShadow: `0 0 ${60 * shimmer}px rgba(245,179,1,0.45)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 900,
              fontSize: 64,
              color: EA_NAVY_DEEP,
            }}
          >
            ea.vieschool.com
          </div>
        </div>

        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 36,
            color: EA_INK,
            textAlign: "center",
            opacity: interpolate(frame, [16, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Thử miễn phí - không cần tài khoản
        </div>
      </div>

      <KaraokeCaption
        videoId={`ea-${episode.slug}`}
        scene="cta"
        accent={EA_GOLD}
      />
    </EaBackdrop>
  );
};
