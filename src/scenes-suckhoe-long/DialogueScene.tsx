import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LongFormSceneBackground, SceneName } from "./LongFormSceneBackground";
import { HostSilhouette } from "../components/HostSilhouette";
import { GranddaughterSilhouette } from "../components/GranddaughterSilhouette";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";
import { LongFormBeat } from "../suckhoe/long-form/types";
import { makeRig } from "../theatre-rig";

// A real animator's "squash, anticipate, overshoot, settle" curve for the
// reveal-moment reaction, authored as plain keyframe data via
// src/theatre-rig.ts (Theatre.js under the hood) instead of a generic
// spring() — a spring always eases the same way regardless of shape; this
// gives an actual directed gesture (brief dip before the pop reads as
// "gathering to react," not just a bounce). One shared rig instance for
// every DialogueScene, keyed by local seconds-from-reveal-start.
const REVEAL_RIG = makeRig("suckhoe-long-dialogue", "reveal", {
  reveal: {
    scale: [
      { time: 0, value: 1 },
      { time: 0.12, value: 0.95 },
      { time: 0.32, value: 1.1 },
      { time: 0.55, value: 1 },
    ],
    glow: [
      { time: 0, value: 0 },
      { time: 0.15, value: 0.15 },
      { time: 0.35, value: 1 },
      { time: 0.75, value: 0 },
    ],
  },
});

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

  // A brief excited reaction on whoever is about to reveal the research
  // behind a remedy — squash, overshoot, settle, from REVEAL_RIG above,
  // instead of a generic spring bounce.
  const reveal = REVEAL_RIG.at(frame, fps).reveal;
  const excitementPop = beat.factReveal ? reveal.glow : 0;
  const excitementScale = beat.factReveal ? reveal.scale : 1;

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
