import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { ScrimOverlay } from "../components/ScrimOverlay";
import { fonts } from "../fonts";

const SLIDES = [
  { src: "images/ideverray/02.jpg", caption: "Form oversize unisex", pan: -6 },
  { src: "images/ideverray/05.jpg", caption: "Ai mặc cũng đẹp", pan: 6 },
  {
    src: "images/ideverray/08.jpg",
    caption: "2 màu đen · trắng — đủ size S đến XL",
    pan: -6,
  },
  {
    src: "images/ideverray/09.jpg",
    caption: "Đi biển, đi chơi, đi đâu cũng chất",
    pan: 6,
  },
];

const CROSSFADE = 12;

const Slide: React.FC<{
  src: string;
  caption: string;
  pan: number;
  start: number;
  end: number;
}> = ({ src, caption, pan, start, end }) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  const duration = end - start;

  const opacity = interpolate(
    frame,
    [start, start + CROSSFADE, end - CROSSFADE, end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const captionY = interpolate(local, [0, 12], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <KenBurnsImage
        src={src}
        durationInFrames={duration}
        zoomFrom={1.08}
        zoomTo={1.2}
        panX={pan}
      />
      <ScrimOverlay position="bottom" />
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 60px",
          transform: `translateY(${captionY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 38,
            color: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 16,
            padding: "10px 26px",
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
};

export const ShowcaseScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
  const segment = Math.floor(durationInFrames / SLIDES.length);

  return (
    <>
      {hasAudio ? (
        <Audio src={staticFile("audio/ideverray/showcase.mp3")} />
      ) : null}

      {SLIDES.map((slide, i) => (
        <Slide
          key={slide.src}
          src={slide.src}
          caption={slide.caption}
          pan={slide.pan}
          start={i * segment}
          end={i === SLIDES.length - 1 ? durationInFrames : (i + 1) * segment}
        />
      ))}
    </>
  );
};
