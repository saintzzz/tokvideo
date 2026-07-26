import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useMouthOpenAmount } from "./useTalkingMouth";

// A close-up "bust" portrait (not a photo) — big expressive face so the
// character reads clearly even at moderate size: eyes with blinking,
// eyebrows, nose, a mouth that flaps while isSpeaking, beard, laurel
// wreath. Bold, saturated colors so it has a distinct "mascot" look
// instead of a plain silhouette.
export const HippocratesSilhouette: React.FC<{
  scale?: number;
  isSpeaking?: boolean;
}> = ({ scale = 1, isSpeaking = false }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.05) * 1.5;
  const mouthOpen = useMouthOpenAmount(isSpeaking, frame);
  const mouthRy = interpolate(mouthOpen, [0, 1], [2, 8]);
  const mouthRx = interpolate(mouthOpen, [0, 1], [16, 20]);

  // Periodic blink: closed for a few frames every ~110 frames.
  const blinkCycle = frame % 110;
  const blinkAmount = interpolate(
    blinkCycle,
    [0, 4, 8, 100, 110],
    [1, 0, 1, 1, 1],
    { extrapolateRight: "clamp" }
  );
  const eyeRy = 15 * blinkAmount + 1;

  const eyebrowLift = isSpeaking
    ? interpolate(Math.sin(frame * 0.15), [-1, 1], [-2, 2])
    : 0;

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
        {/* shoulders / toga */}
        <path
          d="M 40 340 Q 50 250 170 240 Q 290 250 300 340 Z"
          fill="#E9E4D8"
        />
        <path
          d="M 40 340 Q 50 260 130 248 L 120 340 Z"
          fill="#CFC7B3"
        />

        {/* neck */}
        <rect x="150" y="205" width="40" height="45" fill="#E3B27C" />

        {/* head */}
        <ellipse cx="170" cy="150" rx="92" ry="98" fill="#F0C48E" />

        {/* ears */}
        <ellipse cx="82" cy="155" rx="12" ry="18" fill="#F0C48E" />
        <ellipse cx="258" cy="155" rx="12" ry="18" fill="#F0C48E" />

        {/* beard (lower face + cheeks), drawn UNDER the mouth/nose so they sit on top */}
        <path
          d="M 96 140 Q 92 220 170 236 Q 248 220 244 140 Q 248 200 170 210 Q 92 200 96 140 Z"
          fill="#F5F1E6"
        />
        <path
          d="M 96 140 Q 92 220 170 236 Q 248 220 244 140"
          fill="none"
          stroke="#D8CFB8"
          strokeWidth="3"
        />

        {/* eyebrows */}
        <path
          d={`M 118 108 Q 138 ${96 + eyebrowLift} 158 106`}
          stroke="#6b4a2a"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 182 106 Q 202 ${96 + eyebrowLift} 222 108`}
          stroke="#6b4a2a"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />

        {/* eyes */}
        <ellipse cx="138" cy="128" rx="16" ry={eyeRy} fill="#FFFFFF" />
        <ellipse cx="202" cy="128" rx="16" ry={eyeRy} fill="#FFFFFF" />
        {blinkAmount > 0.5 ? (
          <>
            <circle cx="140" cy="130" r="7" fill="#3a2a1a" />
            <circle cx="200" cy="130" r="7" fill="#3a2a1a" />
            <circle cx="142" cy="128" r="2.2" fill="#fff" />
            <circle cx="202" cy="128" r="2.2" fill="#fff" />
          </>
        ) : null}

        {/* nose */}
        <path
          d="M 170 118 Q 178 150 170 162 Q 163 165 158 160"
          stroke="#C99A64"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />

        {/* mustache */}
        <path
          d="M 140 178 Q 170 190 200 178 Q 170 172 140 178 Z"
          fill="#EDE7D8"
        />

        {/* mouth — opens/closes while isSpeaking */}
        <ellipse cx="170" cy="192" rx={mouthRx} ry={mouthRy} fill="#8a4a3a" />
        <ellipse cx="170" cy="192" rx={mouthRx - 5} ry={mouthRy * 0.6} fill="#5a2a1e" />

        {/* laurel wreath */}
        <path
          d="M 100 92 Q 130 62 170 66"
          stroke="#5C8A3A"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 240 92 Q 210 62 170 66"
          stroke="#5C8A3A"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="108" cy="90" r="7" fill="#7CB342" />
        <circle cx="128" cy="72" r="7" fill="#7CB342" />
        <circle cx="232" cy="90" r="7" fill="#7CB342" />
        <circle cx="212" cy="72" r="7" fill="#7CB342" />
        <circle cx="170" cy="60" r="8" fill="#D8A23A" />
      </svg>
    </div>
  );
};
