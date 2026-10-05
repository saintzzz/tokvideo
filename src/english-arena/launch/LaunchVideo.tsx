import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  Series,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import story from "./story.json";

type Scene = (typeof story.scenes)[number];
type Props = {
  sceneIds: string[];
  durations: number[];
  audio: boolean;
  poster?: boolean;
  preview?: boolean;
};
const GOLD = "#FFD44C";
const INK = "#0C1732";
const FONT = '"EA Be Vietnam", sans-serif';
const pad = 18;
const asset = (name: string) => staticFile(`ea-launch/${name}`);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Brand = () => (
  <div
    style={{
      position: "absolute",
      top: 112,
      left: 72,
      right: 136,
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 18,
        background: GOLD,
        color: INK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 27,
      }}
    >
      EA
    </div>
    <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: 1 }}>
      ENGLISH ARENA
    </div>
    <div style={{ marginLeft: "auto", color: "#B3C3DB", fontSize: 24 }}>
      VieSchool
    </div>
  </div>
);

const Backdrop = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 10% 35%, #244979 0%, transparent 58%), radial-gradient(ellipse at 95% 80%, #185152 0%, transparent 50%)",
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 740 + i * 180,
            height: 740 + i * 180,
            borderRadius: "50%",
            border: "1px solid #FFFFFF0B",
            left: 390 - i * 90,
            top: 500 - i * 90,
            transform: `rotate(${f * 0.04}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          borderRadius: 20,
          background: GOLD,
          left: 50,
          top: 1160 + Math.sin(f / 40) * 18,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

// Original screenshots are cropped only by viewport: no fabricated student results.
const Proof = ({ scene, duration }: { scene: Scene; duration: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 7, fps, config: { damping: 22 } });
  const crop = scene.cropHeight ?? 1864;
  const width = scene.id === "report" ? 650 : scene.id === "quest" ? 710 : 794;
  const height = Math.min(840, (width * crop) / 860);
  const scale = interpolate(f, [0, duration], [1, 1.018], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 654,
        left: 72,
        right: 136,
        height: 850,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        transform: `translateY(${(1 - p) * 45}px) scale(${0.98 + 0.02 * p})`,
        opacity: p,
      }}
    >
      <div
        style={{
          width,
          height,
          overflow: "hidden",
          border: "2px solid #93B5DE55",
          borderRadius: 36,
          background: "#101A34",
          boxShadow: "0 36px 75px #0006",
          position: "relative",
        }}
      >
        <Img
          src={staticFile(`images/english-arena/${scene.shot}`)}
          style={{
            width: "100%",
            position: "absolute",
            top: (-(scene.cropTop ?? 0) * width) / 860,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        />
      </div>
      {scene.id === "quest" && (
        <div
          style={{
            position: "absolute",
            top: height + 12,
            width: 710,
            height: 340,
            overflow: "hidden",
            border: "2px solid #93B5DE55",
            borderRadius: 30,
          }}
        >
          <Img
            src={staticFile("images/english-arena/pet.png")}
            style={{
              width: 710,
              position: "absolute",
              top: (-740 * 710) / 860,
            }}
          />
        </div>
      )}
      {scene.id === "review" && (
        <div
          style={{
            position: "absolute",
            top: height + 40,
            fontSize: 33,
            color: "#95DDCF",
            fontWeight: 600,
          }}
        >
          Nhận ra → Ôn lại → Luyện tiếp
        </div>
      )}
    </div>
  );
};

const Hook = ({ poster }: { poster?: boolean }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f - 8, fps, config: { damping: 22 } });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 190,
          top: 700,
          width: 550,
          height: 760,
          borderRadius: 46,
          border: "3px solid #9BBBDD66",
          overflow: "hidden",
          transform: `translateY(${(1 - enter) * 70}px) rotate(-4deg)`,
          boxShadow: "0 32px 100px #0007",
        }}
      >
        <Img
          src={staticFile("images/english-arena/home.png")}
          style={{ width: "100%", position: "absolute", top: -38 }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 1010,
          padding: "22px 30px",
          background: GOLD,
          color: INK,
          borderRadius: 24,
          fontSize: 30,
          fontWeight: 800,
          transform: `rotate(-5deg) translateY(${Math.sin(f / 23) * 6}px)`,
        }}
      >
        Luyện tập qua trò chơi
      </div>
      <div
        style={{
          position: "absolute",
          left: 510,
          top: 1370,
          padding: "20px 28px",
          background: "#B9E8DC",
          color: INK,
          borderRadius: 24,
          fontSize: 29,
          fontWeight: 800,
          transform: "rotate(3deg)",
        }}
      >
        Cùng con khám phá
      </div>
      {poster && (
        <div
          style={{
            position: "absolute",
            top: 1575,
            left: 72,
            color: GOLD,
            fontWeight: 800,
            fontSize: 42,
          }}
        >
          {story.url}
        </div>
      )}
    </>
  );
};

const Cta = () => {
  const f = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 655,
          left: 72,
          right: 136,
          padding: "44px 28px",
          borderRadius: 30,
          background: GOLD,
          color: INK,
          fontSize: 59,
          fontWeight: 800,
          textAlign: "center",
          boxShadow: `0 16px ${40 + Math.sin(f / 22) * 8}px #FFD44C22`,
        }}
      >
        {story.url}
      </div>
      <div
        style={{
          position: "absolute",
          top: 895,
          left: 72,
          right: 136,
          fontSize: 37,
          lineHeight: 1.65,
          textAlign: "center",
        }}
      >
        Chọn <strong style={{ color: GOLD }}>“Chơi không cần tài khoản”</strong>
        <br />
        Thử miễn phí 1 vòng ở mỗi lớp
      </div>
      <div
        style={{
          position: "absolute",
          top: 1125,
          left: 172,
          width: 680,
          height: 237,
          overflow: "hidden",
          borderRadius: 32,
          border: "2px solid #93B5DE44",
        }}
      >
        <Img
          src={staticFile("images/english-arena/login.png")}
          style={{ width: 680, position: "absolute", top: (-1350 * 680) / 860 }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1410,
          left: 72,
          right: 136,
          textAlign: "center",
          color: "#ADBCD2",
          fontSize: 25,
        }}
      >
        Đăng nhập để mở đủ 4 vòng luyện tập.
      </div>
    </>
  );
};

