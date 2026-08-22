export type LongFormBeat = {
  /** Which recurring character speaks this line. "narrator" = no on-screen speaker, used for scene-setting VO. */
  speaker: "narrator" | "grandma" | "granddaughter";
  /** Full spoken line, used for narration audio. */
  text: string;
  /**
   * Short on-screen caption for this beat, a handful of words, NOT the
   * full spoken sentence — too much on-screen text was flagged as an
   * actual problem in testing. Keep every caption well under the length
   * of `text`. Falls back to `text` only if genuinely omitted, which
   * should be rare.
   */
  caption?: string;
  /**
   * Which act/setting this beat belongs to — drives which background and
   * character blocking is shown. Kept small and reused across the whole
   * episode (a handful of locations revisited), not a new set per line.
   */
  scene: "hook" | "kitchen" | "car" | "bedroom" | "dressing-room" | "wedding-hall";
  /**
   * Present only on the line where the granddaughter reveals the real
   * research behind a remedy — triggers the animated science-diagram
   * overlay. `verdict` drives the on-screen stamp.
   */
  factReveal?: {
    diagram:
      | "honey"
      | "ginger"
      | "ginger-en"
      | "turmeric"
      | "fishmint"
      | "honeylemon"
      | "chickensoup"
      | "oatmeal"
      | "mythbust"
      | "mythbust-vi";
    verdict: "confirmed" | "unproven";
    citation: string;
  };
};

export type LongFormEpisode = {
  slug: string;
  locale: "vi" | "en";
  title: string;
  description: string;
  beats: LongFormBeat[];
};
