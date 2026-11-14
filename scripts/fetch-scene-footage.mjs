// Fetches real motion footage per scene for long-form episodes — the
// upgrade over Ken-Burns-only stills (OpenMontage-style: free stock
// clips instead of animating images). Writes clips to
// public/videos/suckhoe-long/<slug>/<scene>.mp4 and records them in the
// episode's `sceneVideos` map; LongFormSceneBackground prefers a clip
// over a still when one exists.
//
// Sources, in order:
//   1. Pixabay Videos API — needs PIXABAY_API_KEY env (free, no card).
//      Good horror-adjacent coverage (fog, rain, candles, forest).
//   2. Pexels Videos API — needs PEXELS_API_KEY env (free, no card).
//      Best quality/relevance. 200 req/hr free tier.
//   3. Internet Archive — keyless. Public-domain stock/archival clips;
//      hit-or-miss on modern horror looks but works with zero setup.
//
// Usage:
//   PIXABAY_API_KEY=xxx node scripts/fetch-scene-footage.mjs <slug> [...]
//   node scripts/fetch-scene-footage.mjs --keywords <slug>   # dry-run
//   FORCE=1 ...                                            # re-download
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const longFormDir = path.join(root, "src", "suckhoe", "long-form");
const args = process.argv.slice(2);
const dryRun = args.includes("--keywords");
const force = !!process.env.FORCE;
const requested = args.filter((a) => !a.startsWith("--"));
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY;

// English search queries per scene vibe. The scenePrompts are English
// already, but they read like image prompts; stock search wants 2-4
// word noun phrases. Keep a keyword map per scene name plus a generic
// fallback derived from the prompt text.
const SCENE_KEYWORDS = {
  hook: ["misty river night", "dark fog water", "spooky night"],
  "flooded-village": ["flood water village", "monsoon flooding", "river flood"],
  "river-bank": ["river bank fog", "muddy river", "dark river water"],
  "village-meeting": ["candle light dark room", "oil lamp flickering"],
  "coffin-closeup": ["old wooden coffin", "dark wood texture", "candle coffin"],
  "hieu-house": ["rain window night", "old house night", "lamp window dark"],
  "night-window": ["rain window night", "dark window night", "fog window"],
  "knocking-dark": ["dark water night", "black river night", "fog night"],
  "coffin-inside": ["old fabric dark", "candle flame dark"],
  "wooden-tablet": ["candle flame closeup", "oil lamp dark"],
  "chief-shock": ["old man silhouette dark", "candle light face"],
  "bonfire-attempt": ["bonfire night", "fire flames dark", "torch fire"],
  "black-ooze": ["black liquid", "dark water dripping", "smoke dark"],
  "clan-house-night": ["incense burning", "candles temple", "incense smoke"],
  "river-return": ["misty river dawn", "fog river morning", "grey river"],
  "blind-aunt": ["oil lamp dark room", "old woman silhouette"],
  "toolbox-attic": ["dusty attic", "cobweb dark", "old tools dark"],
  "secret-letter": ["candle letter dark", "old paper candle"],
  "flood-memory": ["storm rain night", "heavy rain", "flood night"],
  "seven-graves": ["fog cemetery", "dark graveyard fog", "mist graves"],
  "well-approach": ["fog field night", "lantern walking dark", "mist night"],
  "water-in-well": ["dark water well", "water surface dark", "deep water"],
  "bronze-locket": ["candle hands dark", "old metal closeup"],
  "door-coffin": ["dark door night", "old door dark"],
  "village-houses": ["village night fog", "dark houses night"],
  "village-gathering": ["people night candles", "lantern crowd night"],
  "return-goods": ["candles offerings", "incense altar night"],
  "mother-son": ["lamp kitchen dark", "candle two people dark"],
  "empty-chest": ["dark empty box", "old wooden box"],
  "river-night": ["river night moon", "dark river boat", "night water boat"],
  "old-witch-house": ["abandoned house dark", "ruins fog", "derelict hut"],
  "amulet-box": ["candle old object", "metal box dark"],
  "digging-grave": ["shovel digging night", "digging dark soil"],
  "bones-with-amulet": ["candle ritual dark", "incense dark hands"],
  "midnight-river": ["boat dark water night", "lantern boat river", "fog river night"],
  "chief-return": ["incense temple dawn", "old man silhouette dawn"],
  "village-dawn": ["village sunrise mist", "fog morning village", "dawn river mist"],
};

const keywordsFor = (scene, prompt) =>
  SCENE_KEYWORDS[scene] ??
  [prompt.split(/\s+/).slice(0, 4).join(" "), prompt.split(/\s+/).slice(0, 3).join(" ")];