const Beat = ({
  scene,
  duration,
  audio,
  poster,
}: {
  scene: Scene;
  duration: number;
  audio: boolean;
  poster?: boolean;
}) => {
  const f = useCurrentFrame();
  const fade = poster
    ? 1
    : interpolate(f, [0, 9, duration - 7, duration], [0, 1, 1, 0], clamp);
  // Phrase captions stay fixed in position. No approximate word-level karaoke.
  const speechFrames = duration - pad;
  const weights = scene.captions.map((s) => s.length);
  const total = weights.reduce((a, b) => a + b, 0);
  let before = 0;
  const idx = weights.findIndex((w) => {
    before += w;
    return (f - 4) / Math.max(1, speechFrames - 4) < before / total;
  });
  const caption =
    scene.captions[Math.max(0, idx < 0 ? weights.length - 1 : idx)];
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {audio && !poster && (
        <Sequence from={4}>
          <Audio src={asset(`${scene.id}.mp3`)} />
        </Sequence>
      )}
      <div
        style={{
          position: "absolute",
          top: 242,
          left: 72,
          color: GOLD,
          fontSize: 23,
          letterSpacing: 2,
          fontWeight: 800,
        }}
      >
        {scene.eyebrow}
      </div>
      <div
        style={{
          position: "absolute",
          top: 307,
          left: 72,
          right: 130,
          whiteSpace: "pre-line",
          fontSize: scene.kind === "hook" ? 69 : 64,
          lineHeight: 1.22,
          letterSpacing: -2,
          fontWeight: 800,
          transform: `translateY(${interpolate(f, [0, 14], [18, 0], clamp)}px)`,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          position: "absolute",
          top: 522,
          left: 72,
          right: 136,
          color: "#B9E8DC",
          fontSize: scene.kind === "cta" ? 26 : 30,
          lineHeight: 1.5,
          fontWeight: 600,
        }}
      >
        {scene.accent}
      </div>
      {scene.kind === "hook" ? (
        <Hook poster={poster} />
      ) : scene.kind === "cta" ? (
        <Cta />
      ) : (
        <Proof scene={scene} duration={duration} />
      )}
      {!poster && (
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 128,
            top: 1550,
            height: 150,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 34,
            lineHeight: 1.45,
            textAlign: "center",
            fontWeight: 600,
            padding: "12px 28px",
            background: "#071226E8",
            borderRadius: 22,
          }}
        >
          {caption}
        </div>
      )}
      {scene.kind === "proof" && (
        <div
          style={{
            position: "absolute",
            top: 1492,
            left: 72,
            color: "#ACBCD1",
            fontSize: 20,
          }}
        >
          Giao diện sản phẩm • Dữ liệu minh họa
        </div>
      )}
    </AbsoluteFill>
  );
};

