import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";

// YouTube Shorts shows the channel avatar + name + Subscribe button near
// the bottom-left of the screen (roughly where TikTok puts the caption).
// This points there instead of a generic centered down-arrow. Position is
// approximate — check against the current Shorts UI if it drifts.
const TARGET_TOP_PERCENT = 78;

export const SubscribePointer: React.FC<{
  startFrame?: number;
  label?: string;
}> = ({ startFrame = 0, label = "Theo dõi kênh nhé!" }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  const opacity = interpolate(local, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bob = Math.sin(frame * 0.22) * 12;
  const pulse = 1 + Math.sin(frame * 0.3) * 0.07;
  const glow = interpolate(Math.sin(frame * 0.3), [-1, 1], [14, 34]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: `${TARGET_TOP_PERCENT}%`,
        width: 420,
        height: 220,
        opacity,
        pointerEvents: "none",
      }}
    >
      <svg
        width="420"
        height="220"
        viewBox="0 0 420 220"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d="M 380 20 C 240 15, 110 55, 65 120"
          stroke="#E02020"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="18 14"
        />
        <path
          d="M 65 120 L 44 86 M 65 120 L 102 102"
          stroke="#E02020"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: -10 + bob,
          transform: `scale(${pulse})`,
          backgroundColor: "#E02020",
          borderRadius: 20,
          padding: "16px 28px",
          boxShadow: `0 0 ${glow}px rgba(224, 32, 32, 0.85), 0 10px 30px rgba(0,0,0,0.4)`,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 900,
            fontSize: 36,
            letterSpacing: 0.5,
            color: "#FFFFFF",
            textShadow: "0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
