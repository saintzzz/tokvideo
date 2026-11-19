// Picks the next long-form episode that is unpublished AND has no teaser
// Short yet, so the Shorts feed keeps getting fresh horror content even
// while the long render queue is backed up (owner directive: Shorts are
// the channel's growth engine — they must not starve when a long fails).
// Requires committed audio beats + a thumbnail so make-long-teaser can
// run pure-ffmpeg on CI.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const LONG_DIR = path.join(ROOT, "src", "suckhoe", "long-form");
const ledgerPath = path.join(ROOT, "src", "suckhoe", "published-long.json");
const ledger = existsSync(ledgerPath)
  ? JSON.parse(readFileSync(ledgerPath, "utf8"))
  : {};

const slugs = readdirSync(LONG_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

const candidates = [];
for (const slug of slugs) {
  if (ledger[`${slug}-teaser`]?.videoId) continue;

  const ep = JSON.parse(readFileSync(path.join(LONG_DIR, `${slug}.json`), "utf8"));
  if (ep.locale !== "vi") continue;
  if (!(ep.beats ?? []).every((b) => b.speaker === "narrator")) continue;

  const audioDir = path.join(ROOT, "public", "audio", "suckhoe-long", slug);
  if (!existsSync(audioDir)) continue;
  const beats = readdirSync(audioDir).filter((f) => f.endsWith(".mp3")).length;
  if (beats < 1) continue;

  const imgDir = path.join(ROOT, "public", "images", "suckhoe-long", slug);
  const hasImg =
    existsSync(imgDir) &&
    ["hook.jpg", "thumb.jpg", ...Object.values(ep.sceneImages ?? {})].some((p) =>
      existsSync(path.join(imgDir, path.basename(p)))
    );
  if (!hasImg) continue;

  candidates.push({ slug, priority: ep.queuePriority ?? 999 });
}

candidates.sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug));
const next = candidates[0]?.slug ?? "";
console.log(next ? `slug=${next}` : "slug=");
