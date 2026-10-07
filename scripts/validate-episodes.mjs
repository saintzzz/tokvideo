// Validates every episode JSON against the contract in src/suckhoe/types.ts
// PLUS the channel's YMYL compliance rules (previously prose-only in
// README). Runs in CI before any render/publish — a bad episode fails the
// build here, not inside a Remotion render or, worse, on the channel.
//
// Usage: node scripts/validate-episodes.mjs [--strict]
//   --strict also fails on warnings (e.g. missing caution field).

import { readdir, readFile, access, stat } from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const strict = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const playlistMap = JSON.parse(
  await readFile(path.join(root, "src/suckhoe/playlist-map.json"), "utf8")
);
// Shape: { vi: { category: playlistId }, en: { ... } } — validate a
// category against the map for the episode's own locale.
const validCategoriesFor = (locale) => new Set(Object.keys(playlistMap[locale] ?? {}));

const LOCALES = new Set(["vi", "en"]);
const HOOK_STYLES = new Set(["question", "statement", "countdown", "pov"]);
const KINDS = new Set(["remedy", "story"]);
// Story categories (CR-001) — no playlists exist for them yet, so they're
// validated against this list instead of playlist-map.json.
const STORY_CATEGORIES = {
  vi: new Set(["co-tich", "ma-lang-que", "cam-dong", "lich-su"]),
  en: new Set(["en-folklore", "en-spooky", "en-heartwarming", "en-history"]),
};

// Health-claim words that get YMYL channels struck. Checked case-insensitively
// against every user-visible string field.
const BANNED_VI = [/chữa(?:\s|$)/i, /trị\s+bệnh/i, /thay\s+(?:thuốc|thế\s+thuốc)/i, /khỏi\s+bệnh/i, /đặc\s+trị/i];
const BANNED_EN = [/\bcure[ds]?\b/i, /\btreat(?:s|ment|ing)?\b/i, /\bheal(?:s|ing)?\b/i, /\bdiagnos/i, /\bmiracle\b/i, /\bguaranteed\b/i, /\bdoctor-?approved\b/i];
// Folk-wisdom framing: at least one of these must appear in remedy text.
const FOLK_MARKERS_VI = [/dân gian/i, /kinh nghiệm/i, /ông bà/i, /xưa/i, /quan niệm/i, /bà tư/i, /mẹo/i];
const FOLK_MARKERS_EN = [/folk/i, /grandma/i, /old[- ]wives/i, /traditional/i, /home remed/i, /used to/i, /back in/i];

const isStr = (v) => typeof v === "string" && v.trim().length > 0;

const scanText = (file, field, text, locale) => {
  const banned = locale === "en" ? BANNED_EN : BANNED_VI;
  for (const re of banned) {
    if (re.test(text)) {
      err(file, `banned health claim in ${field}: "${text.slice(0, 80)}" (matched ${re})`);
    }
  }
};

