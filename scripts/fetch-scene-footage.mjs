// Fetches real motion footage per scene for long-form episodes — the
// upgrade over Ken-Burns-only stills (OpenMontage-style: free stock
// clips instead of animating images). Writes clips to
// public/videos/suckhoe-long/<slug>/<scene>.mp4 and records them in the
// episode's `sceneVideos` map; LongFormSceneBackground prefers a clip
// over a still when one exists.
//
// Sources, in order:
//   1. Pexels Videos API — needs PEXELS_API_KEY env (free, no card).
//      Best quality/relevance. 200 req/hr free tier.
//   2. Internet Archive — keyless. Public-domain stock/archival clips;
//      hit-or-miss on modern horror looks but works with zero setup.
//
// Usage:
//   PEXELS_API_KEY=xxx node scripts/fetch-scene-footage.mjs <slug> [...]
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

// -- Pexels ---------------------------------------------------------------
const pexelsSearch = async (query) => {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!res.ok) throw new Error(`pexels ${res.status}`);
  const json = await res.json();
  // Prefer 10-30s HD clips; pick the largest hd file that isn't gigantic.
  for (const v of json.videos ?? []) {
    if (v.duration < 6 || v.duration > 60) continue;
    const file = (v.video_files ?? [])
      .filter((f) => f.quality === "hd" || f.quality === "sd")
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
    if (file) return { url: file.link, id: v.id };
  }
  return null;
};

// -- Internet Archive (keyless) -------------------------------------------
const iaSearch = async (query) => {
  const q = encodeURIComponent(`${query} AND mediatype:movies`);
  const res = await fetch(
    `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier&rows=6&output=json&sort[]=downloads+desc`,
    { signal: AbortSignal.timeout(30_000) }
  );
  if (!res.ok) throw new Error(`archive.org ${res.status}`);
  const json = await res.json();
  for (const doc of json.response?.docs ?? []) {
    const meta = await fetch(`https://archive.org/metadata/${doc.identifier}`);
    const mjson = await meta.json();
    const mp4 = (mjson.files ?? []).find(
      (f) => f.name.endsWith(".mp4") && !f.name.includes("thumbs")
    );
    if (mp4) {
      return {
        url: `https://archive.org/download/${doc.identifier}/${mp4.name}`,
        id: doc.identifier,
      };
    }
  }
  return null;
};

const download = async (url, outFile) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100_000) throw new Error(`clip too small (${buf.length}B)`);
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
        if (PEXELS_KEY) found = await pexelsSearch(q);
        if (!found) found = await iaSearch(q);
        if (found) break;
      } catch (err) {
        console.warn(`search "${q}" failed: ${err.message}`);
      }
    }
    if (!found) {
      console.warn(`no footage for ${ep.slug} [${scene}]`);
      continue;
    }
    try {
      const bytes = await download(found.url, outFile);
      sceneVideos[scene] = rel;
      console.log(`wrote ${rel} (${(bytes / 1e6).toFixed(1)}MB) <- ${found.id ?? found.url.slice(0, 60)}`);
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
