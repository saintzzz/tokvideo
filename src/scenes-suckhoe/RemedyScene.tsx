import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { HostSilhouette } from "../components/HostSilhouette";
import { KineticText } from "../components/KineticText";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";
import { themeForEpisode } from "../suckhoe/themes";

export const RemedyScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = themeForEpisode(episode);
  const image = episode.images?.[0];

  const remedyOpacity = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground theme={theme}>
      {/* transition-in whoosh (this scene follows a crossfade) */}
      <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.35} />
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/remedy.mp3`)} />
      ) : null}

      {image ? (
        <AbsoluteFill style={{ opacity: 0.4 }}>
          <KenBurnsImage src={image} durationInFrames={durationInFrames} zoomFrom={1.05} zoomTo={1.2} panX={30} />
        </AbsoluteFill>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          padding: "0 55px",
        }}
      >
        <HostSilhouette locale={episode.locale} scale={1.1} isSpeaking={hasAudio} />

        <KineticText
          text={episode.ingredientName}
          startFrame={0}
          stagger={4}
          fontSize={58}
          fontFamily={fonts.serif}
          fontWeight={700}
          color={theme.ink}
          highlightColor={theme.accent}
          highlightWords={episode.ingredientName.split(" ")}
        />

        <div
          style={{
            opacity: remedyOpacity,
            fontFamily: fonts.sans,
            fontSize: 32,
            lineHeight: 1.5,
            color: theme.ink,
            textAlign: "center",
            maxWidth: 850,
            textShadow: "0 2px 10px rgba(0,0,0,0.7)",
          }}
        >
          {episode.remedy}
        </div>
      </div>

      <KaraokeCaption
        videoId={`suckhoe-${episode.slug}`}
        scene="remedy"
        accent={theme.accent}
        enabled={hasAudio}
      />
    </NutritionBackground>
  );
};
