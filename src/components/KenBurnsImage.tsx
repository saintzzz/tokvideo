import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

type KenBurnsImageProps = {
  src: string;
  durationInFrames: number;
  zoomFrom?: number;
  zoomTo?: number;
  panX?: number;
  panY?: number;
};

// Slow zoom/pan over a static photo so a real product photo reads as
// "video", not a slideshow slide.
export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  durationInFrames,
  zoomFrom = 1,
  zoomTo = 1.15,
  panX = 0,
  panY = 0,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [zoomFrom, zoomTo]);
  const x = interpolate(progress, [0, 1], [0, panX]);
  const y = interpolate(progress, [0, 1], [0, panY]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${x}%, ${y}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
