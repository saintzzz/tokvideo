export type LongFormBeat = {
  /** Which recurring character speaks this line. "narrator" = no on-screen speaker, used for scene-setting VO. */
  speaker: "narrator" | "grandma" | "granddaughter";
  text: string;
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
    diagram: "honey" | "ginger" | "ginger-en" | "turmeric" | "fishmint" | "honeylemon" | "chickensoup" | "oatmeal" | "mythbust";
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
