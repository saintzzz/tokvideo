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
import { HealerSilhouette } from "../components/HealerSilhouette";
import { SubscribePointer } from "../components/SubscribePointer";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";

export const CTAScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const healerSpring = spring({ frame, fps, config: { damping: 13, mass: 0.6 } });
  const healerScale = interpolate(healerSpring, [0, 1], [0.75, 1]);

  const ctaOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bounce = Math.sin(frame * 0.25) * 10;

  const discOpacity = interpolate(frame, [10, 25], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/cta.mp3`)} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        <div style={{ transform: `scale(${healerScale})` }}>
          <HealerSilhouette scale={1.4} isSpeaking={hasAudio} />
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${bounce}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 50,
              color: "#0e150d",
              backgroundColor: "#7CB342",
              borderRadius: 18,
              padding: "10px 30px",
              boxShadow: "0 10px 30px rgba(124,179,66,0.45)",
            }}
          >
            THEO DÕI KÊNH
          </div>
        </div>
      </div>

      <SubscribePointer startFrame={15} />

      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: discOpacity,
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 18,
            color: "#9db08f",
          }}
        >
          Kinh nghiệm dân gian, không thay thế ý kiến bác sĩ
        </div>
        {episode.caution ? (
          <div
            style={{
              marginTop: 4,
              fontFamily: fonts.sans,
              fontSize: 18,
              color: "#9db08f",
            }}
          >
            {episode.caution}
          </div>
        ) : null}
      </div>
    </NutritionBackground>
  );
};