// -- Pixabay (free API key) -----------------------------------------------
// Pixabay fronts its API with Cloudflare bot checks that intermittently
// return the "Just a moment" HTML page (200, not an error status). Retry
// a few times with backoff — the challenge window usually clears.
// Pixabay returns loosely-related hits for multi-word queries — observed
// 2026-11-14: "beam multi cloth" returned an astronaut + eclipse clip that
// shipped inside a folk-horror episode (tag overlap 1 on "beam"). Gate:
// >=2 keyword overlaps for multi-word queries, plus an off-genre tag
// blocklist so space/sci-fi/corporate stock can never land in a horror
// episode regardless of wording.
const QUERY_STOP = new Set([
  "the", "and", "for", "with", "from", "into", "over", "under", "through",
]);
const OFF_GENRE_TAGS = [
  "space", "astronaut", "eclipse", "galaxy", "nasa", "ufo", "alien",
  "robot", "cyber", "hologram", "sci-fi", "corporate", "office",
  "smartphone", "technology", "neon city", "futuristic",
];
const queryWords = (q) =>
  q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !QUERY_STOP.has(w));

const pixabaySearch = async (query, used) => {
  const qws = queryWords(query);
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(
      `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=10&safesearch=true`,
      { signal: AbortSignal.timeout(30_000) }
    );
    const text = await res.text();
    if (text.includes("Just a moment")) {
      await new Promise((r) => setTimeout(r, 8000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`pixabay ${res.status}`);
    const json = JSON.parse(text);
    const minOverlap = Math.min(2, Math.max(1, qws.length));
    let best = null;
    for (const hit of json.hits ?? []) {
      if (hit.duration < 5 || hit.duration > 60) continue;
      const id = `pixabay-${hit.id}`;
      if (used.has(id)) continue;
      const tags = (hit.tags ?? "").toLowerCase();
      if (OFF_GENRE_TAGS.some((t) => tags.includes(t) && !qws.some((w) => t.includes(w)))) continue;
      const overlap = qws.filter((w) => tags.includes(w)).length;
      if (overlap < minOverlap) continue;
      if (!best || overlap > best.overlap) best = { hit, id, overlap };
    }
    if (best) {
      // Prefer medium quality — large is often needlessly heavy for a
      // background layer under captions/dim overlays.
      const file = best.hit.videos?.medium ?? best.hit.videos?.large ?? best.hit.videos?.small;
      if (file?.url) return { url: file.url, id: best.id };
    }
    return null;
  }
  throw new Error("pixabay blocked by bot challenge");
};

// -- Pexels ---------------------------------------------------------------
const pexelsSearch = async (query, used) => {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!res.ok) throw new Error(`pexels ${res.status}`);
  const json = await res.json();
  // Prefer 10-30s HD clips; pick the largest hd file that isn't gigantic.
  for (const v of json.videos ?? []) {
    if (v.duration < 6 || v.duration > 60) continue;
    const id = `pexels-${v.id}`;
    if (used.has(id)) continue;
    const file = (v.video_files ?? [])
      .filter((f) => f.quality === "hd" || f.quality === "sd")
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
    if (file) return { url: file.link, id };
  }
  return null;
};

// -- Wikimedia Commons (keyless) -------------------------------------------
// Atmospheric clips (fog timelapses, rain, candles, forests) live in the
// File namespace. No API key needed; prefers mp4, accepts webm/ogv since
// Remotion renders in Chrome.
const wmcSearch = async (query, used) => {
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=10`,
    { signal: AbortSignal.timeout(30_000) }
  );
  if (!res.ok) throw new Error(`wikimedia ${res.status}`);
  const json = await res.json();
  const files = (json.query?.search ?? [])
    .map((s) => s.title)
    .filter((t) => /\.(mp4|webm|ogv)$/i.test(t));
  for (const title of files) {
    if (used.has(title)) continue;
    const info = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=videoinfo&viprop=url|extmetadata&format=json`,
      { signal: AbortSignal.timeout(30_000) }
    );
    const ij = await info.json();
    const page = Object.values(ij.query?.pages ?? {})[0];
    const url = page?.videoinfo?.[0]?.url;
    if (url) {
      const ext = title.match(/\.(mp4|webm|ogv)$/i)[1];
      return { url, id: title, ext };
    }
  }
  return null;
};