const validateShortEpisode = async (file, ep) => {
  const locale = ep.locale ?? "vi";
  if (ep.kind !== undefined && !KINDS.has(ep.kind)) {
    err(file, `invalid kind "${ep.kind}" (one of ${[...KINDS].join(", ")})`);
  }
  const isStory = ep.kind === "story";
  const required = isStory
    ? ["slug", "channelTitle", "hook", "cta"]
    : ["slug", "channelTitle", "hook", "ingredientName", "remedy", "cta"];
  for (const f of required) {
    if (!isStr(ep[f])) err(file, `missing/empty required field "${f}"`);
  }
  if (isStory) {
    if (!Array.isArray(ep.storyParts) || ep.storyParts.length < 2 || ep.storyParts.length > 8 || !ep.storyParts.every(isStr)) {
      err(file, `"storyParts" must be an array of 2-8 non-empty strings (one audio file + scene per beat)`);
    } else if (ep.storyParts.length < 4) {
      warn(file, `only ${ep.storyParts.length} storyParts - a real tale wants 5-7 beats (~90-150s)`);
    }
    if (ep.moral !== undefined && !isStr(ep.moral)) {
      err(file, `"moral" must be a non-empty string when present`);
    }
    // Serialized tales: seriesTitle + seriesPart go together so the
    // uploader knows which playlist to file the video under.
    if (ep.seriesTitle !== undefined || ep.seriesPart !== undefined) {
      if (!isStr(ep.seriesTitle)) {
        err(file, `story episodes split into parts need a non-empty "seriesTitle" (the shared playlist name)`);
      }
      if (!Number.isInteger(ep.seriesPart) || ep.seriesPart < 1) {
        err(file, `"seriesPart" must be a positive integer (1 = first part)`);
      }
      if (ep.seriesTotal !== undefined && (!Number.isInteger(ep.seriesTotal) || ep.seriesTotal < ep.seriesPart)) {
        err(file, `"seriesTotal" must be an integer >= seriesPart`);
      }
    }
  } else if (!Array.isArray(ep.steps) || ep.steps.length === 0 || !ep.steps.every(isStr)) {
    err(file, `"steps" must be a non-empty string array`);
  }
  if (isStr(ep.slug) && ep.slug !== file.replace(/\.json$/, "")) {
    err(file, `slug "${ep.slug}" does not match filename`);
  }
  if (ep.locale !== undefined && !LOCALES.has(ep.locale)) {
    err(file, `invalid locale "${ep.locale}"`);
  }
  if (ep.category !== undefined) {
    const storyCats = STORY_CATEGORIES[locale] ?? new Set();
    if (!validCategoriesFor(locale).has(ep.category) && !(isStory && storyCats.has(ep.category))) {
      err(file, `category "${ep.category}" not in playlist-map.json${isStory ? " or the story-category list" : ""} for locale "${locale}"`);
    }
  } else {
    warn(file, `no category — episode won't be added to a playlist`);
  }
  if (ep.hookStyle !== undefined && !HOOK_STYLES.has(ep.hookStyle)) {
    err(file, `invalid hookStyle "${ep.hookStyle}" (one of ${[...HOOK_STYLES].join(", ")})`);
  }
  if (ep.caution !== undefined && !isStr(ep.caution)) {
    err(file, `"caution" must be a non-empty string when present`);
  }
  if (ep.images !== undefined) {
    if (!Array.isArray(ep.images) || !ep.images.every(isStr)) {
      err(file, `"images" must be a string array of public/ paths`);
    } else {
      for (const img of ep.images) {
        const p = path.join(root, "public", img.replace(/^\//, ""));
        try {
          await access(p);
        } catch {
          err(file, `image not found: public/${img}`);
        }
      }
    }
  }

  // Compliance: banned claims across visible text. `caution` is exempt —
  // it is the disclaimer field itself ("không lạm dụng thay thuốc" is
  // exactly what we want it to say).
  const fields = { hook: ep.hook, remedy: ep.remedy, cta: ep.cta, channelTitle: ep.channelTitle, moral: ep.moral };
  for (const [f, text] of Object.entries(fields)) {
    if (isStr(text)) scanText(file, f, text, locale);
  }
  if (Array.isArray(ep.steps)) {
    ep.steps.forEach((s, i) => isStr(s) && scanText(file, `steps[${i}]`, s, locale));
  }
  if (Array.isArray(ep.storyParts)) {
    ep.storyParts.forEach((s, i) => isStr(s) && scanText(file, `storyParts[${i}]`, s, locale));
  }

  // Folk-wisdom framing on the remedy body — the channel's legal cover.
  if (!isStory && isStr(ep.remedy)) {
    const markers = locale === "en" ? FOLK_MARKERS_EN : FOLK_MARKERS_VI;
    if (!markers.some((re) => re.test(ep.remedy))) {
      warn(file, `remedy lacks folk-wisdom framing ("dân gian"/"grandma"/"traditional") — add it to stay compliant`);
    }
  }
};

const validateLongForm = async (file, ep) => {
  if (!isStr(ep.slug)) err(file, `missing "slug"`);
  if (!Array.isArray(ep.beats) || ep.beats.length === 0) {
    err(file, `"beats" must be a non-empty array`);
    return;
  }
  ep.beats.forEach((b, i) => {
    if (!isStr(b?.text)) err(file, `beats[${i}].text missing`);
    if (!isStr(b?.speaker)) err(file, `beats[${i}].speaker missing`);
  });
  // AI scene stills must be real image files under public/images — a
  // missing path renders a black frame instead of falling back
  // procedurally, and an out-of-tree path (`../`) would silently pass a
  // bare access() check.
  for (const map of [ep.sceneImages ?? {}, ep.beatImages ?? {}]) {
    for (const [key, img] of Object.entries(map)) {
      if (!isStr(img)) {
        err(file, `image path for "${key}" must be a string`);
        continue;
      }
      const rel = img.replace(/^\//, "");
      // Reject `\` outright — on Windows it traverses like `/`, so a
      // segment check on `/` alone would miss `..\`.
      if (!rel.startsWith("images/") || rel.includes("\\") || rel.split("/").includes("..")) {
        err(file, `image path for "${key}" must stay inside public/images/: ${img}`);
        continue;
      }
      if (!/\.(jpe?g|png|webp)$/i.test(rel)) {
        err(file, `image path for "${key}" must be .jpg/.png/.webp: ${img}`);
        continue;
      }
      // Containment on resolved paths, not the string prefix.
      const publicDir = path.resolve(root, "public");
      const abs = path.resolve(publicDir, rel);
      const inside = path.relative(publicDir, abs);
      if (inside.startsWith("..") || path.isAbsolute(inside)) {
        err(file, `image path for "${key}" escapes public/: ${img}`);
        continue;
      }
      try {
        const st = await stat(abs);
        if (!st.isFile()) err(file, `scene image is not a file: public/${rel} (${key})`);
      } catch {
        err(file, `scene image not found: public/${rel} (${key})`);
      }
    }
  }
};

// ── scan directories ──────────────────────────────────────────────
const seenSlugs = new Map();
const episodeDir = path.join(root, "src/suckhoe/episodes");
const longFormDir = path.join(root, "src/suckhoe/long-form");

let shortCount = 0;
for (const file of (await readdir(episodeDir)).filter((f) => f.endsWith(".json")).sort()) {
  shortCount++;
  let ep;
  try {
    ep = JSON.parse(await readFile(path.join(episodeDir, file), "utf8"));
  } catch (e) {
    err(file, `invalid JSON: ${e.message}`);
    continue;
  }
  if (isStr(ep.slug)) {
    if (seenSlugs.has(ep.slug)) err(file, `duplicate slug "${ep.slug}" (also in ${seenSlugs.get(ep.slug)})`);
    seenSlugs.set(ep.slug, file);
  }
  await validateShortEpisode(file, ep);
}

let longCount = 0;
for (const file of (await readdir(longFormDir)).filter((f) => f.endsWith(".json")).sort()) {
  longCount++;
  try {
    await validateLongForm(file, JSON.parse(await readFile(path.join(longFormDir, file), "utf8")));
  } catch (e) {
    err(file, `invalid JSON: ${e.message}`);
  }
}

// ── report ────────────────────────────────────────────────────────
console.log(`Validated ${shortCount} episodes + ${longCount} long-form episodes`);
for (const w of warnings) console.warn(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length || (strict && warnings.length)) {
  console.error(`\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} warnings)` : ""}`);
