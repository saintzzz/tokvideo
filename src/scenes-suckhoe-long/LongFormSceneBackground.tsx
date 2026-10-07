import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type SceneName =
  | "hook"
  | "kitchen"
  | "car"
  | "bedroom"
  | "dressing-room"
  | "wedding-hall"
  | "sect-mountain"
  | "cultivation-cave"
  | "battlefield"
  | "arena"
  | "forest-night"
  | "throne-hall"
  | "cliff-edge"
  | "village-dusk"
  | "village-night"
  | "haunted-house"
  | "ancestral-altar"
  | "old-well"
  | "graveyard"
  | "river-mist"
  | "storm-night"
  | "estate-gate"
  | "ancestral-house"
  | "village-square"
  | "well-shrine"
  | "dawn-village";

const GRADIENTS: Record<SceneName, [string, string]> = {
  hook: ["#1a2a1f", "#0c140e"],
  kitchen: ["#3a2a1a", "#1a120a"],
  car: ["#1a2436", "#0a0e18"],
  bedroom: ["#241a36", "#0e0a1a"],
  "dressing-room": ["#3a1a2e", "#160a12"],
  "wedding-hall": ["#3a2a12", "#1a1206"],
  "sect-mountain": ["#2a3a52", "#0e1622"],
  "cultivation-cave": ["#1e1430", "#0a0614"],
  battlefield: ["#3d1d1a", "#160a08"],
  arena: ["#402a10", "#160e06"],
  "forest-night": ["#12281e", "#060f0b"],
  "throne-hall": ["#3a1030", "#12060e"],
  "cliff-edge": ["#22303e", "#0a1016"],
  "village-dusk": ["#3a2414", "#140c06"],
  // Horror scenes — cold, desaturated, near-monochrome. These gradients
  // are only the no-image fallback; generated sceneImages normally win.
  "village-night": ["#141a26", "#05070c"],
  "haunted-house": ["#1a1410", "#060403"],
  "ancestral-altar": ["#241006", "#0a0402"],
  "old-well": ["#0e1a1a", "#030808"],
  graveyard: ["#101a14", "#040806"],
  "river-mist": ["#16202a", "#060a0e"],
  "storm-night": ["#101020", "#040408"],
  "estate-gate": ["#1c1610", "#060402"],
  "ancestral-house": ["#201410", "#070403"],
  "village-square": ["#181a20", "#060708"],
  "well-shrine": ["#121a16", "#040806"],
  "dawn-village": ["#2a2620", "#0e0c08"],
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
  // Xianxia story sets — same flat-silhouette language as the original
  // motifs; each is a quick readable "where are we" beat, not a painted
  // matte.
  if (scene === "sect-mountain") {
    const cloud = (frame * 0.15) % 400;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* layered peaks + a floating sword-sect silhouette */}
        <path d="M 0 1080 L 320 620 L 560 900 L 760 500 L 1080 1080 Z" fill="#8fb0d8" opacity={opacity} />
        <path d="M 700 1080 L 1020 420 L 1240 720 L 1440 380 L 1700 1080 Z" fill="#a8c4e4" opacity={opacity * 0.8} />
        <path d="M 1440 380 L 1440 260 L 1420 260 L 1440 200 L 1460 260 L 1440 260 Z" fill="#cfe0f2" opacity={opacity * 1.4} />
        <rect x={300 + cloud} y="180" width="340" height="26" rx="13" fill="#fff" opacity={opacity * 0.7} />
        <rect x={1100 - cloud * 0.6} y="300" width="260" height="20" rx="10" fill="#fff" opacity={opacity * 0.5} />
      </svg>
    );
  }
  if (scene === "cultivation-cave") {
    const glowPulse = 0.1 + 0.06 * Math.sin(frame * 0.06);
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* cave arch + glowing formation circle on the floor */}
        <path d="M 300 1080 Q 300 200 960 180 Q 1620 200 1620 1080" fill="none" stroke="#9a86c8" strokeWidth="26" opacity={opacity} />
        <ellipse cx="960" cy="900" rx="300" ry="60" fill="none" stroke="#c9a8ff" strokeWidth="10" opacity={glowPulse * 2} />
        <ellipse cx="960" cy="900" rx="200" ry="40" fill="none" stroke="#c9a8ff" strokeWidth="6" opacity={glowPulse * 2} />
        <circle cx="960" cy="900" r="14" fill="#e0ccff" opacity={glowPulse * 3} />
      </svg>
    );
  }
  if (scene === "battlefield") {
    const ember = (frame * 1.2) % 300;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* torn banners + spears + rising embers */}
        <path d="M 400 950 L 400 420 L 560 470 L 400 520 Z" fill="#e07a5a" opacity={opacity * 1.6} />
        <path d="M 1500 950 L 1500 380 L 1360 440 L 1500 480 Z" fill="#e07a5a" opacity={opacity} />
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={i} d={`M ${520 + i * 140} 980 L ${500 + i * 140} ${560 - (i % 3) * 60}`} stroke="#c8b0a0" strokeWidth="10" opacity={opacity} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const x = seededRandom(i + 90) * 1920;
          const y = 900 - ((ember + i * 80) % 700);
          return <circle key={i} cx={x} cy={y} r="5" fill="#ffb066" opacity={opacity * 2} />;
        })}
      </svg>
    );
  }
  if (scene === "arena") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* ring platform + banner poles + crowd tier */}
        <ellipse cx="960" cy="880" rx="640" ry="110" fill="#e8c88a" opacity={opacity} />
        <ellipse cx="960" cy="880" rx="480" ry="80" fill="none" stroke="#b8905a" strokeWidth="10" opacity={opacity} />
        <rect x="280" y="300" width="18" height="480" fill="#c8a068" opacity={opacity} />
        <rect x="1620" y="300" width="18" height="480" fill="#c8a068" opacity={opacity} />
        <path d="M 298 310 L 480 340 L 298 370 Z" fill="#d8b878" opacity={opacity * 1.4} />
        <path d="M 1620 310 L 1440 340 L 1620 370 Z" fill="#d8b878" opacity={opacity * 1.4} />
        <rect x="0" y="120" width="1920" height="90" fill="#a88858" opacity={opacity * 0.7} />
      </svg>
    );
  }
  if (scene === "forest-night") {
    const fireflyDrift = frame * 0.5;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* tree trunks + moon + drifting fireflies */}
        <circle cx="1560" cy="200" r="80" fill="#dce8f8" opacity={opacity * 1.6} />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect key={i} x={80 + i * 220} y="120" width={34 + (i % 3) * 14} height="960" fill="#4a7a62" opacity={opacity * 0.9} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = (seededRandom(i + 140) * 1920 + Math.sin((frame + i * 30) * 0.04) * 40 + fireflyDrift) % 1920;
          const y = 300 + seededRandom(i + 190) * 500 + Math.cos((frame + i * 50) * 0.03) * 30;
          return <circle key={i} cx={x} cy={y} r="6" fill="#d8ffb0" opacity={opacity * 2.2} />;
        })}
      </svg>
    );
  }
  if (scene === "throne-hall") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* columns + elevated throne silhouette + long carpet */}
        <rect x="0" y="700" width="1920" height="380" fill="#4a1840" opacity={opacity * 0.8} />
        <rect x="880" y="940" width="160" height="140" fill="#c04a8a" opacity={opacity * 0.6} />
        {[280, 620, 1300, 1640].map((x) => (
          <rect key={x} x={x} y="160" width="70" height="560" fill="#8a4a78" opacity={opacity} />
        ))}
        <path d="M 900 700 L 900 420 L 960 380 L 1020 420 L 1020 700 Z" fill="#b05a98" opacity={opacity * 1.2} />
        <path d="M 930 420 L 960 330 L 990 420 Z" fill="#d87ab8" opacity={opacity * 1.3} />
      </svg>
    );
  }
  if (scene === "cliff-edge") {
    const wind = (frame * 0.8) % 300;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* cliff face + abyss haze + wind streaks */}
        <path d="M 0 1080 L 0 300 L 260 160 L 420 400 L 500 1080 Z" fill="#7a90a8" opacity={opacity} />
        <path d="M 1400 1080 L 1520 620 L 1740 780 L 1920 560 L 1920 1080 Z" fill="#8aa0b8" opacity={opacity * 0.7} />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={(200 + i * 290 - wind) % 1920} y={180 + i * 130} width="180" height="8" rx="4" fill="#cfe0ee" opacity={opacity * 1.5} />
        ))}
      </svg>
    );
  }
  if (scene === "village-dusk") {
    const lanternFlicker = 0.12 + 0.05 * Math.sin(frame * 0.2);
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* rooftop line + hanging lanterns */}
        <path d="M 0 1080 L 0 700 L 200 620 L 420 700 L 420 1080 Z" fill="#8a5c34" opacity={opacity} />
        <path d="M 500 1080 L 500 640 L 760 560 L 1020 640 L 1020 1080 Z" fill="#9a6a3c" opacity={opacity} />
        <path d="M 1200 1080 L 1200 680 L 1450 600 L 1700 680 L 1700 1080 Z" fill="#8a5c34" opacity={opacity} />
        {[540, 860, 1300, 1560].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="540" x2={x} y2="600" stroke="#5a3a1e" strokeWidth="6" opacity={opacity * 2} />
            <ellipse cx={x} cy="640" rx="34" ry="44" fill="#ff9a5a" opacity={lanternFlicker * 3} />
          </g>
        ))}
      </svg>
    );
  }
  return null;
};

