import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Prints the next unpublished long-form slug to stdout (empty output =
// queue drained). "Published" means present in published-long.json with
// a videoId — the ledger upload-youtube-long.mjs writes after every
// successful insert. Ordering follows filename sort so tap-01 lands
// before tap-02 of the same series.
//
// Usage: SLUG=$(node scripts/next-long-form-slug.mjs)

const root = path.join(import.meta.dirname, "..");
const longFormDir = path.join(root, "src", "suckhoe", "long-form");
const ledgerPath = path.join(root, "src", "suckhoe", "published-long.json");

const ledger = existsSync(ledgerPath)
  ? JSON.parse(await readFile(ledgerPath, "utf8"))
  : {};

const files = (await readdir(longFormDir)).filter((f) => f.endsWith(".json")).sort();
const candidates = [];
for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  if (ledger[slug]?.videoId) continue;
  // Skip the legacy remedy fact-check format (grandma/granddaughter
  // dialogue) — the channel publishes narrator-only story arcs now.
  // Same isStory rule as upload-youtube-long.mjs.
  const episode = JSON.parse(await readFile(path.join(longFormDir, f), "utf8"));
  if (!episode.beats?.every((b) => b.speaker === "narrator")) continue;
  candidates.push({ slug, priority: episode.queuePriority ?? 99 });
}
// queuePriority (lower first) overrides filename order — the Giếng Củ
// arc carries priority 1 so it finishes before the xianxia pilots.
candidates.sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug));
if (candidates.length) console.log(candidates[0].slug);
// Queue drained — empty stdout, callers should no-op.
