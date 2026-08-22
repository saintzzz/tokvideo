import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { HealerSilhouette } from "./components/HealerSilhouette";
import { GrandmaHostSilhouette } from "./components/GrandmaHostSilhouette";
import { CharacterBadge, AVATAR_STYLES } from "./AvatarComposition";
import { fonts } from "./fonts";

// Channel banners (the wide "channel art" behind a channel's videos/about
// page). Unlike the avatar, YouTube DOES support uploading this via API
// (channelBanners.insert + channels.update on brandingSettings.image) —
// see scripts/set-channel-banner.mjs, fully automated, no manual step.
//
// Rendered at the full 2560x1440 YouTube asks for, but only the CENTERED
// 1546x423 "safe area" is guaranteed visible on every device (mobile crops
// the hardest). Everything that matters — badge + channel name + tagline —
// stays centered as one group well inside that safe box; the wider canvas
// just gives desktop/TV viewers extra background, never critical content.
const WIDTH = 2560;
const HEIGHT = 1440;
const BADGE_SIZE = 340;
// YouTube's guaranteed-visible-on-every-device area — toggle on temporarily
// when adjusting layout to confirm nothing critical sits outside it.
// Verified 2026-08-23: badge+title+subtitle group sits well inside this
// box with margin on both sides at the current sizes below.
const SHOW_SAFE_ZONE_GUIDE = false;
const SAFE_W = 1546;
const SAFE_H = 423;

const BannerFrame: React.FC<{
  bgFrom: string;
  bgTo: string;
  ringColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ bgFrom, bgTo, ringColor, title, subtitle, children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${bgFrom} 0%, ${bgTo} 75%)` }}>
    {SHOW_SAFE_ZONE_GUIDE ? (
      <div
        style={{
          position: "absolute",
          left: (WIDTH - SAFE_W) / 2,
          top: (HEIGHT - SAFE_H) / 2,
          width: SAFE_W,
          height: SAFE_H,
          border: "4px dashed magenta",
          boxSizing: "border-box",
        }}
      />
    ) : null}
    <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 50 }}>
      <CharacterBadge size={BADGE_SIZE} bgFrom={bgFrom} bgTo={bgTo} ringColor={ringColor}>
        {children}
      </CharacterBadge>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
        <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 64, color: "#FBEFDD", lineHeight: 1.1 }}>
          {title}
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 28,
            color: ringColor,
            marginTop: 14,
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

export const BannerVI: React.FC = () => (
  <BannerFrame
    {...AVATAR_STYLES.vi}
    title="Bà Lang Mách Mẹo"
    subtitle="Mẹo dân gian mỗi ngày, có kiểm chứng khoa học"
  >
    <HealerSilhouette scale={1} isSpeaking={false} />
  </BannerFrame>
);

export const BannerEN: React.FC = () => (
  <BannerFrame
    {...AVATAR_STYLES.en}
    title="Home Remedies"
    subtitle="Grandma's wisdom, checked against real science"
  >
    <GrandmaHostSilhouette scale={1} isSpeaking={false} />
  </BannerFrame>
);

export const BannerCompositions: React.FC = () => (
  <>
    <Composition id="Banner-vi" component={BannerVI} width={WIDTH} height={HEIGHT} fps={30} durationInFrames={1} />
    <Composition id="Banner-en" component={BannerEN} width={WIDTH} height={HEIGHT} fps={30} durationInFrames={1} />
  </>
);
