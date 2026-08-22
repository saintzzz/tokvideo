import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { HealerSilhouette } from "./components/HealerSilhouette";
import { GrandmaHostSilhouette } from "./components/GrandmaHostSilhouette";

// Channel avatars (profile pictures) for both Suc Khoe channels, plus the
// CharacterBadge building block also reused by BannerComposition.tsx for
// the channel banner. Rendered as still frames with `npx remotion still`,
// not part of the video pipeline. YouTube crops the profile picture to a
// circle and shows it small in most places (search results, comments) —
// so the character's FACE needs to fill almost the whole frame, no wasted
// margin, no text (text disappears at avatar size). There's no YouTube
// API to upload a profile picture (confirmed 2026-08-23 — only
// channelBanners.insert for the banner exists), so this still has to be
// uploaded by hand once via YouTube Studio > Customization > Branding >
// Picture.
//
// Crop math: each mascot's own SVG viewBox is 0..340. CharacterBadge takes
// a crop box in that same coordinate space and scales+positions it to
// fill a `size`x`size` circle exactly, via an overflow:hidden wrapper —
// precise crop instead of eyeballing a transform on the whole 340x340
// component. Cropped tight to "top of headscarf/hair" through "chin"
// (excludes neck/collar/held object entirely) — a first pass that
// included the collar had the held prop (mortar, mixing spoon) bleed into
// frame looking like a stray mark near the mouth. A tight face-only crop
// also matches the actual bar: an avatar shows at 48x48px in most UI, so
// face fill matters far more than visible context.
const CROP_X: [number, number] = [77, 264];
const CROP_Y: [number, number] = [8, 195];

export const AVATAR_STYLES = {
  vi: { bgFrom: "#F6E3C4", bgTo: "#3E5A32", ringColor: "#EFC090" },
  en: { bgFrom: "#FBEBD9", bgTo: "#8a4a52", ringColor: "#F0D2AE" },
} as const;

export const CharacterBadge: React.FC<{
  size: number;
  bgFrom: string;
  bgTo: string;
  ringColor: string;
  children: React.ReactNode;
}> = ({ size, bgFrom, bgTo, ringColor, children }) => {
  const cropW = CROP_X[1] - CROP_X[0];
  const cropH = CROP_Y[1] - CROP_Y[0];
  const scale = size / Math.min(cropW, cropH);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: `radial-gradient(circle at 50% 38%, ${bgFrom} 0%, ${bgTo} 100%)`,
        flexShrink: 0,
      }}
    >
      {/* soft inner vignette ring — reads well once YouTube crops this to
          a circle, gives it a finished "badge" look instead of a flat crop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          boxShadow: `inset 0 0 0 ${size * 0.0175}px ${ringColor}55, inset 0 -${size * 0.05}px ${size * 0.11}px rgba(0,0,0,0.18)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "50%" }}>
        <div
          style={{
            position: "absolute",
            left: -CROP_X[0] * scale,
            top: -CROP_Y[0] * scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const CANVAS = 800;

// Vietnamese channel: "bà lang" herbalist — headscarf, warm green ao ba ba.
export const AvatarVI: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: AVATAR_STYLES.vi.bgTo }}>
    <CharacterBadge size={CANVAS} {...AVATAR_STYLES.vi}>
      <HealerSilhouette scale={1} isSpeaking={false} />
    </CharacterBadge>
  </AbsoluteFill>
);

// English channel: grandmotherly figure — grey hair bun, glasses, cardigan.
export const AvatarEN: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: AVATAR_STYLES.en.bgTo }}>
    <CharacterBadge size={CANVAS} {...AVATAR_STYLES.en}>
      <GrandmaHostSilhouette scale={1} isSpeaking={false} />
    </CharacterBadge>
  </AbsoluteFill>
);

export const AvatarCompositions: React.FC = () => (
  <>
    <Composition id="Avatar-vi" component={AvatarVI} width={CANVAS} height={CANVAS} fps={30} durationInFrames={1} />
    <Composition id="Avatar-en" component={AvatarEN} width={CANVAS} height={CANVAS} fps={30} durationInFrames={1} />
  </>
);
