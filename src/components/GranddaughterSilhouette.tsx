import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useMouthOpenAmount } from "./useTalkingMouth";

// The recurring "granddaughter" character for long-form Suc Khoe episodes —
// a young nursing student who fact-checks her grandmother's home remedies.
// One shared design for both locales (not culturally coded like the host
// characters), holding a phone she "looks things up" on. Same talking-mouth
// technique as the other silhouettes.
export const GranddaughterSilhouette: React.FC<{
  scale?: number;
  isSpeaking?: boolean;
  /** true while she's actively reading something off her phone (subtle glow). */
  checkingPhone?: boolean;
}> = ({ scale = 1, isSpeaking = false, checkingPhone = false }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.04) * 1.2;
  const mouthOpen = useMouthOpenAmount(isSpeaking, frame);
  const mouthRy = interpolate(mouthOpen, [0, 1], [2, 6]);
  const mouthRx = interpolate(mouthOpen, [0, 1], [12, 16]);

  const blinkCycle = frame % 140;
  const blinkAmount = interpolate(
    blinkCycle,
    [0, 4, 8, 130, 140],
    [1, 0, 1, 1, 1],
    { extrapolateRight: "clamp" }
  );
  const eyeRy = 12 * blinkAmount + 1;

  const phoneGlow = checkingPhone
    ? interpolate(Math.sin(frame * 0.2), [-1, 1], [0.3, 0.7])
    : 0;

  // Cheap "more alive" pass (2026-08-23) — see HealerSilhouette.tsx for
  // why (both hands implied on the centered phone, so a head-tilt/
  // eyebrow/prop-bob is the anatomically safe way to add motion here too).
  const headTilt = Math.sin(frame * 0.16) * (isSpeaking ? 2.5 : 0.5);
  const eyebrowLift = isSpeaking ? interpolate(Math.sin(frame * 0.22), [-1, 1], [0, -3]) : 0;
  const phoneBob = isSpeaking || checkingPhone ? Math.sin(frame * 0.25) * 2 : 0;

  // Breathing idle + loose-hair-strand follow-through, same technique as
  // HealerSilhouette.tsx.
  const breathe = Math.sin(frame * 0.09) * 1.1;
  const headTiltDelayed = Math.sin((frame - 4) * 0.16) * (isSpeaking ? 2.5 : 0.5) * 1.15;
  const hairLagDelta = headTiltDelayed - headTilt;

  const w = 320 * scale;
  const h = 320 * scale;

  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        transform: `rotate(${sway}deg) translateY(${breathe}px)`,
      }}
    >
      <svg width={w} height={h} viewBox="0 0 320 320">
        {/* shoulders / casual top */}
        <path d="M 40 320 Q 50 240 160 232 Q 270 240 280 320 Z" fill="#4A7A8C" />

        {/* neck */}
        <rect x="140" y="188" width="40" height="42" fill="#EAC9A0" />

        {/* head + face, tilting independently of body sway */}
        <g transform={`rotate(${headTilt} 160 138)`}>
          <ellipse cx="160" cy="138" rx="82" ry="88" fill="#F2D3AC" />

          {/* hair top, moves rigidly with the head */}
          <path
            d="M 78 120 Q 76 48 160 42 Q 244 48 242 120 Q 236 78 160 74 Q 84 78 78 120 Z"
            fill="#3a2a1f"
          />

          {/* loose strands — lag a few frames behind (follow-through),
              like real hair swinging rather than being glued on */}
          <g transform={`rotate(${hairLagDelta} 160 100)`}>
            <path d="M 78 118 Q 66 160 78 200 L 92 190 Q 82 150 90 116 Z" fill="#3a2a1f" />
            <path d="M 242 118 Q 254 160 242 200 L 228 190 Q 238 150 230 116 Z" fill="#3a2a1f" />
          </g>

          {/* eyebrows — lift slightly while talking */}
          <g transform={`translate(0 ${eyebrowLift})`}>
            <path d="M 112 104 Q 128 96 146 102" stroke="#3a2a1f" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 174 102 Q 192 96 208 104" stroke="#3a2a1f" strokeWidth="5" fill="none" strokeLinecap="round" />
          </g>

          {/* eyes */}
          <ellipse cx="132" cy="122" rx="13" ry={eyeRy} fill="#FFFFFF" />
          <ellipse cx="188" cy="122" rx="13" ry={eyeRy} fill="#FFFFFF" />
          {blinkAmount > 0.5 ? (
            <>
              <circle cx="133" cy="123" r="6" fill="#3a2a1f" />
              <circle cx="189" cy="123" r="6" fill="#3a2a1f" />
            </>
          ) : null}

          {/* rosy cheeks */}
          <ellipse cx="108" cy="156" rx="13" ry="8" fill="#E38A6E" opacity="0.35" />
          <ellipse cx="212" cy="156" rx="13" ry="8" fill="#E38A6E" opacity="0.35" />

          {/* nose */}
          <path d="M 160 112 Q 167 138 160 148 Q 155 151 150 147" stroke="#C99A64" strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* mouth */}
          <ellipse cx="160" cy="172" rx={mouthRx} ry={mouthRy} fill="#8a4a3a" />
        </g>

        {/* phone, held up like she's reading from it — bobs slightly
            while talking/checking, instead of sitting dead-still */}
        <g transform={`translate(0 ${phoneBob})`}>
          <rect x="140" y="228" width="40" height="66" rx="6" fill="#222" stroke="#555" strokeWidth="2" />
          <rect x="145" y="234" width="30" height="48" rx="2" fill="#eaf4ff" opacity={0.85 + phoneGlow * 0.15} />
        </g>
      </svg>

      {checkingPhone ? (
        <div
          style={{
            position: "absolute",
            left: 138 * scale,
            top: 220 * scale,
            width: 44 * scale,
            height: 80 * scale,
            borderRadius: 8 * scale,
            background: `rgba(120, 200, 255, ${phoneGlow})`,
            filter: "blur(6px)",
          }}
        />
      ) : null}
    </div>
  );
};
