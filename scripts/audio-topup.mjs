#!/usr/bin/env node
// Audio top-up: the long-form picker refuses to pick an episode until
// every beat-N.mp3 passes sanityCheckAudio, so any unpublished episode
// without committed audio silently stalls the queue forever. This
// script finds those episodes and synthesizes their audio: Node
// generate-voiceover (RESUME=1) first, Python edge-tts fallback when
// Node TTS is 403-blocked (CI IPs), then RESUME again so caption JSONs
// get written for the py-produced mp3s.
//
// Bounded to SLUG_CAP episodes per run so the 3-hourly watchdog job
// stays short; subsequent runs chip away at the rest.
//
// Usage: node scripts/audio-topup.mjs          # fix up to 3 episodes
//        SLUG_CAP=5 node scripts/audio-topup.mjs
//        node scripts/audio-topup.mjs <slug>   # one specific episode

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sanityCheckAudio } from "./lib/audio-probe.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SLUG_CAP = Number(process.env.SLUG_CAP || 3);

function loadJson(p) { return JSON.parse(readFileSync(p, "utf8")); }

function unpublished() {
  const ledger = loadJson(path.join(ROOT, "src/suckhoe/published-long.json"));
  const published = new Set(Object.keys(ledger));
  const src = readFileSync(path.join(ROOT, "src/suckhoe/long-form/index.ts"), "utf8");
  return [...src.matchAll(/from "\.\/([a-z0-9-]+)\.json"/g)]
    .map(m => m[1]).filter(s => !published.has(s) && !s.endsWith("-teaser"));
}

function audioHealth(slug) {
  const ep = loadJson(path.join(ROOT, "src/suckhoe/long-form", `${slug}.json`));
  const dir = path.join(ROOT, "public/audio/suckhoe-long", slug);
  let bad = 0;
  for (let i = 0; i < (ep.beats || []).length; i++) {
    const f = path.join(dir, `beat-${i}.mp3`);
    if (!existsSync(f) || !sanityCheckAudio(f).ok) bad++;
  }
  return { beats: (ep.beats || []).length, bad };
}

function tryCmd(label, cmd, args, env = {}) {
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env }, timeout: 20 * 60e3 });
    return true;
  } catch (e) {
    console.warn(`  ${label} failed (${e.message.slice(0, 120)})`);
    return false;
  }
}

const explicit = process.argv[2];
const targets = explicit ? [explicit] : unpublished()
  .map(s => ({ slug: s, ...audioHealth(s) }))
  .filter(x => x.bad > 0)
  .slice(0, SLUG_CAP)
  .map(x => x.slug);

if (!targets.length) { console.log("audio-topup: all unpublished episodes have healthy audio"); process.exit(0); }
console.log(`audio-topup: fixing ${targets.join(", ")}`);

let pipReady = false;
for (const slug of targets) {
  console.log(`== ${slug} ==`);
  const before = audioHealth(slug).bad;
  tryCmd("node-tts", "node", ["scripts/generate-voiceover.mjs", `suckhoe-long-${slug}`], { RESUME: "1" });
  if (audioHealth(slug).bad > 0) {
    if (!pipReady) {
      execSync("python3 -m pip install --quiet edge-tts", { stdio: "inherit" });
      pipReady = true;
    }
    tryCmd("py-tts", "python3", ["scripts/gen-voiceover-py.py", slug]);
    // mjs pass again so captions get written for the py-made mp3s
    tryCmd("node-captions", "node", ["scripts/generate-voiceover.mjs", `suckhoe-long-${slug}`], { RESUME: "1", CAPTION_ALIGN: "off" });
  }
  const after = audioHealth(slug).bad;
  console.log(`  ${slug}: bad beats ${before} -> ${after}${after === 0 ? " OK" : " (still deficient)"}`);
}
