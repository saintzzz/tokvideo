export type SucKhoeEpisode = {
  slug: string;
  channelTitle: string;
  hook: string;
  ingredientName: string;
  remedy: string;
  steps: string[];
  /** Ingredient-specific safety note, e.g. honey + infants. Optional. */
  caution?: string;
  cta: string;
  /**
   * Which channel/audience this episode is for. Omitted = "vi" (existing
   * Vietnamese "Suc Khoe" channel, all content in Vietnamese). "en" is a
   * separate English-market channel — culturally-appropriate Western home
   * remedies, not translations of the Vietnamese content. Locale drives
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
   * Vietnamese categories: "ho-cam-hong", "tieu-hoa", "giac-ngu",
   * "dau-nhuc-met-moi", "da-toc-lam-dep". English: "en-cold-throat",
   * "en-sleep-relax", "en-skin-beauty", "en-digestion". Adding a new
   * category requires creating the playlist and adding it to
   * playlist-map.json — an episode whose category isn't in the map is
   * uploaded normally, just not added to any playlist.
   */
  category?: string;
};
