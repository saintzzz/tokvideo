export type AnimatedFilmSpeaker =
  | "narrator"
  | "ba_tu"
  | "mai"
  | "huy"
  | "co_sau"
  | "chu_bay"
  | "be_tom"
  | "bac_si_long"
  | "y_ta_hoa"
  | "chi_ngoc";

export type AnimatedFilmLocation =
  | "nha_ba_tu"
  | "quan_co_sau"
  | "benh_vien"
  | "cong_ty"
  | "ngo_xom";

export type AnimatedFilmAction =
  | "idle"
  | "stir_pot"
  | "wave"
  | "walk_in"
  | "walk_out"
  | "sit_down"
  | "stand_up"
  | "point"
  | "hug"
  | "cough"
  | "laugh"
  | "cry_softly"
  | "write"
  | "read_chart"
  | "eat"
  | "drink"
  | "gesture_explain";

export type AnimatedFilmBeat = {
  speaker: AnimatedFilmSpeaker;
  location: AnimatedFilmLocation;
  characters_present: AnimatedFilmSpeaker[];
  action: AnimatedFilmAction;
  /** Full spoken line/narration, used for voiceover generation and word-count pacing. */
  text: string;
  /** On-screen caption — must match the meaning of `text`, can be a shorter paraphrase. */
  caption: string;
  /**
   * Present on exactly one beat per episode — the moment a character
   * explains the real science behind the episode's fact_focus (see
   * series-bible.json). Drives the on-screen fact-check overlay.
   */
  factReveal?: {
    fact: string;
    verdict: "confirmed" | "nuanced" | "myth";
    citation: string;
  };
};

export type AnimatedFilmEpisode = {
  episode: number;
  title: string;
  chapter: number;
  beats: AnimatedFilmBeat[];
};
