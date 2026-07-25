import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneBackground } from "../components/SceneBackground";
import { ChurchillSilhouette } from "../components/ChurchillSilhouette";
import { fonts } from "../fonts";

const Bubble: React.FC<{
  frame: number;
  fps: number;
  startFrame: number;
  align: "flex-start" | "flex-end";
  speaker: string;
  text: string;
  accent: string;
}> = ({ frame, fps, startFrame, align, speaker, text, accent }) => {
  const local = frame - startFrame;
  const s = spring({ frame: local, fps, config: { damping: 16, mass: 0.6 } });
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(
    s,
    [0, 1],
    [align === "flex-start" ? -40 : 40, 0]
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: align,
        width: "100%",
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 620,
          backgroundColor: "rgba(20, 28, 50, 0.75)",
          border: `2px solid ${accent}`,
          borderRadius: 20,
          padding: "22px 28px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 22,
            color: accent,
            marginBottom: 8,
          }}
        >
          {speaker}
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 30,
            color: "#F5E6C8",
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export const StoryScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const silhouetteStart = 110;
  const silhouetteSpring = spring({
    frame: frame - silhouetteStart,
    fps,
    config: { damping: 14, mass: 0.6 },
  });
  const silhouetteScale = interpolate(silhouetteSpring, [0, 1], [0.6, 1]);
  const silhouetteOpacity = interpolate(
    frame,
    [silhouetteStart, silhouetteStart + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <SceneBackground>
      {hasAudio ? (
        <Audio src={staticFile("audio/churchill/story.mp3")} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 40,
          padding: "0 60px",
        }}
      >
        <Bubble
          frame={frame}
          fps={fps}
          startFrame={10}
          align="flex-start"
          speaker="Nghị sĩ Lady Astor"
          accent="#8FA8D6"
          text="“Nếu ông là chồng tôi, tôi sẽ bỏ thuốc độc vào tách trà của ông.”"
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            transform: `scale(${silhouetteScale})`,
            opacity: silhouetteOpacity,
          }}
        >
          <ChurchillSilhouette scale={0.9} />
        </div>

        <Bubble
          frame={frame}
          fps={fps}
          startFrame={silhouetteStart}
          align="flex-end"
          speaker="Thủ tướng Churchill"
          accent="#E3B23C"
          text="“Nếu bà là vợ tôi, tôi sẽ uống nó.”"
        />
      </div>
    </SceneBackground>
  );
};