export const LongFormSceneBackground: React.FC<{
  scene: SceneName;
  children?: React.ReactNode;
  /**
   * Path under public/ to an AI-generated still for this scene. When
   * set, the procedural gradient/motif/particles are replaced by a slow
   * Ken Burns drift over the image - `variant` (usually the beat index)
   * alternates the drift direction so consecutive beats in the same
   * scene don't sit on an identical frozen frame.
   */
  image?: string;
  variant?: number;
}> = ({ scene, children, image, variant = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
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

  // Slow Ken Burns over the generated still: ~4% drift across the beat,
  // alternating direction and pan focus per variant so the same scene
  // image never sits twice as an identical frozen frame. Slower than the
  // Shorts version on purpose - long-form horror reads through
  // atmosphere, not cuts.
  if (image) {
    const dir = variant % 2 === 0 ? 1 : -1;
    const scale = interpolate(frame, [0, durationInFrames], [1.02, 1.08], {
      extrapolateRight: "clamp",
    });
    const panX = interpolate(frame, [0, durationInFrames], [dir * 1.2, -dir * 1.2], {
      extrapolateRight: "clamp",
    });
    const panY = interpolate(frame, [0, durationInFrames], [-dir * 0.8, dir * 0.8], {
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translate(${panX}%, ${panY}%)`,
          }}
        />
        {/* heavier vignette + slight desaturation mood grade for horror */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,12,20,0.18)",
          }}
        />
        {children}
      </AbsoluteFill>
    );
  }

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
