import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export type SceneName = "hook" | "kitchen" | "car" | "bedroom" | "dressing-room" | "wedding-hall";

const GRADIENTS: Record<SceneName, [string, string]> = {
  hook: ["#1a2a1f", "#0c140e"],
  kitchen: ["#3a2a1a", "#1a120a"],
  car: ["#1a2436", "#0a0e18"],
  bedroom: ["#241a36", "#0e0a1a"],
  "dressing-room": ["#3a1a2e", "#160a12"],
  "wedding-hall": ["#3a2a12", "#1a1206"],
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 999.71) * 43758.5453;
  return x - Math.floor(x);
};

// A large, soft, mostly-static silhouette that establishes each scene's
// setting — deliberately simple flat shapes (matching the rest of the
// channel's illustration style), not a literal detailed room. Specific to
// the SucKhoeLong (~20 min dialogue) format — not the shared
// components/SceneBackground.tsx used by the Churchill/other Shorts.
const SceneMotif: React.FC<{ scene: SceneName; frame: number }> = ({ scene, frame }) => {
  const opacity = 0.16;
  if (scene === "kitchen") {
    const steamY = (frame * 0.4) % 60;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <rect x="0" y="760" width="1920" height="320" fill="#E8C79A" opacity={opacity} />
        <ellipse cx="960" cy="740" rx="140" ry="30" fill="#E8C79A" opacity={opacity} />
        <path
          d={`M 900 ${740 - steamY} Q 890 ${690 - steamY} 900 ${640 - steamY}`}
          stroke="#fff"
          strokeWidth="10"
          fill="none"
          opacity={opacity * 1.5}
          strokeLinecap="round"
        />
        <path
          d={`M 1020 ${740 - steamY} Q 1030 ${690 - steamY} 1020 ${640 - steamY}`}
          stroke="#fff"
          strokeWidth="10"
          fill="none"
          opacity={opacity * 1.5}
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (scene === "car") {
    const lineOffset = (frame * 6) % 200;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <rect x="260" y="140" width="1400" height="600" rx="40" fill="none" stroke="#8fb8ff" strokeWidth="14" opacity={opacity} />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x={300 + i * 220 - lineOffset}
            y="900"
            width="120"
            height="14"
            fill="#8fb8ff"
            opacity={opacity}
          />
        ))}
      </svg>
    );
  }
  if (scene === "bedroom") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <circle cx="1600" cy="220" r="90" fill="#e8d9ff" opacity={opacity} />
        {Array.from({ length: 20 }).map((_, i) => {
          const x = seededRandom(i) * 1920;
          const y = seededRandom(i + 50) * 400;
          return <circle key={i} cx={x} cy={y} r={3} fill="#fff" opacity={opacity} />;
        })}
        <rect x="0" y="820" width="1920" height="260" fill="#5a4a7a" opacity={opacity} />
      </svg>
    );
  }
  if (scene === "dressing-room") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <ellipse cx="1500" cy="500" rx="180" ry="320" fill="none" stroke="#ffd0e0" strokeWidth="16" opacity={opacity} />
        <ellipse cx="1500" cy="500" rx="150" ry="290" fill="#ffd0e0" opacity={opacity * 0.4} />
        <path d="M 300 900 Q 340 600 420 500 Q 500 600 540 900 Z" fill="#ffd0e0" opacity={opacity} />
      </svg>
    );
  }
  if (scene === "wedding-hall") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M 660 900 Q 660 300 960 260 Q 1260 300 1260 900"
          fill="none"
          stroke="#ffe9b0"
          strokeWidth="22"
          opacity={opacity}
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const t = i / 11;
          const x = 660 + t * 600;
          const y = 900 - Math.sin(t * Math.PI) * 640;
          return <circle key={i} cx={x} cy={y} r={10} fill="#ffe9b0" opacity={opacity * 1.3} />;
        })}
      </svg>
    );
  }
  return null;
};

export const LongFormSceneBackground: React.FC<{ scene: SceneName; children?: React.ReactNode }> = ({
  scene,
  children,
}) => {
  const frame = useCurrentFrame();
  const [from, to] = GRADIENTS[scene];

  const particles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        x: seededRandom(i) * 100,
        size: 10 + seededRandom(i + 10) * 14,
        speed: 0.15 + seededRandom(i + 20) * 0.2,
        drift: seededRandom(i + 30) * 20,
        hue: 30 + seededRandom(i + 40) * 40,
      })),
    []
  );

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)` }}>
      <SceneMotif scene={scene} frame={frame} />

      {particles.map((p, i) => {
        const travel = ((frame * p.speed + i * 41) % 140) - 20;
        const y = 105 - travel;
        const x = p.x + Math.sin(frame * 0.02 + i) * (p.drift / 10);
        const opacity = interpolate(y, [-10, 10, 90, 105], [0, 0.4, 0.4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `hsl(${p.hue}, 60%, 60%)`,
              opacity,
              filter: "blur(1px)",
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {children}
    </AbsoluteFill>
  );
};
