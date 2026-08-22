import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { LongFormSceneBackground, SceneName } from "./LongFormSceneBackground";
import { HostSilhouette } from "../components/HostSilhouette";
import { GranddaughterSilhouette } from "../components/GranddaughterSilhouette";
import { fonts } from "../fonts";
import { LongFormBeat } from "../suckhoe/long-form/types";

export const DialogueScene: React.FC<{
  beat: LongFormBeat;
  locale: "vi" | "en";
  audioSrc?: string;
  hasAudio: boolean;
}> = ({ beat, locale, audioSrc, hasAudio }) => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const isNarrator = beat.speaker === "narrator";
  const hostSpeaking = hasAudio && beat.speaker === "grandma";
  const granddaughterSpeaking = hasAudio && beat.speaker === "granddaughter";
  const granddaughterChecking = beat.speaker === "granddaughter" && !!beat.factReveal;

  return (
    <LongFormSceneBackground scene={beat.scene as SceneName}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}

      {!isNarrator ? (
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            padding: "0 160px",
          }}
        >
          <div
            style={{
              opacity: beat.speaker === "grandma" ? 1 : 0.45,
              transform: `scale(${beat.speaker === "grandma" ? 1 : 0.88})`,
            }}
          >
            <HostSilhouette locale={locale} scale={1.5} isSpeaking={hostSpeaking} />
          </div>
          <div
            style={{
              opacity: beat.speaker === "granddaughter" ? 1 : 0.45,
              transform: `scale(${beat.speaker === "granddaughter" ? 1 : 0.88})`,
            }}
          >
            <GranddaughterSilhouette
              scale={1.4}
              isSpeaking={granddaughterSpeaking}
              checkingPhone={granddaughterChecking}
            />
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: isNarrator ? undefined : 30,
          top: isNarrator ? "45%" : undefined,
          display: "flex",
          justifyContent: "center",
          padding: "0 220px",
          opacity: captionOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: isNarrator ? 700 : 600,
            fontSize: isNarrator ? 46 : 32,
            lineHeight: 1.4,
            color: "#F2FAEC",
            textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            backgroundColor: isNarrator ? "transparent" : "rgba(14,21,13,0.55)",
            borderRadius: 16,
            padding: isNarrator ? 0 : "14px 28px",
          }}
        >
          {beat.text}
        </div>
      </div>
    </LongFormSceneBackground>
  );
};
