import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Animated Bà Tư / Grandma June — ported from the approved hand-drawn
// model sheet in blender/ba-tu-concept.html. Every rig channel is a pure
// function of frame (deterministic for Remotion):
//   - breathing:   torso scaleY ~0.8% sine
//   - blink:       eyes squash every ~4s
//   - talking:     mouth open amount driven by summed sines when speaking
//   - head bob:    slight tilt + nod while speaking
//   - arm sway:    gentle swing on both forearms
//   - entrance:    spring-in handled by the scene (scale prop unchanged)

const SKIN = "#f2d3ad";
const SKIN_SHADOW = "#e0b98a";
const CARDIGAN = "#b85966";
const CARDIGAN_DARK = "#99424e";
const HAIR = "#d7d3ce";
const HAIR_DARK = "#b3aea8";
const SKIRT = "#7d6a54";
const SKIRT_DARK = "#5f5140";

// Ported from blender/talking_mouth.py — pseudo-random-feeling mouth
// open amount in [0,1] while speaking, flat 0 when silent.
const mouthOpenAmount = (frame: number, isSpeaking: boolean): number => {
  if (!isSpeaking) return 0;
  const a =
    0.55 +
    0.28 * Math.sin(frame * 0.9) +
    0.17 * Math.sin(frame * 2.3 + 1.3) +
    0.1 * Math.sin(frame * 4.1 + 0.7);
  return Math.min(1, Math.max(0, a));
};

