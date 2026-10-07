// ffmpeg binary resolution — same lookup order as ffprobe in
// audio-probe.mjs: explicit env override first (Windows dev machine
// needs a real build — the bundled compositor ffmpeg crashes here, see
// AGENTS.md), then system PATH, then the Remotion-bundled binary.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

let ffmpegPath;
export const findFfmpeg = () => {
  if (ffmpegPath !== undefined) return ffmpegPath;
  const envPath = process.env.FFMPEG_BIN;
  if (envPath) {
    try {
      execFileSync(envPath, ["-version"], { stdio: "ignore" });
      ffmpegPath = envPath;
      return ffmpegPath;
    } catch {
      console.warn(`FFMPEG_BIN="${envPath}" is not runnable — falling back`);
    }
  }
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    ffmpegPath = "ffmpeg";
    return ffmpegPath;
  } catch { /* not on PATH — try the bundled one */ }
  try {
    const scopeDir = path.resolve(
      import.meta.dirname,
      "..",
      "..",
      "node_modules",
      "@remotion"
    );
    for (const dir of readdirSync(scopeDir)) {
      if (!dir.startsWith("compositor-")) continue;
      const candidate = path.join(
        scopeDir,
        dir,
        process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
      );
      try {
        execFileSync(candidate, ["-version"], { stdio: "ignore" });
        ffmpegPath = candidate;
        return ffmpegPath;
      } catch { /* not this platform's binary */ }
    }
  } catch { /* no @remotion scope installed */ }
  ffmpegPath = null;
  return ffmpegPath;
};
