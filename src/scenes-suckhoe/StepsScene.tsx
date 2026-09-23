import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";
import { themeForEpisode, type SceneTheme } from "../suckhoe/themes";

const STEP_STAGGER = 20;

const StepRow: React.FC<{
  index: number;
  text: string;
  startFrame: number;
  theme: SceneTheme;
}> = ({ index, text, startFrame, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const s = spring({ frame: local, fps, config: { damping: 16, mass: 0.5 } });
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(s, [0, 1], [-40, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        transform: `translateX(${x}px)`,
        maxWidth: 880,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: theme.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 28,
          color: "#0e150d",
        }}
      >
        {index + 1}
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 32,
          lineHeight: 1.4,
          color: theme.ink,
          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const StepsScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const { durationInFrames } = useVideoConfig();
  const theme = themeForEpisode(episode);
  const images = episode.images ?? [];
  const perImage = images.length ? Math.floor(durationInFrames / images.length) : 0;

  return (
    <NutritionBackground theme={theme}>
      <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.35} />
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/steps.mp3`)} />
      ) : null}

      {/* ingredient imagery cycling behind the step list (Q-05) */}
      {images.map((img, i) => (
        <Sequence key={img} from={i * perImage} durationInFrames={perImage}>
          <AbsoluteFill style={{ opacity: 0.32 }}>
            <KenBurnsImage src={img} durationInFrames={perImage} zoomFrom={1.0} zoomTo={1.18} panX={i % 2 ? -30 : 30} />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* step-entry pops */}
      {episode.steps.map((_, i) => (
        <Sequence key={`sfx-${i}`} from={i * STEP_STAGGER} durationInFrames={15}>
          <Audio src={staticFile("sfx/pop.mp3")} volume={0.3} />
        </Sequence>
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 40,
          padding: "0 90px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 40,
            color: theme.accent,
          }}
        >
          {episode.locale === "en" ? "How to" : "Cách làm"}
        </div>

        {episode.steps.map((step, i) => (
          <StepRow key={i} index={i} text={step} startFrame={i * STEP_STAGGER} theme={theme} />
        ))}
      </div>

      <KaraokeCaption
        videoId={`suckhoe-${episode.slug}`}
        scene="steps"
        accent={theme.accent}
        enabled={hasAudio}
      />
    </NutritionBackground>
  );
};
