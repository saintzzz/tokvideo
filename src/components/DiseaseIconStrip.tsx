import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../fonts";

const ITEMS = [
  { icon: "❤️", label: "Tim mạch" },
  { icon: "🩸", label: "Tiểu đường" },
  { icon: "🦴", label: "Xương khớp" },
  { icon: "😴", label: "Mất ngủ" },
  { icon: "✨", label: "Da liễu" },
];

export const DiseaseIconStrip: React.FC<{ startFrame?: number }> = ({
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 20,
        maxWidth: 950,
      }}
    >
      {ITEMS.map((item, i) => {
        const local = frame - startFrame - i * 6;
        const s = spring({ frame: local, fps, config: { damping: 14, mass: 0.5 } });
        const opacity = interpolate(local, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(s, [0, 1], [0.6, 1]);

        return (
          <div
            key={item.label}
            style={{
              opacity,
              transform: `scale(${scale})`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "rgba(124, 179, 66, 0.22)",
              border: "2px solid rgba(124, 179, 66, 0.7)",
              borderRadius: 999,
              padding: "16px 28px",
            }}
          >
            <span style={{ fontSize: 36 }}>{item.icon}</span>
            <span
              style={{
                fontFamily: fonts.sans,
                fontWeight: 700,
                fontSize: 28,
                color: "#F2FAEC",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
