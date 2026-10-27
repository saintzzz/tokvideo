import React from "react";
import { useCurrentFrame } from "remotion";

// Procedural flat-cartoon character — zero image assets, so the
// character is pixel-identical in every video forever (the whole point
// of cutout/puppet animation for channel mascot recognition).
//
// Mouth is driven by `talkLevel` (0..1): the shorts video component
// feeds it from word-level caption timings so the mouth opens on
// speech and idles between beats. Eyes blink on a fixed cycle with a
// small randomized double-blink so it doesn't look mechanical.
export type PuppetPalette = {
  skin: string;
  hair: string;
  shirt: string;
  accent: string;
};

export const CartoonPuppet: React.FC<{
  talkLevel: number; // 0 = closed, 1 = wide open
  scale?: number;
  palette?: Partial<PuppetPalette>;
  /** subtle horizontal offset so two puppets can share a scene */
  x?: number;
}> = ({ talkLevel, scale = 1, palette = {}, x = 0 }) => {
  const frame = useCurrentFrame();
  const p: PuppetPalette = {
    skin: palette.skin ?? "#F5C98A",
    hair: palette.hair ?? "#3A2A1A",
    shirt: palette.shirt ?? "#C0392B",
    accent: palette.accent ?? "#F1C40F",
  };

  // Blink: closed 6 frames every ~3.2s, occasional double-blink.
  const blinkCycle = frame % 96;
  const blinking =
    blinkCycle < 6 || (frame % 400 > 370 && frame % 400 < 376);
  const eyeH = blinking ? 4 : 26;

  // Idle motion: gentle bob + slight lean so the puppet breathes.
  const bob = Math.sin(frame * 0.09) * 6;
  const sway = Math.sin(frame * 0.045) * 1.4;
  const mouthH = 6 + talkLevel * 34;

  return (
    <svg
      width={420 * scale}
      height={560 * scale}
      viewBox="0 0 420 560"
      style={{
        transform: `translateX(${x}px) translateY(${bob}px) rotate(${sway}deg)`,
      }}
    >
      {/* body */}
      <rect x="110" y="330" width="200" height="220" rx="60" fill={p.shirt} />
      <rect x="195" y="330" width="30" height="200" rx="8" fill={p.accent} opacity="0.85" />
      {/* arms */}
      <rect x="60" y="350" width="60" height="180" rx="30" fill={p.shirt}
        transform={`rotate(${8 + Math.sin(frame * 0.09) * 4} 90 380)`} />
      <rect x="300" y="350" width="60" height="180" rx="30" fill={p.shirt}
        transform={`rotate(${-8 - Math.sin(frame * 0.09 + 1) * 4} 330 380)`} />
      {/* neck + head */}
      <rect x="185" y="290" width="50" height="60" rx="16" fill={p.skin} />
      <ellipse cx="210" cy="180" rx="110" ry="120" fill={p.skin} />
      {/* hair */}
      <path d="M 100 160 Q 100 60 210 55 Q 320 60 320 160 Q 280 100 210 100 Q 140 100 100 160 Z" fill={p.hair} />
      {/* eyes */}
      <ellipse cx="165" cy="180" rx="16" ry={eyeH / 2} fill="#fff" />
      <ellipse cx="255" cy="180" rx="16" ry={eyeH / 2} fill="#fff" />
      {!blinking && (
        <>
          <circle cx="168" cy="182" r="7" fill="#1a1a1a" />
          <circle cx="258" cy="182" r="7" fill="#1a1a1a" />
        </>
      )}
      {/* brows — lift slightly while talking for liveliness */}
      <rect x="145" y={148 - talkLevel * 6} width="40" height="9" rx="4" fill={p.hair} />
      <rect x="235" y={148 - talkLevel * 6} width="40" height="9" rx="4" fill={p.hair} />
      {/* mouth — opens with speech level */}
      <ellipse cx="210" cy={250} rx={26 + talkLevel * 8} ry={mouthH / 2} fill="#6B2A1E" />
      {talkLevel > 0.15 && (
        <ellipse cx="210" cy={252 + mouthH / 4} rx={14 + talkLevel * 4} ry={mouthH / 4} fill="#C0392B" />
      )}
      {/* cheeks */}
      <ellipse cx="140" cy="230" rx="18" ry="10" fill="#E89B7A" opacity="0.5" />
      <ellipse cx="280" cy="230" rx="18" ry="10" fill="#E89B7A" opacity="0.5" />
    </svg>
  );
};
