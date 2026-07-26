import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts } from "../fonts";

// Canvas is always 1080x1920 in this project. TikTok's own affiliate
// product-link tag renders roughly 1/3.5 of the screen height up from the
// bottom, on the left — NOT glued to the bottom-left corner (that's where
// the caption/username sit). This points at that real anchor spot instead.
const CANVAS_HEIGHT = 1920;
const TARGET_FROM_BOTTOM = CANVAS_HEIGHT / 3.5; // ~549px
const TARGET_TOP_PERCENT = ((CANVAS_HEIGHT - TARGET_FROM_BOTTOM) / CANVAS_HEIGHT) * 100; // ~71.4%

export const BuyNowPointer: React.FC<{ startFrame?: number; label?: string }> = ({
  startFrame = 0,
  label = "Bấm vào giỏ hàng",
}) => {
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
        height: 260,
        opacity,
        pointerEvents: "none",
      }}
    >
      <svg
        width="420"
        height="260"
        viewBox="0 0 420 260"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d="M 380 30 C 240 20, 110 70, 65 150"
          stroke="#FF2D78"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="18 14"
        />
        <path
          d="M 65 150 L 44 114 M 65 150 L 102 132"
          stroke="#FF2D78"
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
          background: "linear-gradient(135deg, #FF2D78 0%, #FF6B3D 100%)",
          borderRadius: 20,
          padding: "16px 28px",
          boxShadow: `0 0 ${glow}px rgba(255, 45, 120, 0.85), 0 10px 30px rgba(0,0,0,0.4)`,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 900,
            fontSize: 38,
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
