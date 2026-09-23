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
