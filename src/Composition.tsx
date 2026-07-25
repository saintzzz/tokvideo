import { CalculateMetadataFunction, Composition } from "remotion";
import { GiaCatLuongVideo, GiaCatLuongVideoProps } from "./GiaCatLuongVideo";
import { resolveSceneDurations } from "./composition-utils";
import { FPS, GIA_CAT_LUONG_FALLBACK_SECONDS, GiaCatLuongSceneKey } from "./timing";

const SCENE_KEYS = Object.keys(
  GIA_CAT_LUONG_FALLBACK_SECONDS
) as GiaCatLuongSceneKey[];

const calculateMetadata: CalculateMetadataFunction<
  GiaCatLuongVideoProps
> = async () => {
  const { sceneDurations, hasAudio, durationInFrames } =
    await resolveSceneDurations(
      SCENE_KEYS,
      GIA_CAT_LUONG_FALLBACK_SECONDS,
      (key) => `audio/${key}.mp3`
    );

  return {
    props: { sceneDurations, hasAudio },
    durationInFrames,
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const MyComposition = () => {
  return (
    <Composition
      id="GiaCatLuong-TuVi"
      component={GiaCatLuongVideo}
      durationInFrames={720}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        sceneDurations: {
          hook: GIA_CAT_LUONG_FALLBACK_SECONDS.hook * FPS,
          quote: GIA_CAT_LUONG_FALLBACK_SECONDS.quote * FPS,
          twist: GIA_CAT_LUONG_FALLBACK_SECONDS.twist * FPS,
          cta: GIA_CAT_LUONG_FALLBACK_SECONDS.cta * FPS,
        },
        hasAudio: { hook: false, quote: false, twist: false, cta: false },
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
