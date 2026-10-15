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

const next = candidates[0];
if (next) {
  if (!ready(next.episode, next.slug)) {
    console.error(
      `Holding "${next.slug}" — committed audio incomplete; CI cannot synthesize (Edge TTS 403s runner IPs).`
    );
  } else {
    const latest = Object.values(ledger)
      .filter((e) => e?.videoId && e.publishedAt)
      .sort((a, b) => String(a.publishedAt).localeCompare(String(b.publishedAt)))
      .at(-1);
    const lastSlug = Object.entries(ledger).find(([, v]) => v === latest)?.[0];
    const continuingArc = lastSlug && arcOf(lastSlug) === arcOf(next.slug);
    if (continuingArc || arcStartsToday()) {
      console.log(next.slug);
    } else {
      console.error(
        `Holding new arc "${arcOf(next.slug)}" — arcs only start on the first daily slot (VN 05:00-08:59).`
      );
    }
  }
}
// Queue drained — empty stdout, callers should no-op.
