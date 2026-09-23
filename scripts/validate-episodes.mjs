// Validates every episode JSON against the contract in src/suckhoe/types.ts
// PLUS the channel's YMYL compliance rules (previously prose-only in
// README). Runs in CI before any render/publish — a bad episode fails the
// build here, not inside a Remotion render or, worse, on the channel.
//
// Usage: node scripts/validate-episodes.mjs [--strict]
//   --strict also fails on warnings (e.g. missing caution field).

import { readdir, readFile, access } from "node:fs/promises";
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
  for (const f of ["slug", "channelTitle", "hook", "ingredientName", "remedy", "cta"]) {
    if (!isStr(ep[f])) err(file, `missing/empty required field "${f}"`);
  }
  if (!Array.isArray(ep.steps) || ep.steps.length === 0 || !ep.steps.every(isStr)) {
    err(file, `"steps" must be a non-empty string array`);
  }
  if (isStr(ep.slug) && ep.slug !== file.replace(/\.json$/, "")) {
    err(file, `slug "${ep.slug}" does not match filename`);
  }
  if (ep.locale !== undefined && !LOCALES.has(ep.locale)) {
    err(file, `invalid locale "${ep.locale}"`);
  }
  if (ep.category !== undefined && !validCategoriesFor(locale).has(ep.category)) {
    err(file, `category "${ep.category}" not in playlist-map.json for locale "${locale}"`);
  } else if (ep.category === undefined) {
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
  const fields = { hook: ep.hook, remedy: ep.remedy, cta: ep.cta, channelTitle: ep.channelTitle };
  for (const [f, text] of Object.entries(fields)) {
    if (isStr(text)) scanText(file, f, text, locale);
  }
  if (Array.isArray(ep.steps)) {
    ep.steps.forEach((s, i) => isStr(s) && scanText(file, `steps[${i}]`, s, locale));
  }

  // Folk-wisdom framing on the remedy body — the channel's legal cover.
  if (isStr(ep.remedy)) {
    const markers = locale === "en" ? FOLK_MARKERS_EN : FOLK_MARKERS_VI;
    if (!markers.some((re) => re.test(ep.remedy))) {
      warn(file, `remedy lacks folk-wisdom framing ("dân gian"/"grandma"/"traditional") — add it to stay compliant`);
    }
  }
};

const validateLongForm = (file, ep) => {
  if (!isStr(ep.slug)) err(file, `missing "slug"`);
  if (!Array.isArray(ep.beats) || ep.beats.length === 0) {
    err(file, `"beats" must be a non-empty array`);
    return;
  }
  ep.beats.forEach((b, i) => {
    if (!isStr(b?.text)) err(file, `beats[${i}].text missing`);
    if (!isStr(b?.speaker)) err(file, `beats[${i}].speaker missing`);
  });
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
    validateLongForm(file, JSON.parse(await readFile(path.join(longFormDir, file), "utf8")));
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
