import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../fonts";
import { EaBackdrop, EA_GOLD, EA_INK } from "./EaBackdrop";
import { KineticText } from "../components/KineticText";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { EnglishArenaEpisode } from "../english-arena/types";

const PERSONA_CHIP: Record<EnglishArenaEpisode["persona"], string> = {
  "phu-huynh": "DÀNH CHO BA MẸ",
  "giao-vien": "DÀNH CHO GIÁO VIÊN",
  "trung-tam": "DÀNH CHO TRUNG TÂM",
};

// Cold open: the pain, big and kinetic — the 3 seconds that decide
// whether a parent keeps watching.
export const EaHookScene: React.FC<{
  episode: EnglishArenaEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chipIn = spring({ frame: frame - 4, fps, config: { damping: 16 } });
  const underline = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <EaBackdrop>
      {hasAudio ? (
        <Audio src={staticFile(`audio/english-arena/${episode.slug}/hook.mp3`)} />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 180,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: chipIn,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 4,
            color: EA_GOLD,
            border: `2px solid ${EA_GOLD}66`,
            borderRadius: 999,
            padding: "10px 28px",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          {PERSONA_CHIP[episode.persona]}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 340,
          bottom: 420,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 56px",
        }}
      >
        <KineticText
          text={episode.hook}
          fontSize={58}
          fontFamily={fonts.sans}
          fontWeight={800}
          color={EA_INK}
          highlightColor={EA_GOLD}
          stagger={3}
        />
        <div
          style={{
            marginTop: 54,
            height: 8,
            width: `${underline * 240}px`,
            borderRadius: 999,
            backgroundColor: EA_GOLD,
          }}
        />
      </div>

      <KaraokeCaption
        videoId={`ea-${episode.slug}`}
        scene="hook"
        accent={EA_GOLD}
      />
    </EaBackdrop>
  );
};
