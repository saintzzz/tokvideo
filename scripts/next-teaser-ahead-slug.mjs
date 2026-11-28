// Picks the next long-form episode needing a teaser Short so the
// Shorts feed keeps getting fresh horror content even while the long
// render queue is backed up (owner directive: Shorts are the channel's
// growth engine — they must not starve when a long fails).
//
// Round 1 (variant=1): unpublished/any episode missing its `-teaser`.
// Round 2 (variant=2): every episode already has teaser-1 → emit the
// mid-episode "climax cut" (`-teaser2`) for an episode that has one —
// doubles Shorts inventory on the existing catalog without new
// writing. Published-long episodes sort first so the pinned-comment
// bridge works immediately.
//
// Output: slug=<s> variant=<1|2>  (slug empty when nothing to do)

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { freshLongLedger } from "./lib/fresh-ledger.mjs";
import { loadQuarantine, isBlocked } from "./lib/quarantine.mjs";
import { teaserKeyFor } from "./lib/teaser-keys.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const LONG_DIR = path.join(ROOT, "src", "suckhoe", "long-form");
const ledger = freshLongLedger();
const quarantine = loadQuarantine();

const slugs = readdirSync(LONG_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

const epInfo = (slug) => {
  const ep = JSON.parse(readFileSync(path.join(LONG_DIR, `${slug}.json`), "utf8"));
  if (ep.locale !== "vi") return null;
  if (!(ep.beats ?? []).every((b) => b.speaker === "narrator")) return null;

  const audioDir = path.join(ROOT, "public", "audio", "suckhoe-long", slug);
  const mp3s = existsSync(audioDir)
    ? readdirSync(audioDir).filter((f) => f.endsWith(".mp3")).length
    : 0;
  if (mp3s < 1) return null;

  const imgDir = path.join(ROOT, "public", "images", "suckhoe-long", slug);
  const hasImg =
    existsSync(imgDir) &&
    ["hook.jpg", "thumb.jpg", ...Object.values(ep.sceneImages ?? {})].some((p) =>
      existsSync(path.join(imgDir, path.basename(p)))
    );
  if (!hasImg) return null;

  return { slug, ep, mp3s, priority: ep.queuePriority ?? 999 };
};

const candidates = [];
for (const slug of slugs) {
  if (isBlocked(quarantine, slug, path.join(LONG_DIR, `${slug}.json`))) continue;
  const info = epInfo(slug);
  if (!info) continue;

  if (!ledger[teaserKeyFor(slug, 1)]?.videoId) {
    candidates.push({ ...info, variant: 1, published: false });
    continue;
  }
  // Round 2: climax cut needs >=5 committed beats past the 55% mark
  // (16-beat arc -> window starts at beat 8, so ~11+ mp3s).
  const startBeat = Math.floor(info.ep.beats.length * 0.55);
  if (
    !ledger[teaserKeyFor(slug, 2)]?.videoId &&
    info.mp3s - startBeat >= 5
  ) {
    candidates.push({
      ...info,
      variant: 2,
      published: !!ledger[slug]?.videoId,
    });
  }
}

candidates.sort(
  (a, b) =>
    a.variant - b.variant ||
    Number(b.published) - Number(a.published) ||
    a.priority - b.priority ||
    a.slug.localeCompare(b.slug),
);
const next = candidates[0];
console.log(next ? `slug=${next.slug} variant=${next.variant}` : "slug= variant=");
