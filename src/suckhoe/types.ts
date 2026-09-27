// One channel, two episode kinds (CR-001 channel pivot):
//   "remedy" (default, omitted kind) — folk-remedy Shorts, the original
//     format. Requires ingredientName/remedy/steps.
//   "story" — storytelling Shorts (folk tales, ghost-lite village tales,
//     heartwarming parables, history anecdotes). The pivot away from the
//     saturated/YMYL-suppressed remedy niche. Requires storyParts.
// The renderer, voiceover, publish queue and captions all branch on
// `kind` — same pipeline, different scene content.

type SucKhoeBase = {
  slug: string;
  channelTitle: string;
  hook: string;
  cta: string;
  /** Safety/caveat note shown in the CTA scene. Optional. */
  caution?: string;
  /**
   * Which channel/audience this episode is for. Omitted = "vi" (existing
   * Vietnamese "Suc Khoe" channel, all content in Vietnamese). "en" is a
   * separate English-market channel — culturally-appropriate Western
   * content, not translations of the Vietnamese episodes. Locale drives
   * TTS voice selection and which channel's credentials/queue an episode
   * publishes through — see scripts/generate-voiceover.mjs and
   * scripts/publish-next-suckhoe.mjs.
   */
  locale?: "vi" | "en";
  /**
   * Topic grouping for YouTube playlists — after a successful upload,
   * scripts/upload-youtube.mjs adds the video to the matching playlist
   * (see src/suckhoe/playlist-map.json for the category → playlist ID
   * mapping, one map per locale). Grouping related videos into playlists
   * encourages longer watch sessions, which the algorithm rewards.
   * Remedy categories: "ho-cam-hong", "tieu-hoa", "giac-ngu",
   * "dau-nhuc-met-moi", "da-toc-lam-dep" (vi) and "en-cold-throat",
   * "en-sleep-relax", "en-skin-beauty", "en-digestion" (en).
   * Story categories (no playlists yet — uploads fine without one):
   * "co-tich", "ma-lang-que", "cam-dong", "lich-su" (vi) and
   * "en-folklore", "en-spooky", "en-heartwarming", "en-history" (en).
   * An episode whose category isn't in playlist-map.json is uploaded
   * normally, just not added to any playlist.
   */
  category?: string;
  /**
   * Optional hook intro style — when omitted, the style rotates
   * deterministically by slug hash so consecutive uploads never share
   * the same opening pattern (see HookScene + docs/CHANNEL-STRATEGY.md).
   */
  hookStyle?: "question" | "statement" | "countdown" | "pov";
  /**
   * Optional real/AI photos (paths under public/, e.g.
   * "images/suckhoe/<slug>/01.jpg"). When present, the scenes render them
   * with the Ken Burns effect instead of the abstract visuals. Files
   * must exist — validate-episodes checks.
   */
  images?: string[];
};

export type RemedyEpisode = SucKhoeBase & {
  kind?: "remedy";
  ingredientName: string;
  remedy: string;
  steps: string[];
};

export type StoryEpisode = SucKhoeBase & {
  kind: "story";
  /**
   * Story beats in order — ONE scene + ONE voiceover file (part-N.mp3)
   * per beat, so this array is the actual narrative arc of the video:
   * setup → conflict → escalation → turn → resolution. 4-7 beats lands
   * the video at ~90-150s; the old 40s cram (2-3 parts) was dropped
   * because a real tale needs room.
   */
  storyParts: string[];
  /** Optional closing lesson/moral, narrated just before the CTA. */
  moral?: string;
  /**
   * Serialized storytelling: when a tale is too long for one video,
   * split it into multiple episodes that share a seriesTitle. All parts
   * land in one YouTube playlist named after the series (auto-created
   * on first upload, cached in src/suckhoe/series-playlists.json).
   * seriesPart is 1-based; part 2+ hooks should recap briefly.
   */
  seriesTitle?: string;
  seriesPart?: number;
  seriesTotal?: number;
};

export type SucKhoeEpisode = RemedyEpisode | StoryEpisode;