export const BaTuCharacter: React.FC<{
  scale?: number;
  isSpeaking?: boolean;
  /** "present" raises her right arm toward the on-screen ingredient;
   *  "book" has her holding an open storybook with both hands. */
  gesture?: "idle" | "present" | "book";
  /** Avatar face crops hide the bun — at badge size it reads as a stray
   *  blob over the cheek instead of side hair. */
  showBun?: boolean;
}> = ({ scale = 1, isSpeaking = false, gesture = "idle", showBun = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // breathing — subtle vertical squash of the torso, ~4s cycle
  const breathe = 1 + 0.008 * Math.sin((frame / fps) * Math.PI * 0.5);

  // blink — every ~3.9s, eyes close for ~5 frames
  const blinkCycle = frame % Math.round(fps * 3.9);
  const eyeScaleY =
    blinkCycle < 5
      ? interpolate(blinkCycle, [0, 2, 5], [1, 0.1, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

  // talking mouth + head bob
  const mouth = mouthOpenAmount(frame, isSpeaking);
  const headTilt = isSpeaking ? Math.sin(frame * 0.11) * 1.2 : 0;
  const headNod = isSpeaking ? Math.sin(frame * 0.35) * 2 : 0;

  // arm sway — gentle pendulum, opposite phase; "present" pins the
  // right arm up toward the prop she's showing off; "book" tucks both
  // hands inward to hold the open storybook drawn over them below
  const armL =
    gesture === "book"
      ? -42 + 1.5 * Math.sin(frame * 0.07)
      : 2.5 * Math.sin(frame * 0.07);
  const armR =
    gesture === "present"
      ? -58 + 2.5 * Math.sin(frame * 0.07 + Math.PI)
      : gesture === "book"
        ? 42 + 1.5 * Math.sin(frame * 0.07 + Math.PI)
        : 2.5 * Math.sin(frame * 0.07 + Math.PI);

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "bottom center" }}>
      <svg viewBox="0 0 420 620" width={420} height={620} style={{ display: "block" }}>
        {/* ground shadow — pulses faintly with breathing */}
        <ellipse
          cx="210"
          cy="600"
          rx={95 * breathe}
          ry="14"
          fill="#000"
          opacity="0.12"
        />

        {/* LEGS + FEET */}
        <path
          d="M 178 470 Q 174 530 172 560 L 168 592 L 190 592 L 194 560 Q 197 525 200 470 Z"
          fill={SKIN_SHADOW}
        />
        <path
          d="M 232 470 Q 236 530 238 560 L 242 592 L 220 592 L 216 560 Q 213 525 210 470 Z"
          fill={SKIN_SHADOW}
        />
        <path
          d="M 160 588 Q 158 600 168 604 L 200 604 Q 206 600 202 590 L 190 588 Z"
          fill={CARDIGAN_DARK}
        />
        <path
          d="M 250 588 Q 252 600 242 604 L 210 604 Q 204 600 208 590 L 220 588 Z"
          fill={CARDIGAN_DARK}
        />

        {/* SKIRT */}
        <path
          d="M 148 430 Q 140 480 130 555 Q 128 575 145 578 L 275 578 Q 292 575 290 555 Q 280 480 272 430 Q 250 448 210 448 Q 170 448 148 430 Z"
          fill={SKIRT}
        />
        <path d="M 175 452 Q 168 505 158 565" stroke={SKIRT_DARK} strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d="M 210 452 Q 208 510 205 570" stroke={SKIRT_DARK} strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d="M 245 452 Q 252 505 262 565" stroke={SKIRT_DARK} strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />

        {/* TORSO — breathing group */}
        <g transform={`translate(210 380) scale(1 ${breathe}) translate(-210 -380)`}>
          <path
            d="M 150 300 Q 130 330 128 380 Q 126 415 148 435 Q 175 452 210 452 Q 245 452 272 435 Q 294 415 292 380 Q 290 330 270 300 Q 250 288 210 288 Q 170 288 150 300 Z"
            fill={CARDIGAN}
          />
          <path d="M 186 296 Q 210 320 234 296 L 226 330 Q 210 340 194 330 Z" fill="#f3e7d3" />
          <path d="M 178 292 Q 210 326 242 292" stroke={CARDIGAN_DARK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <ellipse cx="210" cy="404" rx="10" ry="8" fill={CARDIGAN_DARK} />
          <path d="M 250 316 Q 262 360 254 404" stroke={CARDIGAN_DARK} strokeWidth="10" fill="none" opacity="0.35" strokeLinecap="round" />
        </g>

        {/* ARMS — swaying groups */}
        <g transform={`rotate(${armL} 158 320)`}>
          <path d="M 148 310 Q 110 330 98 380 Q 92 405 102 415 L 118 405 Q 112 385 122 358 Q 132 335 158 320 Z" fill={CARDIGAN} />
          <ellipse cx="102" cy="411" rx="13" ry="9" fill={CARDIGAN_DARK} transform="rotate(-25 102 411)" />
          <ellipse cx="98" cy="424" rx="13" ry="16" fill={SKIN} />
          <ellipse cx="88" cy="418" rx="7" ry="9" fill={SKIN} />
        </g>
        <g transform={`rotate(${armR} 262 320)`}>
          <path d="M 272 310 Q 310 330 322 380 Q 328 405 318 415 L 302 405 Q 308 385 298 358 Q 288 335 262 320 Z" fill={CARDIGAN} />
          <ellipse cx="318" cy="411" rx="13" ry="9" fill={CARDIGAN_DARK} transform="rotate(25 318 411)" />
          <ellipse cx="322" cy="424" rx="13" ry="16" fill={SKIN} />
          <ellipse cx="332" cy="418" rx="7" ry="9" fill={SKIN} />
        </g>

        {/* open storybook — drawn over the inward-tucked hands so it
            reads as held. Two cream pages with ruled lines, dark red
            cover, subtle page sway while she reads aloud. */}
        {gesture === "book" ? (
          <g
            transform={`translate(210 452) rotate(${Math.sin(frame * 0.09) * 1.5}) translate(-210 -452)`}
          >
            <rect x="138" y="420" width="144" height="84" rx="10" fill="#7a4238" />
            <path d="M 146 428 Q 178 418 208 428 L 208 494 Q 178 486 146 494 Z" fill="#f6ecd8" />
            <path d="M 274 428 Q 242 418 212 428 L 212 494 Q 242 486 274 494 Z" fill="#efe2c8" />
            <path d="M 156 442 Q 180 436 200 442 M 156 456 Q 180 450 200 456 M 156 470 Q 180 464 200 470" stroke="#b39d76" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 220 442 Q 240 436 264 442 M 220 456 Q 240 450 264 456 M 220 470 Q 240 464 264 470" stroke="#b39d76" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="148" cy="496" rx="12" ry="8" fill={SKIN} />
            <ellipse cx="272" cy="496" rx="12" ry="8" fill={SKIN} />
          </g>
        ) : null}

        {/* NECK */}
        <rect x="192" y="256" width="36" height="40" rx="10" fill={SKIN} />

        {/* HEAD — tilt + nod while speaking */}
        <g transform={`translate(210 ${205 + headNod}) rotate(${headTilt}) translate(-210 -205)`}>
          <ellipse cx="210" cy="200" rx="68" ry="76" fill={SKIN} />
          <ellipse cx="210" cy="240" rx="52" ry="30" fill={SKIN_SHADOW} opacity="0.5" />

          {/* hair: swept top + low bun + wisps */}
          <path d="M 146 176 Q 140 108 210 96 Q 280 108 274 176 Q 268 140 210 132 Q 152 140 146 176 Z" fill={HAIR} />
          <path d="M 210 132 Q 250 138 264 168" stroke={HAIR_DARK} strokeWidth="6" fill="none" opacity="0.6" strokeLinecap="round" />
          {showBun ? (
            <>
              <ellipse cx="268" cy="196" rx="26" ry="24" fill={HAIR} />
              <ellipse cx="268" cy="204" rx="22" ry="14" fill={HAIR_DARK} opacity="0.7" />
            </>
          ) : null}
          <path d="M 148 168 Q 130 200 138 240" stroke={HAIR} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M 158 156 Q 144 178 148 206" stroke={HAIR} strokeWidth="5" fill="none" strokeLinecap="round" />

          {/* eyes — blink via scaleY around the eye line */}
          <g transform={`translate(0 ${196 * (1 - eyeScaleY)}) scale(1 ${eyeScaleY})`}>
            <ellipse cx="180" cy="196" rx="9" ry="10" fill="#fff" />
            <ellipse cx="240" cy="196" rx="9" ry="10" fill="#fff" />
            <circle cx="181" cy="198" r="4.5" fill="#4a3222" />
            <circle cx="239" cy="198" r="4.5" fill="#4a3222" />
            <circle cx="183" cy="195" r="1.4" fill="#fff" />
            <circle cx="241" cy="195" r="1.4" fill="#fff" />
          </g>
          <path d="M 166 178 Q 180 168 196 176" stroke="#6b5644" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 224 176 Q 240 168 254 178" stroke="#6b5644" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 165 190 Q 178 186 192 190" stroke={SKIN_SHADOW} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M 228 190 Q 242 186 255 190" stroke={SKIN_SHADOW} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
          <ellipse cx="168" cy="222" rx="12" ry="8" fill="#e0836a" opacity="0.35" />
          <ellipse cx="252" cy="222" rx="12" ry="8" fill="#e0836a" opacity="0.35" />
          <path d="M 210 202 Q 216 222 210 232 Q 206 234 202 231" stroke={SKIN_SHADOW} strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* mouth — smile curve whose height follows speech */}
          {mouth < 0.15 ? (
            <path d="M 192 246 Q 210 258 228 246" stroke="#8a4a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse
              cx="210"
              cy={248}
              rx={9 + mouth * 5}
              ry={3 + mouth * 9}
              fill="#8a4a3a"
            />
          )}
          <path d="M 188 240 Q 186 250 190 256" stroke={SKIN_SHADOW} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M 232 240 Q 234 250 230 256" stroke={SKIN_SHADOW} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
};