export const LaunchVideo: React.FC<Props> = ({
  sceneIds,
  durations,
  audio,
  poster,
}) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const [handle] = React.useState(() =>
    delayRender("Load local Vietnamese fonts"),
  );
  React.useEffect(() => {
    Promise.all([
      document.fonts.load('800 64px "EA Be Vietnam"'),
      document.fonts.load('600 34px "EA Be Vietnam"'),
    ])
      .then(() => continueRender(handle))
      .catch(cancelRender);
  }, [handle]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#FFFFFF" }}>
      <style>
        {[600, 800]
          .map(
            (weight) =>
              `@font-face {font-family:'EA Be Vietnam';src:url('${asset(`font-${weight}.ttf`)}') format('truetype');font-weight:${weight};font-style:normal;}`,
          )
          .join("\n")}
      </style>
      <Backdrop />
      <Brand />
      {audio && !poster && (
        <Audio
          src={asset("music.wav")}
          volume={(frame) =>
            interpolate(
              frame,
              [0, 30, durationInFrames - 45, durationInFrames],
              [0, 0.18, 0.18, 0],
              clamp,
            )
          }
        />
      )}
      <Series>
        {sceneIds.map((id, i) => (
          <Series.Sequence key={id} durationInFrames={durations[i]}>
            <Beat
              scene={story.scenes.find((s) => s.id === id)!}
              duration={durations[i]}
              audio={audio}
              poster={poster}
            />
          </Series.Sequence>
        ))}
      </Series>
      {!poster && (
        <div
          style={{
            position: "absolute",
            top: 1765,
            left: 72,
            right: 136,
            display: "flex",
            gap: 10,
          }}
        >
          {sceneIds.map((id, i) => {
            const start = durations.slice(0, i).reduce((a, b) => a + b, 0);
            return (
              <div
                key={id}
                style={{
                  flex: 1,
                  height: 5,
                  background: "#FFFFFF20",
                  overflow: "hidden",
                  borderRadius: 5,
                }}
              >
                <div
                  style={{
                    width: `${interpolate(f, [start, start + durations[i]], [0, 100], clamp)}%`,
                    height: 5,
                    background: GOLD,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const LaunchCompositions = () => (
  <>
    {Object.entries(story.versions).map(([name, sceneIds]) => {
      const defaults = sceneIds.map(
        (id) => story.scenes.find((s) => s.id === id)!.seconds * story.fps,
      );
      return (
        <Composition
          key={name}
          id={`EnglishArena-Launch-${name}`}
          component={LaunchVideo}
          fps={story.fps}
          width={1080}
          height={1920}
          durationInFrames={defaults.reduce((a, b) => a + b, 0)}
          defaultProps={{
            sceneIds,
            durations: defaults,
            audio: false,
            preview: false,
          }}
          calculateMetadata={async ({ props }) => {
            if (props.preview)
              return {
                durationInFrames: defaults.reduce((a, b) => a + b, 0),
                props: { ...props, audio: false, durations: defaults },
              };
            // Fail clearly if narration is missing; final exports must never silently lose voiceover.
            const durations = await Promise.all(
              sceneIds.map(
                async (id) =>
                  Math.ceil(
                    (await getAudioDurationInSeconds(asset(`${id}.mp3`))) *
                      story.fps,
                  ) +
                  pad +
                  4,
              ),
            );
            return {
              durationInFrames: durations.reduce((a, b) => a + b, 0),
              props: { sceneIds, durations, audio: true },
            };
          }}
        />
      );
    })}
    <Composition
      id="EnglishArena-Launch-Poster"
      component={LaunchVideo}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={90}
      defaultProps={{
        sceneIds: ["hook"],
        durations: [90],
        audio: false,
        poster: true,
      }}
    />
  </>
);
