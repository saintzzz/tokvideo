import React from "react";
import {
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { KitchenBackdrop } from "../components/KitchenBackdrop";
import { BaTuCharacter } from "../components/BaTuCharacter";
import { CinematicCamera, CameraMove } from "../components/CinematicCamera";
import { KaraokeCaption } from "../components/KaraokeCaption";
import { FireGlow } from "../components/FireGlow";
import { fonts } from "../fonts";
import { StoryEpisode } from "../suckhoe/types";
import { themeForEpisode } from "../suckhoe/themes";

// Storytelling scene (CR-001): Bà Tư narrates a folk tale / village
// mystery / parable / history anecdote, one storyPart per scene instance
// (audio file part-<index>.mp3). She holds an open storybook beside a
// fire glow — the "grandma telling tales" staging. Longer stories split
// into as many of these as needed (~10-20s each), so a real 5-7 beat
// tale runs 90-150s instead of the cramped 40s version.

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

// Different camera move per beat so consecutive scenes never feel like
// the same shot repeated — slow drift for quiet exposition, push for
// the reveal/climax beats.
const CAMERA_ROTATION: CameraMove[] = ["drift-left", "push", "drift-right", "pull"];

export const StoryScene: React.FC<{
  episode: StoryEpisode;
  hasAudio: boolean;
  partIndex: number;
  /** Audio/caption slot: part-0, part-1, ... */
  audioKey: string;
}> = ({ episode, hasAudio, partIndex, audioKey }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = themeForEpisode(episode);
  const isEn = episode.locale === "en";

  const text = episode.storyParts[partIndex] ?? "";

  const label =
    CATEGORY_LABEL[episode.category ?? ""]?.[isEn ? "en" : "vi"] ??
    (isEn ? "STORY" : "TRUYỆN");
  // Serialized tales get an episode-number chip under the category
  // label, so viewers landing mid-series know where they are.
  const partLabel = episode.seriesPart
    ? isEn
      ? `PART ${episode.seriesPart}${episode.seriesTotal ? ` OF ${episode.seriesTotal}` : ""}`
      : `TẬP ${episode.seriesPart}${episode.seriesTotal ? `/${episode.seriesTotal}` : ""}`
    : null;

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

  // Generated scene illustration for this beat (generate-story-visuals).
  // When present it replaces the text card — the narration still plays
  // and the karaoke caption carries the words, so the image gets the
  // full frame. A hard mid-scene switch of zoom direction creates the
  // sub-cut beat every ~4-5s that short-form retention needs, without a
  // second image.
  const { durationInFrames } = useVideoConfig();
  const shot = episode.images?.[partIndex];
  const half = Math.floor(durationInFrames / 2);
  const inSecondHalf = frame >= half;
  const zoomP1 = interpolate(frame, [0, half], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoomP2 = interpolate(frame, [half, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const imgScale = inSecondHalf
    ? interpolate(zoomP2, [0, 1], [1.3, 1.12])
    : interpolate(zoomP1, [0, 1], [1.05, 1.24]);
  const imgPanX = inSecondHalf
    ? interpolate(zoomP2, [0, 1], [-2.5, 1.5])
    : interpolate(zoomP1, [0, 1], [0, -2.5]);

  return (
    <NutritionBackground theme={theme}>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/${audioKey}.mp3`)} />
      ) : null}

      <KitchenBackdrop accent={theme.accent} />
      <FireGlow accent={theme.accent} />

      {shot ? (
        <div
          style={{
            position: "absolute",
            top: 210,
            bottom: 400,
            left: 44,
            right: 44,
            overflow: "hidden",
            borderRadius: 36,
            border: `2px solid ${theme.accent}55`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            opacity: cardOpacity,
            transform: `translateY(${cardY}px)`,
          }}
        >
          <Img
            src={staticFile(shot)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${imgScale}) translateX(${imgPanX}%)`,
              transformOrigin: "center 40%",
            }}
          />
          {/* Vignette at the bottom so the karaoke caption stays legible
              over bright areas of the illustration. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 260,
              background:
                "linear-gradient(180deg, transparent, rgba(5,8,4,0.82))",
            }}
          />
        </div>
      ) : null}

      <CinematicCamera move={CAMERA_ROTATION[partIndex % CAMERA_ROTATION.length]}>
        {/* Category chip, pinned high so it never collides with the card */}
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
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
          {partLabel ? (
            <div
              style={{
                fontFamily: fonts.sans,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 3,
                color: theme.ink,
                marginTop: 14,
                opacity: 0.85,
              }}
            >
              {partLabel}
            </div>
          ) : null}
        </div>

        {/* Storyteller + card side by side, centered above the caption
            zone. With a generated illustration the card disappears and
            Bà Tư shrinks to a corner avatar — brand continuity without
            covering the artwork. */}
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
          <div
            style={
              shot
                ? {
                    position: "absolute",
                    left: 60,
                    bottom: 30,
                    transform: `scale(${charScale})`,
                  }
                : { transform: `scale(${charScale})`, flexShrink: 0 }
            }
          >
            <BaTuCharacter
              scale={shot ? 0.34 : 0.72}
              isSpeaking={hasAudio}
              gesture="book"
            />
          </div>

          {!shot ? <div
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
          </div> : null}
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
