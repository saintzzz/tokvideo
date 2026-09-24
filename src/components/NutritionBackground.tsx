import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { SceneTheme } from "../suckhoe/themes";
import { GodRays } from "./GodRays";

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 999.71) * 43758.5453;
  return x - Math.floor(x);
};

type Particle = {
  x: number;
  size: number;
  speed: number;
  drift: number;
  rotationSpeed: number;
  shape: "leaf" | "grain" | "drop";
  hue: number;
};

const PARTICLE_COUNT = 24;

// Parallax depth layers (docs/CINEMATIC-UPGRADE.md): one shared travel
// driver, three planes at different rates + a blurred foreground plane
// faking depth of field. Layer index 0=back, 1=mid, 2=front.
const LAYERS = [
  { sizeMul: 0.6, speedMul: 0.45, opacityMul: 0.5, blur: 1 },
  { sizeMul: 1.0, speedMul: 1.0, opacityMul: 1.0, blur: 0 },
  { sizeMul: 1.7, speedMul: 1.9, opacityMul: 0.85, blur: 3 },
];

const Shape: React.FC<{ shape: Particle["shape"]; size: number; hue: number }> = ({
  shape,
  size,
  hue,
}) => {
  const color = `hsl(${hue}, 55%, 55%)`;
  if (shape === "leaf") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 2 C 4 6, 4 18, 12 22 C 20 18, 20 6, 12 2 Z"
          fill={color}
          opacity={0.5}
        />
      </svg>
    );
  }
  if (shape === "grain") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <ellipse cx="12" cy="12" rx="6" ry="10" fill={color} opacity={0.5} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 2 C 16 9, 20 13, 20 17 A 8 8 0 0 1 4 17 C 4 13, 8 9, 12 2 Z"
        fill={color}
        opacity={0.5}
      />
    </svg>
  );
};

export const NutritionBackground: React.FC<{
  children: React.ReactNode;
  theme?: SceneTheme;
}> = ({ children, theme }) => {
  const frame = useCurrentFrame();
  const t = theme ?? {
    bg: ["#1c2b1a", "#0e150d", "#060906"] as [string, string, string],
    accent: "#7CB342",
    ink: "#F2FAEC",
    bokeh: "rgba(120,200,120,0.28)",
    particleHue: 90,
  };

  const particles = useMemo<Particle[]>(() => {
    const shapes: Particle["shape"][] = ["leaf", "grain", "drop"];
    return new Array(PARTICLE_COUNT).fill(0).map((_, i) => ({
      x: seededRandom(i * 1.7) * 100,
      size: 20 + seededRandom(i * 2.9 + 5) * 30,
      speed: 0.4 + seededRandom(i * 3.3 + 11) * 0.5,
      drift: seededRandom(i * 4.1 + 17) * 40 - 20,
      rotationSpeed: seededRandom(i * 5.3 + 23) * 2 - 1,
      shape: shapes[i % shapes.length],
      hue: t.particleHue + seededRandom(i * 6.7 + 29) * 40,
    }));
  }, [t.particleHue]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${t.bg[0]} 0%, ${t.bg[1]} 55%, ${t.bg[2]} 100%)`,
      }}
    >
      {/* bokeh */}
      {new Array(8).fill(0).map((_, i) => {
        const bx = seededRandom(i * 9.1) * 100;
        const by = seededRandom(i * 10.3 + 3) * 100;
        const bsize = 80 + seededRandom(i * 11.7 + 6) * 140;
        const pulse = Math.sin(frame * 0.02 + i) * 0.15;
        return (
          <div
            key={`bokeh-${i}`}
            style={{
              position: "absolute",
              left: `${bx}%`,
              top: `${by}%`,
              width: bsize,
              height: bsize,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${t.bokeh} 0%, rgba(0,0,0,0) 70%)`,
              filter: "blur(4px)",
              opacity: 0.5 + pulse,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      <GodRays accent={t.accent} />

      {/* floating particles in 3 parallax depth layers */}
      {particles.map((p, i) => {
        const layer = LAYERS[i % LAYERS.length];
        const travel = ((frame * p.speed * layer.speedMul + i * 37) % 140) - 20;
        const y = 105 - travel;
        const x = p.x + Math.sin(frame * 0.02 + i) * (p.drift / 10) * layer.speedMul;
        const rotate = frame * p.rotationSpeed;
        const opacity =
          interpolate(
            y,
            [-10, 10, 90, 105],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ) * layer.opacityMul;

        return (
          <div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              opacity,
              transform: `rotate(${rotate}deg)`,
              filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
            }}
          >
            <Shape shape={p.shape} size={p.size * layer.sizeMul} hue={p.hue} />
          </div>
        );
      })}

      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {children}
    </AbsoluteFill>
  );
};
