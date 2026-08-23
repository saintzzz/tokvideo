import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ScienceDiagram, DiagramKey } from "../components/ScienceDiagram";
import { fonts } from "../fonts";

export const DiagramScene: React.FC<{
  diagram: DiagramKey;
  locale: "vi" | "en";
  factRevealIndex?: number;
  factRevealTotal?: number;
}> = ({ diagram, locale, factRevealIndex, factRevealTotal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgePop = spring({ frame, fps, config: { damping: 11, mass: 0.5 }, durationInFrames: 16 });
  const badgeScale = interpolate(badgePop, [0, 1], [0.6, 1]);
  const badgeOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0c140e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {factRevealIndex && factRevealTotal ? (
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 34,
              color: "#0e150d",
              backgroundColor: "#7CB342",
              borderRadius: 999,
              padding: "10px 32px",
              boxShadow: "0 8px 24px rgba(124,179,66,0.4)",
              letterSpacing: 1,
            }}
          >
            {locale === "en"
              ? `TRICK ${factRevealIndex}/${factRevealTotal}`
              : `MẸO ${factRevealIndex}/${factRevealTotal}`}
          </div>
        </div>
      ) : null}
      <ScienceDiagram diagram={diagram} locale={locale} />
    </AbsoluteFill>
  );
};
