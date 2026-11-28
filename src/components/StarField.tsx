import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const STAR_COUNT = 60;

// Deterministic pseudo-random so every frame/render is reproducible.
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 999.71) * 43758.5453;
  return x - Math.floor(x);
};

type Star = {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
};

export const StarField: React.FC = () => {
  const frame = useCurrentFrame();

  const stars = useMemo<Star[]>(() => {
    return new Array(STAR_COUNT).fill(0).map((_, i) => ({
      x: seededRandom(i * 1.1) * 100,
      y: seededRandom(i * 2.3 + 7) * 100,
      size: 1 + seededRandom(i * 3.7 + 13) * 2.5,
      phase: seededRandom(i * 5.9 + 21) * Math.PI * 2,
      speed: 0.05 + seededRandom(i * 8.3 + 29) * 0.08,
    }));
  }, []);

  return (
    <AbsoluteFill>
      {stars.map((star, i) => {
        const twinkle = Math.sin(frame * star.speed + star.phase);
        const opacity = interpolate(twinkle, [-1, 1], [0.15, 0.9]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: "50%",
              backgroundColor: "#F5E6C8",
              opacity,
              boxShadow: "0 0 6px rgba(245, 230, 200, 0.8)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
