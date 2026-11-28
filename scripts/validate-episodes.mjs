// Validates every long-form episode JSON against the channel contract.
// Runs in CI before any render/publish — a bad episode fails the build
// here, not inside a Remotion render or, worse, on the channel.
//
// Usage: node scripts/validate-episodes.mjs [--strict]

import { readdir, readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const strict = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const isStr = (v) => typeof v === "string" && v.trim().length > 0;

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
        else await assertTracked(file, rel, key);
      } catch {
        err(file, `scene image not found: public/${rel} (${key})`);
      }
    }
  }
  // sceneVideos must point at committed .mp4 files under public/videos.
  // Local-only files (downloaded but never pushed) crash CI renders at
  // the frame they appear with a 404 MediaPlaybackError — caught here
  // via git tracking, not just fs existence.
  for (const [key, vid] of Object.entries(ep.sceneVideos ?? {})) {
    if (!isStr(vid)) {
      err(file, `scene video for "${key}" must be a string`);
      continue;
    }
    const rel = vid.replace(/^\//, "");
    if (!rel.startsWith("videos/") || rel.includes("\\") || rel.split("/").includes("..")) {
      err(file, `scene video for "${key}" must stay inside public/videos/: ${vid}`);
      continue;
    }
    if (!/\.mp4$/i.test(rel)) {
      err(file, `scene video for "${key}" must be .mp4: ${vid}`);
      continue;
    }
    const publicDir = path.resolve(root, "public");
    const abs = path.resolve(publicDir, rel);
    const inside = path.relative(publicDir, abs);
    if (inside.startsWith("..") || path.isAbsolute(inside)) {
      err(file, `scene video for "${key}" escapes public/: ${vid}`);
      continue;
    }
    try {
      const st = await stat(abs);
      if (!st.isFile()) err(file, `scene video is not a file: public/${rel} (${key})`);
      else await assertTracked(file, rel, key);
    } catch {
      err(file, `scene video not found: public/${rel} (${key})`);
    }
  }
};

// A file that exists on disk but is not tracked by git will be missing
// on the CI checkout — every crash in the Nov-2026 failure chain traced
// back to exactly this gap (uncommitted audio, uncommitted footage).
const assertTracked = async (file, rel, key) => {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", `public/${rel}`], {
      cwd: root,
      stdio: "pipe",
    });
  } catch {
    err(
      file,
      `asset exists but is NOT committed — CI render would 404: public/${rel} (${key}). Run: git add -f public/${rel}`
    );
  }
};

// ── scan directories ──────────────────────────────────────────────
const longFormDir = path.join(root, "src/suckhoe/long-form");

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
console.log(`Validated ${longCount} long-form episodes`);
for (const w of warnings) console.warn(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length || (strict && warnings.length)) {
  console.error(`\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} warnings)` : ""}`);
