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
  scene:
    | "hook"
    | "kitchen"
    | "car"
    | "bedroom"
    | "dressing-room"
    | "wedding-hall"
    // Xianxia story-arc sets (added 2026-09-27 for the cultivation
    // audiobook series — narrator-only beats, motifs carry the mood)
    | "sect-mountain"
    | "cultivation-cave"
    | "battlefield"
    | "arena"
    | "forest-night"
    | "throne-hall"
    | "cliff-edge"
    | "village-dusk"
    // Horror arc sets (CR-002, "Loi nguyen gieng cu"): Vietnamese
    // village ghost-story settings, narrated slowly.
    | "village-night"
    | "haunted-house"
    | "ancestral-altar"
    | "old-well"
    | "graveyard"
    | "river-mist"
    | "storm-night"
    // Horror arc tập 4-5 additions: confrontation + epilogue locations.
    | "estate-gate"
    | "ancestral-house"
    | "village-square"
    | "well-shrine"
    | "dawn-village";
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
  /**
   * YouTube metadata overrides for scripts/upload-youtube-long.mjs -
   * per-arc tags/hashtags replace the generic story boilerplate (e.g.
   * horror tags for CR-002 instead of the xianxia defaults).
   */
  tags?: string[];
  /** Space-separated #tags appended to the description. */
  hashtags?: string;
  /**
   * Short punchy overlay text for scripts/make-long-thumbnail.mjs
   * (uppercase, a few words) - the full title is too long for a
   * readable thumbnail.
   */
  thumbTitle?: string;
  /**
   * AI-generated still per scene setting (path under public/, e.g.
   * "images/suckhoe-long/<slug>/haunted-house.jpg"). Beats in that scene
   * show this image with a slow Ken Burns drift instead of the
   * procedural gradient+motif background - the visual-consistency
   * mechanism for serialized stories: same setting, same image, across
   * every beat and every episode that revisits it.
   */
  sceneImages?: Partial<Record<LongFormBeat["scene"], string>>;
  /**
   * Prompt per scene for scripts/generate-story-visuals.mjs --long.
   * Authoring-time metadata; the renderer only reads `sceneImages`.
   */
  scenePrompts?: Partial<Record<LongFormBeat["scene"], string>>;
  /**
   * Per-beat image override for a one-off visual beat inside a scene
   * (rare - sceneImages covers the common case).
   */
  beatImages?: Record<number, string>;
  /**
   * Narrator delivery override - e.g. slower/lower for horror.
   * { rate, pitch, volume } in Edge-TTS prosody format ("-5%").
   */
  prosody?: { rate?: string; pitch?: string; volume?: string };
  beats: LongFormBeat[];
};
