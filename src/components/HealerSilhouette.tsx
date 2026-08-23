import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useMouthOpenAmount } from "./useTalkingMouth";

// Channel host mascot: an illustrated elder Vietnamese herbalist ("bà lang")
// — headscarf, kind face, herbal mortar & pestle. Original SVG shapes, not
// a real person, so no likeness/consent issue. Mouth flaps while
// isSpeaking, same technique as HippocratesSilhouette.
export const HealerSilhouette: React.FC<{
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
  const eyeRy = 13 * blinkAmount + 1;

  const steamWiggle = Math.sin(frame * 0.15) * 4;

  // Cheap "more alive" pass (2026-08-23, user asked for more lively
  // animation): a full limb-rig is out of scope for this SVG-based
  // character (both hands are already implied busy on the centered
  // mortar/pestle — adding a third gesturing arm would look anatomically
  // wrong), so the win instead is a head-only micro-nod (independent of
  // the existing whole-body sway), an eyebrow lift while talking, and the
  // held object bobbing slightly, as if it's moving with her gestures.
  const headTilt = Math.sin(frame * 0.15) * (isSpeaking ? 2.5 : 0.5);
  const eyebrowLift = isSpeaking ? interpolate(Math.sin(frame * 0.2), [-1, 1], [0, -3]) : 0;
  const objectBob = isSpeaking ? Math.sin(frame * 0.25) * 2 : 0;

  const w = 340 * scale;
  const h = 340 * scale;

  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        transform: `rotate(${sway}deg)`,
      }}
    >
      <svg width={w} height={h} viewBox="0 0 340 340">
        {/* shoulders / ao ba ba collar */}
        <path d="M 45 340 Q 55 255 170 245 Q 285 255 295 340 Z" fill="#5C7A4A" />
        <path
          d="M 130 250 L 170 285 L 210 250 L 195 320 L 170 300 L 145 320 Z"
          fill="#3E5A32"
        />

        {/* neck */}
        <rect x="150" y="205" width="40" height="45" fill="#E3B27C" />

        {/* head + face, tilting independently of the body sway for a
            "nodding while talking" read instead of one stiff block */}
        <g transform={`rotate(${headTilt} 170 150)`}>
          <ellipse cx="170" cy="150" rx="90" ry="95" fill="#EFC090" />

          {/* headscarf (khan mo qua style) */}
          <path
            d="M 78 130 Q 80 55 170 50 Q 260 55 262 130 Q 240 95 170 92 Q 100 95 78 130 Z"
            fill="#6b4a2a"
          />
          <path
            d="M 240 105 Q 268 130 250 168 L 232 150 Q 246 128 228 112 Z"
            fill="#6b4a2a"
          />

          {/* eyebrows — lift slightly while talking, like emphasis */}
          <g transform={`translate(0 ${eyebrowLift})`}>
            <path
              d="M 118 112 Q 136 102 156 110"
              stroke="#4a3320"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 184 110 Q 204 102 222 112"
              stroke="#4a3320"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* eyes */}
          <ellipse cx="140" cy="130" rx="15" ry={eyeRy} fill="#FFFFFF" />
          <ellipse cx="200" cy="130" rx="15" ry={eyeRy} fill="#FFFFFF" />
          {blinkAmount > 0.5 ? (
            <>
              <circle cx="141" cy="132" r="6.5" fill="#3a2a1a" />
              <circle cx="201" cy="132" r="6.5" fill="#3a2a1a" />
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

        {/* mortar and pestle, held lower center — bobs slightly while
            talking so it reads as part of the gesture, not a static prop */}
        <g transform={`translate(0 ${objectBob})`}>
          <ellipse cx="170" cy="248" rx="30" ry="14" fill="#8a7355" />
          <path d="M 145 248 Q 170 264 195 248 L 191 256 Q 170 268 149 256 Z" fill="#6b5a40" />
          <rect
            x="165"
            y="205"
            width="10"
            height="45"
            rx="5"
            fill="#a08a68"
            transform="rotate(-12 170 227)"
          />
        </g>
      </svg>

      {/* herbal steam */}
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
