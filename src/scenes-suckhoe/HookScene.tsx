import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { BaTuCharacter } from "../components/BaTuCharacter";
import { CinematicCamera } from "../components/CinematicCamera";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";
import { hookStyleForEpisode, themeForEpisode } from "../suckhoe/themes";

// Pattern-interrupt intro treatments for the first ~45 frames — the
// swipe decision happens here. Each style is visually distinct so two
// consecutive uploads never open the same way (PRD Q-06); the style
// rotates by slug hash when the episode doesn't pin hookStyle.
const IntroEffect: React.FC<{ style: string; accent: string }> = ({ style, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (style === "question") {
    const s = spring({ frame: frame - 4, fps, config: { damping: 10, mass: 0.8 } });
    const scale = interpolate(s, [0, 1], [6, 1]);
    const shake = frame > 12 && frame < 22 ? Math.sin(frame * 2.4) * 6 : 0;
    return (
      <div
        style={{
          position: "absolute",
          top: 140,
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 220,
          color: accent,
          opacity: interpolate(frame, [0, 8, 30, 40], [0, 1, 1, 0], {
            extrapolateRight: "clamp",
          }),
          transform: `scale(${scale}) translateX(${shake}px)`,
          textShadow: `0 0 60px ${accent}`,
        }}
      >
        ?
      </div>
    );
  }

  if (style === "countdown") {
    const num = 3 - Math.min(2, Math.floor(frame / 10));
    const pulse = interpolate(frame % 10, [0, 6, 10], [1, 1.25, 1]);
    return (
      <div
        style={{
          position: "absolute",
          top: 170,
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 200,
          color: accent,
          opacity: interpolate(frame, [0, 4, 28, 38], [0, 1, 1, 0], {
            extrapolateRight: "clamp",
          }),
          transform: `scale(${pulse})`,
          textShadow: `0 0 60px ${accent}`,
        }}
      >
        {num}
      </div>
    );
  }

  if (style === "pov") {
    const wipe = interpolate(frame, [0, 20], [0, 100], {
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${accent}22 0%, transparent 40%)`,
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
          opacity: interpolate(frame, [28, 40], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    );
  }

  // statement — accent underline swipe under the headline zone.
  const w = interpolate(frame, [6, 26], [0, 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 420,
        left: "10%",
        height: 14,
        width: `${w}%`,
        backgroundColor: accent,
        borderRadius: 8,
        boxShadow: `0 0 30px ${accent}`,
        opacity: interpolate(frame, [0, 6, 34, 44], [0, 1, 1, 0], {
          extrapolateRight: "clamp",
        }),
      }}
    />
  );
};

export const HookScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = themeForEpisode(episode);
  const hookStyle = hookStyleForEpisode(episode);

  const silhouetteSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const silhouetteScale = interpolate(silhouetteSpring, [0, 1], [0.7, 1]);
  const silhouetteOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground theme={theme}>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/hook.mp3`)} />
      ) : null}

      <IntroEffect style={hookStyle} accent={theme.accent} />

      <CinematicCamera move="push">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 30,
            padding: "0 50px",
            paddingBottom: 260,
          }}
        >
          <div
            style={{
              transform: `scale(${silhouetteScale})`,
              opacity: silhouetteOpacity,
            }}
          >
            <BaTuCharacter scale={0.95} isSpeaking={hasAudio} />
          </div>

          <KineticText
            text={episode.hook}
            startFrame={0}
            stagger={3}
            fontSize={52}
            fontFamily={fonts.sans}
            fontWeight={800}
            color={theme.ink}
            highlightColor={theme.accent}
          />
        </div>
      </CinematicCamera>
    </NutritionBackground>
  );
};
