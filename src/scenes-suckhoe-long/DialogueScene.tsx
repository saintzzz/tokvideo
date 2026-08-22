import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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
  const { fps, durationInFrames } = useVideoConfig();
  const captionOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const isNarrator = beat.speaker === "narrator";
  const hostSpeaking = hasAudio && beat.speaker === "grandma";
  const granddaughterSpeaking = hasAudio && beat.speaker === "granddaughter";
  const granddaughterChecking = beat.speaker === "granddaughter" && !!beat.factReveal;

  // Cheap "camera" — a slow, continuous push-in across the beat instead of
  // a static locked-off shot. Each beat is its own Sequence, so `frame`
  // and `durationInFrames` are already scoped to just this beat.
  const cameraScale = interpolate(frame, [0, durationInFrames], [1, 1.035], {
    extrapolateRight: "clamp",
  });

  // A brief excited "pop" on whoever is about to reveal the research
  // behind a remedy — cheaper than full gesture rigging, but reads as a
  // reaction instead of a static pose.
  const excitementPop = beat.factReveal
    ? spring({ frame, fps, config: { damping: 8, mass: 0.5 }, durationInFrames: 18 })
    : 0;
  const excitementScale = 1 + excitementPop * 0.08;

  return (
    <LongFormSceneBackground scene={beat.scene as SceneName}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}

      <div style={{ position: "absolute", inset: 0, transform: `scale(${cameraScale})` }}>

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
              transform: `scale(${(beat.speaker === "grandma" ? 1 : 0.88) * (beat.speaker === "grandma" ? excitementScale : 1)})`,
            }}
          >
            {beat.speaker === "grandma" && beat.factReveal ? (
              <div
                style={{
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,224,130,0.5) 0%, rgba(255,224,130,0) 70%)",
                  opacity: excitementPop,
                  transform: "translate(-40px, -40px)",
                }}
              />
            ) : null}
            <HostSilhouette locale={locale} scale={1.5} isSpeaking={hostSpeaking} />
          </div>
          <div
            style={{
              opacity: beat.speaker === "granddaughter" ? 1 : 0.45,
              transform: `scale(${(beat.speaker === "granddaughter" ? 1 : 0.88) * (beat.speaker === "granddaughter" ? excitementScale : 1)})`,
            }}
          >
            {beat.speaker === "granddaughter" && beat.factReveal ? (
              <div
                style={{
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,224,130,0.5) 0%, rgba(255,224,130,0) 70%)",
                  opacity: excitementPop,
                  transform: "translate(-40px, -40px)",
                }}
              />
            ) : null}
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
          {beat.caption ?? beat.text}
        </div>
      </div>
      </div>
    </LongFormSceneBackground>
  );
};
