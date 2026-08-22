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
};
