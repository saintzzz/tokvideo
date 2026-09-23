import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";

// Subtle film grain + vignette lifted off the background (PRD Q-07) —
// the grain is a tile of random-opacity dots regenerated per few frames
// so it shimmers like grain instead of sliding like a texture.
export const PolishOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const grainSeed = Math.floor(frame / 3);

  const dots = useMemo(() => {
    const rand = (i: number) => {
      const x = Math.sin((i + grainSeed * 97) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    return new Array(140).fill(0).map((_, i) => ({
      x: rand(i * 2) * 100,
      y: rand(i * 2 + 1) * 100,
      o: 0.015 + rand(i * 3) * 0.03,
      s: 1 + Math.floor(rand(i * 5) * 3),
    }));
  }, [grainSeed]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30 }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            borderRadius: "50%",
            backgroundColor: "#fff",
            opacity: d.o,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)",
        }}
      />
    </div>
  );
};
