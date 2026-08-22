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
};
