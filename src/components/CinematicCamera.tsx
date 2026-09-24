import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type CameraMove = "push" | "pull" | "drift-left" | "drift-right";

// Per-scene camera rig: one slow move per scene, never a static frame.
// push/pull = dolly zoom feel (scale), drift = lateral trucking with a
// tiny zoom to sell parallax. The move is deterministic and gentle —
// health content reads calm, not flashy.
export const CinematicCamera: React.FC<{
  move?: CameraMove;
  children: React.ReactNode;
}> = ({ move = "push", children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const transform = (() => {
    switch (move) {
      case "push":
        return `scale(${1 + p * 0.06})`;
      case "pull":
        return `scale(${1.06 - p * 0.06})`;
      case "drift-left":
        return `scale(1.04) translateX(${-14 - p * 22}px)`;
      case "drift-right":
        return `scale(1.04) translateX(${14 + p * 22 - 22}px)`;
    }
  })();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
