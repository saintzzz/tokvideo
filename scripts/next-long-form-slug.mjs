import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { sanityCheckAudio } from "./lib/audio-probe.mjs";

// Prints the next unpublished long-form slug to stdout (empty output =
// queue drained). "Published" means present in published-long.json with
// a videoId — the ledger upload-youtube-long.mjs writes after every
// successful insert. Ordering follows filename sort so tap-01 lands
// before tap-02 of the same series.
//
// Arc-atomicity rule (owner directive 2026-10-13): a whole arc ships in
// ONE day across the six daily publish ticks. A mid-arc episode is
// always eligible. An episode that STARTS a new arc (its arc prefix
// differs from the most recently published episode's) is only eligible
// during the first daily slot (VN 05:00-08:59); later ticks skip, so
// the arc can never straddle two days.
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
  candidates.push({ slug, priority: episode.queuePriority ?? 99, episode });
}
// queuePriority (lower first) overrides filename order — the Giếng Củ
// arc carries priority 1 so it finishes before the xianxia pilots.
candidates.sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug));

const arcOf = (slug) => slug.replace(/-tap-\d+$/, "");
const arcStartsToday = () => {
  // VN (UTC+7, no DST) hour of the current tick — the first daily slot
  // is 05:30 VN, so arcs may only begin while vnHour < 9.
  // ALLOW_ARC_ANYTIME=1 is the manual escape hatch for when GitHub
  // drops/delays the sole arc-start tick — use via workflow_dispatch
  // only, never on the schedule.
  if (process.env.ALLOW_ARC_ANYTIME === "1") return true;
  const vnHour = (new Date().getUTCHours() + 7) % 24;
  return vnHour >= 5 && vnHour < 9;
};

// Readiness gate (2026-10-15): an episode is only pickable when every
// beat has a committed, sanity-passing mp3. Edge TTS 403s GitHub
// Actions IPs, so CI cannot synthesize missing audio — it can only
// reuse what's in the repo. Picking an episode with incomplete audio
// used to let the voiceover step run a healthcheck, hit 403, and fail
// the whole run red (beat-46 of dung-tra-loi-tap-03 was committed as
// a 0-byte file mid-write and did exactly that). Holding instead turns
// the same state into a green no-op and the next tick retries.
const audioDir = (slug) =>
  path.join(root, "public", "audio", "suckhoe-long", slug);
const ready = (episode, slug) =>
  episode.beats.every((_, i) =>
    sanityCheckAudio(path.join(audioDir(slug), `beat-${i}.mp3`)).ok
  );

// 2026-11-07 starvation bug: candidates are alphabetical, so after
// mieu-hoang-tap-01 published, EVERY later tick evaluated cau-khi-tap-01
// (alphabetically first), held it as a new arc outside the window, and
// never reached the eligible mieu-hoang-tap-02 behind it - a whole
// publish day went empty. Evaluate ALL candidates in order and pick the
// first ELIGIBLE one: the in-flight arc always wins, new arcs only in
// the morning window.
const latest = Object.entries(ledger)
  // -teaser/-fb ledger entries are derived artifacts, not episodes —
  // if one is the newest publishedAt the arc match below breaks and
  // every mid-arc episode gets held as a "new arc" (first seen
  // 2026-11-05 after the interleaved publish added teaser keys).
  .filter(([k, e]) => !/-(teaser|fb)$/.test(k) && e?.videoId && e.publishedAt)
  .sort((a, b) => String(a[1].publishedAt).localeCompare(String(b[1].publishedAt)))
  .at(-1)?.[1];
const lastSlug = Object.entries(ledger).find(([, v]) => v === latest)?.[0];
const activeArc = lastSlug ? arcOf(lastSlug) : null;
const canStartArc = arcStartsToday();

let picked = null;
for (const c of candidates) {
  const continuing = activeArc && arcOf(c.slug) === activeArc;
  if (!continuing && !canStartArc) continue; // new arc outside window
  if (!ready(c.episode, c.slug)) {
    console.error(`Skipping "${c.slug}" — committed audio incomplete (CI cannot synthesize, Edge TTS 403s runner IPs).`);
    continue;
  }
  picked = c.slug;
  break;
}

if (picked) {
  console.log(picked);
} else if (candidates.length) {
  const holds = candidates.filter((c) => !(activeArc && arcOf(c.slug) === activeArc));
  console.error(
    holds.length
      ? `Holding new arc "${arcOf(holds[0].slug)}" — arcs only start on the first daily slot (VN 05:00-08:59).`
      : `Holding "${candidates[0].slug}" — committed audio incomplete; CI cannot synthesize.`
  );
}
// Queue drained — empty stdout, callers should no-op.
// Queue drained — empty stdout, callers should no-op.
