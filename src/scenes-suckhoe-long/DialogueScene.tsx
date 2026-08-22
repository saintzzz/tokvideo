import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LongFormSceneBackground, SceneName } from "./LongFormSceneBackground";
import { HostSilhouette } from "../components/HostSilhouette";
import { GranddaughterSilhouette } from "../components/GranddaughterSilhouette";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";
import { LongFormBeat } from "../suckhoe/long-form/types";

export const DialogueScene: React.FC<{
  beat: LongFormBeat;
  locale: "vi" | "en";
  audioSrc?: string;
  hasAudio: boolean;
  isSceneStart: boolean;
}> = ({ beat, locale, audioSrc, hasAudio, isSceneStart }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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

  // Pattern interrupt: a quick flash + zoom-punch right as a new
  // scene/act begins, instead of just the usual slow push-in — retention
  // research recommends a visual "reset" roughly every 30-90s, and acts
  // here run in that range naturally.
  const sceneStartPunch = isSceneStart
    ? spring({ frame, fps, config: { damping: 12, mass: 0.4 }, durationInFrames: 14 })
    : 0;
  const punchScale = 1 + interpolate(sceneStartPunch, [0, 1], [0.06, 0]);
  const flashOpacity = isSceneStart
    ? interpolate(frame, [0, 3, 14], [0.55, 0.55, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <LongFormSceneBackground scene={beat.scene as SceneName}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}

      <div style={{ position: "absolute", inset: 0, transform: `scale(${cameraScale * punchScale})` }}>

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
          top: "16%",
          display: "flex",
          justifyContent: "center",
          padding: "0 180px",
        }}
      >
        <div
          style={{
            backgroundColor: isNarrator ? "transparent" : "rgba(14,21,13,0.6)",
            borderRadius: 20,
            padding: isNarrator ? 0 : "18px 36px",
            boxShadow: isNarrator ? "none" : "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <KineticText
            key={beat.caption ?? beat.text}
            text={beat.caption ?? beat.text}
            fontSize={isNarrator ? 58 : 46}
            fontFamily={fonts.sans}
            fontWeight={800}
            color="#F2FAEC"
            highlightColor="#7CB342"
            highlightStyle="chip"
            stagger={2}
          />
        </div>
      </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#fff",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </LongFormSceneBackground>
  );
};
