import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// Top hairline progress bar — a small "produced" cue (PRD Q-07) that
// also silently tells returning viewers this is a finished package.
export const ProgressBar: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: "rgba(255,255,255,0.12)",
        zIndex: 40,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};
