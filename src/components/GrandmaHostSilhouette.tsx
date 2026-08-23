import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useMouthOpenAmount } from "./useTalkingMouth";

// English-channel host mascot: an illustrated grandmotherly figure — grey
// hair bun, glasses, cozy cardigan, wooden spoon & mixing bowl — distinct
// from HealerSilhouette (the Vietnamese "bà lang" character) rather than
// reusing it, since that one's headscarf/collar read specifically
// Vietnamese and would look mismatched paired with Western home-remedy
// content. Original SVG shapes, not a real person. Same talking-mouth
// technique as HealerSilhouette/HippocratesSilhouette.
export const GrandmaHostSilhouette: React.FC<{
  scale?: number;
  isSpeaking?: boolean;
}> = ({ scale = 1, isSpeaking = false }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.05) * 1.5;
  const mouthOpen = useMouthOpenAmount(isSpeaking, frame);
  const mouthRy = interpolate(mouthOpen, [0, 1], [2, 7]);
  const mouthRx = interpolate(mouthOpen, [0, 1], [14, 18]);

  const blinkCycle = frame % 130;
  const blinkAmount = interpolate(
    blinkCycle,
    [0, 4, 8, 120, 130],
    [1, 0, 1, 1, 1],
    { extrapolateRight: "clamp" }
  );
  const eyeRy = 12 * blinkAmount + 1;

  const steamWiggle = Math.sin(frame * 0.15) * 4;

  // Cheap "more alive" pass (2026-08-23) — see HealerSilhouette.tsx for
  // why this is a head-tilt/eyebrow/prop-bob approach rather than a new
  // gesturing arm (both hands are already implied on the centered mixing
  // bowl, so a third arm would look anatomically wrong).
  const headTilt = Math.sin(frame * 0.15) * (isSpeaking ? 2.5 : 0.5);
  const eyebrowLift = isSpeaking ? interpolate(Math.sin(frame * 0.2), [-1, 1], [0, -3]) : 0;
  const objectBob = isSpeaking ? Math.sin(frame * 0.25) * 2 : 0;

  // Breathing idle + hair-bun follow-through, same technique as
  // HealerSilhouette.tsx (see there for the reasoning).
  const breathe = Math.sin(frame * 0.08) * 1.2;
  const headTiltDelayed = Math.sin((frame - 5) * 0.15) * (isSpeaking ? 2.5 : 0.5) * 1.15;
  const hairLagDelta = headTiltDelayed - headTilt;

  const w = 340 * scale;
  const h = 340 * scale;

  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        transform: `rotate(${sway}deg) translateY(${breathe}px)`,
      }}
    >
      <svg width={w} height={h} viewBox="0 0 340 340">
        {/* shoulders / cardigan */}
        <path d="M 45 340 Q 55 255 170 245 Q 285 255 295 340 Z" fill="#B85C6B" />
        <path
          d="M 120 250 L 170 275 L 220 250 L 210 340 L 130 340 Z"
          fill="#E8D9C5"
        />
        <circle cx="170" cy="270" r="4" fill="#8a4a52" />
        <circle cx="170" cy="285" r="4" fill="#8a4a52" />

        {/* neck */}
        <rect x="150" y="205" width="40" height="45" fill="#E8C4A0" />

        {/* head + face, tilting independently of body sway */}
        <g transform={`rotate(${headTilt} 170 150)`}>
          <ellipse cx="170" cy="150" rx="88" ry="93" fill="#F0D2AE" />

          {/* grey hair bun — lags a few frames behind the head (follow-through) */}
          <g transform={`rotate(${hairLagDelta} 170 90)`}>
            <path
              d="M 85 130 Q 82 55 170 48 Q 258 55 255 130 Q 250 90 170 85 Q 90 90 85 130 Z"
              fill="#D8D4D0"
            />
            <circle cx="170" cy="58" r="22" fill="#D8D4D0" />
          </g>

          {/* eyebrows — lift slightly while talking */}
          <g transform={`translate(0 ${eyebrowLift})`}>
            <path
              d="M 118 112 Q 136 104 156 110"
              stroke="#9a9490"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 184 110 Q 204 104 222 112"
              stroke="#9a9490"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* glasses */}
          <circle cx="140" cy="132" r="22" fill="none" stroke="#5a4a3a" strokeWidth="3.5" />
          <circle cx="200" cy="132" r="22" fill="none" stroke="#5a4a3a" strokeWidth="3.5" />
          <path d="M 162 132 L 178 132" stroke="#5a4a3a" strokeWidth="3.5" />

          {/* eyes */}
          <ellipse cx="140" cy="132" rx="13" ry={eyeRy} fill="#FFFFFF" />
          <ellipse cx="200" cy="132" rx="13" ry={eyeRy} fill="#FFFFFF" />
          {blinkAmount > 0.5 ? (
            <>
              <circle cx="141" cy="133" r="6" fill="#5a4a3a" />
              <circle cx="201" cy="133" r="6" fill="#5a4a3a" />
            </>
          ) : null}

          {/* rosy cheeks */}
          <ellipse cx="115" cy="168" rx="14" ry="9" fill="#E38A6E" opacity="0.4" />
          <ellipse cx="225" cy="168" rx="14" ry="9" fill="#E38A6E" opacity="0.4" />

          {/* nose */}
          <path
            d="M 170 122 Q 178 152 170 162 Q 164 165 159 160"
            stroke="#C99A64"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* mouth */}
          <ellipse cx="170" cy="188" rx={mouthRx} ry={mouthRy} fill="#8a4a3a" />
        </g>

        {/* mixing bowl + wooden spoon, held lower center — bobs slightly
            while talking */}
        <g transform={`translate(0 ${objectBob})`}>
          <ellipse cx="170" cy="250" rx="32" ry="16" fill="#EAEAEA" />
          <path d="M 142 250 Q 170 268 198 250 L 193 260 Q 170 274 147 260 Z" fill="#CFCFCF" />
          <rect
            x="165"
            y="200"
            width="9"
            height="48"
            rx="4.5"
            fill="#a08a68"
            transform="rotate(-12 170 224)"
          />
          <ellipse cx="196" cy="204" rx="9" ry="13" fill="#a08a68" transform="rotate(-12 196 204)" />
        </g>
      </svg>

      {/* kitchen steam */}
      {new Array(3).fill(0).map((_, i) => {
        const t = (frame + i * 22) % 90;
        const opacity = interpolate(t, [0, 20, 70, 90], [0, 0.55, 0.35, 0]);
        const yOffset = interpolate(t, [0, 90], [0, -46]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (155 + i * 10) * scale,
              top: (225 + yOffset) * scale,
              width: 9 * scale,
              height: 22 * scale,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.6)",
              filter: "blur(3px)",
              opacity,
              transform: `translateX(${steamWiggle}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
