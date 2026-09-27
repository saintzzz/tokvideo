import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { KitchenBackdrop } from "../components/KitchenBackdrop";
import { BaTuCharacter } from "../components/BaTuCharacter";
import { CinematicCamera } from "../components/CinematicCamera";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { fonts } from "../fonts";
import { StoryEpisode } from "../suckhoe/types";
import { themeForEpisode } from "../suckhoe/themes";

// Storytelling scene (CR-001): Bà Tư narrates a folk tale / village
// ghost story / parable / history anecdote. Rendered twice per episode —
// once for the opening beat ("open", maps to the remedy.mp3 slot) and
// once for the rest of the story ("body", maps to steps.mp3) — reusing
// the existing 4-scene audio pipeline so voiceover, captions and
// duration resolution need no changes.

const CATEGORY_LABEL: Record<string, { vi: string; en: string }> = {
  "co-tich": { vi: "TRUYỆN CỔ TÍCH", en: "FOLK TALE" },
  "ma-lang-que": { vi: "CHUYỆN LY KỲ", en: "VILLAGE TALE" },
  "cam-dong": { vi: "CHUYỆN CẢM ĐỘNG", en: "HEARTWARMING" },
  "lich-su": { vi: "GIAI THOẠI XƯA", en: "HISTORY" },
  "en-folklore": { vi: "FOLKLORE", en: "FOLKLORE" },
  "en-spooky": { vi: "SPOOKY TALE", en: "SPOOKY TALE" },
  "en-heartwarming": { vi: "HEARTWARMING", en: "HEARTWARMING" },
  "en-history": { vi: "WEIRD HISTORY", en: "WEIRD HISTORY" },
};

export const StoryScene: React.FC<{
  episode: StoryEpisode;
  hasAudio: boolean;
  /** Which audio/caption slot this instance reads: "remedy" = parts[0], "steps" = parts[1..n]. */
  audioKey: "remedy" | "steps";
}> = ({ episode, hasAudio, audioKey }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = themeForEpisode(episode);
  const isEn = episode.locale === "en";

  const text =
    audioKey === "remedy"
      ? (episode.storyParts[0] ?? "")
      : episode.storyParts.slice(1).join(" ");

  const label =
    CATEGORY_LABEL[episode.category ?? ""]?.[isEn ? "en" : "vi"] ??
    (isEn ? "STORY" : "TRUYỆN");

  const charSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const charScale = interpolate(charSpring, [0, 1], [0.8, 1]);
  const cardIn = spring({
    frame: frame - 14,
    fps,
    config: { damping: 16, mass: 0.8 },
  });
  const cardY = interpolate(cardIn, [0, 1], [60, 0]);
  const cardOpacity = interpolate(frame, [14, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground theme={theme}>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/${audioKey}.mp3`)} />
      ) : null}

      <KitchenBackdrop accent={theme.accent} />

      <CinematicCamera move={audioKey === "remedy" ? "drift-left" : "push"}>
        {/* Category chip, pinned high so it never collides with the card */}
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [6, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 4,
              color: theme.accent,
              border: `2px solid ${theme.accent}66`,
              borderRadius: 999,
              padding: "8px 26px",
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            {label}
          </div>
        </div>

        {/* Storyteller + card side by side, centered above the caption zone */}
        <div
          style={{
            position: "absolute",
            top: 300,
            bottom: 420,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "0 44px",
          }}
        >
          <div style={{ transform: `scale(${charScale})`, flexShrink: 0 }}>
            <BaTuCharacter scale={0.58} isSpeaking={hasAudio} />
          </div>

          <div
            style={{
              width: 560,
              opacity: cardOpacity,
              transform: `translateY(${cardY}px)`,
              backgroundColor: "rgba(8,6,4,0.62)",
              border: `1px solid ${theme.accent}55`,
              borderRadius: 26,
              padding: "30px 36px",
              boxShadow: `0 24px 60px rgba(0,0,0,0.5), inset 0 0 80px ${theme.accent}10`,
            }}
          >
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 33,
                lineHeight: 1.5,
                color: theme.ink,
                textShadow: "0 2px 18px rgba(0,0,0,0.6)",
              }}
            >
              {text}
            </div>
          </div>
        </div>
      </CinematicCamera>

      <KaraokeCaption
        videoId={`suckhoe-${episode.slug}`}
        scene={audioKey}
        accent={theme.accent}
      />
    </NutritionBackground>
  );
};
