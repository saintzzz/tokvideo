import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// English Arena brand backdrop — matches the app's navy/gold surface
// (#0E1F42 -> #162C55, gold #F5B301) so the ad feels like the product,
// not a generic template.
export const EA_NAVY = "#0E1F42";
export const EA_NAVY_DEEP = "#0A1730";
export const EA_GOLD = "#F5B301";
export const EA_INK = "#F4F6FB";

export const EaBackdrop: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${EA_NAVY} 0%, ${EA_NAVY_DEEP} 100%)`,
      }}
    >
      {/* Soft drifting gold motes — subtle "premium" motion, like the
          starfield dots in the app's shell. */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 8 + i * 21;
        const drift = Math.sin((frame + i * 37) / 45) * 30;
        const y = 12 + i * 17 + drift;
        const opacity = interpolate(
          Math.sin((frame + i * 23) / 60),
          [-1, 1],
          [0.08, 0.3]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: EA_GOLD,
              opacity,
            }}
          />
        );
      })}
      {/* Bottom vignette keeps captions readable over busy screenshots */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 460,
          background: "linear-gradient(180deg, transparent, rgba(5,10,25,0.85))",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