// -- Internet Archive (keyless) -------------------------------------------
const iaSearch = async (query, used) => {
  const q = encodeURIComponent(`${query} AND mediatype:movies`);
  const res = await fetch(
    `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier&rows=6&output=json&sort[]=downloads+desc`,
    { signal: AbortSignal.timeout(30_000) }
  );
  if (!res.ok) throw new Error(`archive.org ${res.status}`);
  const json = await res.json();
  for (const doc of json.response?.docs ?? []) {
    if (used.has(doc.identifier)) continue;
    const meta = await fetch(`https://archive.org/metadata/${doc.identifier}`);
    const mjson = await meta.json();
    // Items sorted by downloads are often full feature films — the first
    // mp4 was 100-500MB of unrelated movie footage (observed 2026-11-14:
    // a 1938 propaganda film inside a ghost story). Only accept real
    // clips: smallest mp4 under 150MB, preferring derivative encodes.
    const mp4s = (mjson.files ?? []).filter(
      (f) => f.name.endsWith(".mp4") && !f.name.includes("thumbs") && Number(f.size ?? 0) < 150e6
    );
    if (!mp4s.length) continue;
    const mp4 = mp4s.sort((a, b) => Number(a.size ?? 0) - Number(b.size ?? 0))[0];
    return {
      url: `https://archive.org/download/${doc.identifier}/${mp4.name}`,
      id: doc.identifier,
    };
  }
  return null;
};

const download = async (url, outFile) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100_000) throw new Error(`clip too small (${buf.length}B)`);
  // A scene needs 5-20s of b-roll; anything past ~60MB is a movie, not a
  // clip (ThisChar1950's 79MB undecodable archive film, 2026-11-14).
  if (buf.length > 60e6) throw new Error(`clip too large (${(buf.length / 1e6).toFixed(0)}MB)`);
  await writeFile(outFile, buf);
  return buf.length;
};

const files = (await import("node:fs/promises")).readdir;
for (const file of (await files(longFormDir)).filter((f) => f.endsWith(".json"))) {
  const jsonPath = path.join(longFormDir, file);
  const ep = JSON.parse(await readFile(jsonPath, "utf8"));
  if (requested.length && !requested.includes(ep.slug)) continue;
  const scenes = Object.keys(ep.scenePrompts ?? {});
  if (!scenes.length) continue;

  const outDir = path.join(root, "public", "videos", "suckhoe-long", ep.slug);
  await mkdir(outDir, { recursive: true });
  const sceneVideos = { ...(ep.sceneVideos ?? {}) };
  // Clips already chosen this episode — avoids two scenes showing the
  // same stock video, which reads as a cheap repeat.
  const used = new Set();

  for (const scene of scenes) {
    const rel = `videos/suckhoe-long/${ep.slug}/${scene}.mp4`;
    const outFile = path.join(outDir, `${scene}.mp4`);
    if (!force && existsSync(outFile)) {
      sceneVideos[scene] = rel;
      console.log(`exists ${rel}`);
      continue;
    }
    const kws = keywordsFor(scene, ep.scenePrompts[scene]);
    if (dryRun) {
      console.log(`${ep.slug} [${scene}]: ${kws.join(" | ")}`);
      continue;
    }
    let found = null;
    for (const q of kws) {
      try {
        if (PIXABAY_KEY) found = await pixabaySearch(q, used);
        if (!found && PEXELS_KEY) found = await pexelsSearch(q, used);
        if (!found) found = await wmcSearch(q, used);
        // Internet Archive was removed from the chain on 2026-11-14:
        // even with size filters it shipped TWO unrelated feature-film
        // incidents (1938 propaganda movie, ThisChar1950) and a codec
        // Chrome could not decode, killing the render mid-run. Stills
        // fallback beats random archive footage every time.
        // if (!found) found = await iaSearch(q, used);
        if (found) break;
      } catch (err) {
        console.warn(`search "${q}" failed: ${err.message}`);
      }
    }
    if (!found) {
      console.warn(`no footage for ${ep.slug} [${scene}]`);
      continue;
    }
    const ext = found.ext ?? "mp4";
    const relExt = `videos/suckhoe-long/${ep.slug}/${scene}.${ext}`;
    const outFileExt = path.join(outDir, `${scene}.${ext}`);
    try {
      const bytes = await download(found.url, outFileExt);
      used.add(found.id);
      sceneVideos[scene] = relExt;
      console.log(`wrote ${relExt} (${(bytes / 1e6).toFixed(1)}MB) <- ${found.id ?? found.url.slice(0, 60)}`);
    } catch (err) {
      console.warn(`download failed ${scene}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!dryRun && Object.keys(sceneVideos).length) {
    ep.sceneVideos = sceneVideos;
    await writeFile(jsonPath, JSON.stringify(ep, null, 2) + "\n");
    console.log(`updated ${file}: sceneVideos[${Object.keys(sceneVideos).length}]`);
  }
}
console.log("Done.");
