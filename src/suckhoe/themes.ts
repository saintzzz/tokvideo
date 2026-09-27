import type { SucKhoeEpisode } from "./types";

// Per-category visual themes — the "different fingerprint" lever from
// docs/CHANNEL-STRATEGY.md §3.2. Two consecutive uploads in different
// categories must look different in the first second: different
// background hue family, accent color, and particle motif.

export type SceneTheme = {
  /** Radial gradient stops: [center, mid, edge] */
  bg: [string, string, string];
  /** Accent color — step badges, captions highlight, CTA elements */
  accent: string;
  /** Text-on-dark base color */
  ink: string;
  /** Bokeh tint (rgba string) */
  bokeh: string;
  /** Particle hue range base (degrees) */
  particleHue: number;
};

const THEMES: Record<string, SceneTheme> = {
  "ho-cam-hong": {
    bg: ["#2b1e1a", "#150e0d", "#090606"],
    accent: "#E0A458",
    ink: "#FAF0E6",
    bokeh: "rgba(224,164,88,0.28)",
    particleHue: 25,
  },
  "tieu-hoa": {
    bg: ["#1c2b1a", "#0e150d", "#060906"],
    accent: "#7CB342",
    ink: "#F2FAEC",
    bokeh: "rgba(120,200,120,0.28)",
    particleHue: 90,
  },
  "giac-ngu": {
    bg: ["#171b2e", "#0c0e1a", "#05060c"],
    accent: "#7C9FF2",
    ink: "#EAF0FA",
    bokeh: "rgba(124,159,242,0.26)",
    particleHue: 225,
  },
  "dau-nhuc-met-moi": {
    bg: ["#26201c", "#14100e", "#0a0807"],
    accent: "#C08BD8",
    ink: "#F5EDF7",
    bokeh: "rgba(192,139,216,0.25)",
    particleHue: 290,
  },
  "da-toc-lam-dep": {
    bg: ["#2b1a24", "#160d13", "#0b0609"],
    accent: "#F28BB4",
    ink: "#FAEEF3",
    bokeh: "rgba(242,139,180,0.26)",
    particleHue: 330,
  },
  "en-cold-throat": {
    bg: ["#14222b", "#0b1217", "#05090c"],
    accent: "#5FBFBF",
    ink: "#E8F4F4",
    bokeh: "rgba(95,191,191,0.26)",
    particleHue: 185,
  },
  "en-sleep-relax": {
    bg: ["#1c1530", "#0e0a1a", "#060409"],
    accent: "#9B8AF0",
    ink: "#EFEAFA",
    bokeh: "rgba(155,138,240,0.26)",
    particleHue: 255,
  },
  "en-skin-beauty": {
    bg: ["#2b1a1a", "#170d0d", "#0c0606"],
    accent: "#E89B7A",
    ink: "#FAF0EA",
    bokeh: "rgba(232,155,122,0.26)",
    particleHue: 15,
  },
  "en-digestion": {
    bg: ["#1f2b14", "#10170a", "#080b05"],
    accent: "#A4C639",
    ink: "#F1F7E3",
    bokeh: "rgba(164,198,57,0.26)",
    particleHue: 75,
  },
  // ── Story categories (CR-001 pivot) ────────────────────────────
  // co-tich: warm fireside amber — grandma telling tales by the hearth.
  "co-tich": {
    bg: ["#33200f", "#1a1009", "#0b0705"],
    accent: "#E8B04B",
    ink: "#FBF3E4",
    bokeh: "rgba(232,176,75,0.28)",
    particleHue: 32,
  },
  // ma-lang-que: cold village-night teal — ghost stories, kept eerie not
  // gory. Pale accent reads "spectral" against the near-black ground.
  "ma-lang-que": {
    bg: ["#12211f", "#08110f", "#040807"],
    accent: "#8FD8C9",
    ink: "#E4F2EF",
    bokeh: "rgba(143,216,201,0.22)",
    particleHue: 168,
  },
  // cam-dong: warm dusk rose — heartwarming parables.
  "cam-dong": {
    bg: ["#2e1d1e", "#170e0f", "#0a0606"],
    accent: "#E89B8A",
    ink: "#FAEEE9",
    bokeh: "rgba(232,155,138,0.26)",
    particleHue: 8,
  },
  // lich-su: aged parchment sepia — history anecdotes.
  "lich-su": {
    bg: ["#2a2118", "#140f0a", "#080604"],
    accent: "#C9A15F",
    ink: "#F4ECD9",
    bokeh: "rgba(201,161,95,0.26)",
    particleHue: 38,
  },
  "en-folklore": {
    bg: ["#1a2b1c", "#0d150e", "#060906"],
    accent: "#A8C686",
    ink: "#EFF6E8",
    bokeh: "rgba(168,198,134,0.26)",
    particleHue: 95,
  },
  "en-spooky": {
    bg: ["#1c1630", "#0e0a18", "#06040c"],
    accent: "#A89BD0",
    ink: "#EDEAF6",
    bokeh: "rgba(168,155,208,0.24)",
    particleHue: 250,
  },
  "en-heartwarming": {
    bg: ["#2e1d1e", "#170e0f", "#0a0606"],
    accent: "#E8A88F",
    ink: "#FAF0EB",
    bokeh: "rgba(232,168,143,0.26)",
    particleHue: 14,
  },
  "en-history": {
    bg: ["#26201a", "#131009", "#080604"],
    accent: "#C9A15F",
    ink: "#F4ECD9",
    bokeh: "rgba(201,161,95,0.26)",
    particleHue: 40,
  },
};

const DEFAULT_THEME: SceneTheme = THEMES["tieu-hoa"];

export const themeForEpisode = (episode: SucKhoeEpisode): SceneTheme =>
  (episode.category && THEMES[episode.category]) || DEFAULT_THEME;

// Deterministic hook-style rotation by slug — consecutive alphabetical
// uploads land on different intro patterns even when the episode JSON
// doesn't pin hookStyle. See PRD Q-06.
export const HOOK_STYLES = ["question", "statement", "countdown", "pov"] as const;
export type HookStyle = (typeof HOOK_STYLES)[number];

export const hookStyleForEpisode = (episode: SucKhoeEpisode): HookStyle => {
  if (episode.hookStyle) return episode.hookStyle;
  let h = 0;
  for (const ch of episode.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HOOK_STYLES[h % HOOK_STYLES.length];
};
