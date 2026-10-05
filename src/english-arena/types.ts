// English Arena marketing videos (ea.vieschool.com) — pain-first short
// ads for parents / teachers / center owners. Each episode is hook
// (pain) -> parts (agitate + product proof) -> CTA, rendered 9:16 for
// TikTok/Reels/Shorts/Zalo. NOT channel content: no YouTube upload —
// artifacts go to the owner for posting.

export type EaPart = {
  /** Narration line for this beat — spoken by TTS and shown as a
   *  karaoke caption plus a short on-screen summary. */
  text: string;
  /** Optional real-app screenshot under public/images/english-arena/
   *  (e.g. "exam-mid.png") shown with a slow zoom — product proof beats
   *  should always carry one. Omit for pure agitate beats. */
  shot?: string;
  /** Optional short feature label chip shown above the screenshot
   *  (e.g. "Báo cáo phụ huynh"). */
  label?: string;
};

export type EnglishArenaEpisode = {
  slug: string;
  /** Internal/post title — pain-first phrasing. */
  channelTitle: string;
  /** Audience this ad speaks to — drives the hook chip label and CTA. */
  persona: "phu-huynh" | "giao-vien" | "trung-tam";
  /** Cold open naming the pain (spoken + on-screen kinetic text). */
  hook: string;
  /** 2-5 beats: agitate -> solution proof -> outcome. */
  parts: EaPart[];
  /** Closing call to action — always points to ea.vieschool.com. */
  cta: string;
};
