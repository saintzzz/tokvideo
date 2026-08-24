import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

// Runs hourly via Task Scheduler (SucKhoePublishCatchup's sibling for the
// animated-film track). Pure orchestration, no Claude CLI involved:
//   1. For any uploaded-but-not-yet-approved episode, check YouTube — if
//      the channel owner flipped it public themselves, that's the
//      explicit go-ahead ("neu may thay video do chuyen sang public thi
//      xem nhu la tao ok, tu tao tiep cac video tiep theo") to keep going.
//   2. If a render is in progress (a lock file recording its PID),
//      leave it alone unless the process has actually exited, in which
//      case run the mux+upload step for it and clear the lock.
//   3. If nothing is rendering AND the most recent published episode
//      (if any) has been approved, kick off the NEXT scripted episode:
//      generate its voiceover if missing (fast), then spawn a DETACHED
//      headless Blender render (multi-hour — this script does not wait
//      for it) and write a lock file so future ticks know it's running.
//
// Target cadence (channel owner, 2026-08-24): ~3 published episodes/day.
// Actual throughput is gated on how fast episodes get approved, not
// just render speed — this script never renders more than one episode
// ahead of the last approval.

const repoRoot = path.join(import.meta.dirname, "..");
const lockPath = path.join(repoRoot, "blender", ".render-lock.json");
const producedPath = path.join(repoRoot, "src", "animated-film", "produced.json");
const blenderExe = "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe";

function isPidRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function checkApprovals(produced) {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    console.log("YouTube credentials not set, skipping approval check.");
    return false;
  }
  const oauth2Client = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  let changed = false;
  for (const entry of produced.published || []) {
    if (entry.approvedAt) continue;
    try {
      const res = await youtube.videos.list({ part: ["status"], id: [entry.videoId] });
      const status = res.data.items?.[0]?.status?.privacyStatus;
      console.log(`[episode ${entry.episode}] videoId=${entry.videoId} privacyStatus=${status}`);
      if (status === "public") {
        entry.approvedAt = new Date().toISOString();
        console.log(`[episode ${entry.episode}] APPROVED (channel owner made it public), clear to continue.`);
        changed = true;
      }
    } catch (err) {
      console.error(`[episode ${entry.episode}] failed to check status: ${err.message ?? err}`);
    }
  }
  return changed;
}

const produced = JSON.parse(await readFile(producedPath, "utf8"));
let dirty = await checkApprovals(produced);

// --- Handle an in-progress or just-finished render ------------------------
if (existsSync(lockPath)) {
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  if (isPidRunning(lock.pid)) {
    console.log(`Render still in progress: episode ${lock.episode} (pid ${lock.pid}, started ${lock.startedAt}).`);
    if (dirty) writeFileSync(producedPath, JSON.stringify(produced, null, 2) + "\n");
    process.exit(0);
  }

  console.log(`Render process for episode ${lock.episode} has exited, muxing and uploading.`);
  await new Promise((resolve) => {
    const child = spawn("node", ["scripts/animated-film-mux-upload.mjs", String(lock.episode)], {
      cwd: repoRoot,
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", resolve);
  });
  unlinkSync(lockPath);
  dirty = true;
  // Re-read produced.json since the mux-upload script just wrote to it.
  Object.assign(produced, JSON.parse(await readFile(producedPath, "utf8")));
}

if (dirty) writeFileSync(producedPath, JSON.stringify(produced, null, 2) + "\n");

// --- Decide whether to start the next episode -----------------------------
if (existsSync(lockPath)) {
  console.log("A render just started or is queued, nothing more to do this tick.");
  process.exit(0);
}

const publishedList = produced.published || [];
const latestPublished = publishedList[publishedList.length - 1];
if (latestPublished && !latestPublished.approvedAt) {
  console.log(`Episode ${latestPublished.episode} is uploaded but not yet approved (still private), waiting.`);
  process.exit(0);
}

const episodesDir = path.join(repoRoot, "src", "animated-film", "episodes");
const scriptedEpisodes = readdirSync(episodesDir)
  .filter((f) => f.match(/^ep-(\d+)-/))
  .map((f) => Number(f.match(/^ep-(\d+)-/)[1]))
  .sort((a, b) => a - b);

const renderedSet = new Set(produced.rendered || []);
const nextEpisode = scriptedEpisodes.find((n) => !renderedSet.has(n));

if (nextEpisode === undefined) {
  console.log("No new scripted episode ready to render yet, waiting on AnimatedFilmEpisodeWriter.");
  process.exit(0);
}

console.log(`Starting production for episode ${nextEpisode}...`);

// Ensure voiceover exists (fast — runs synchronously in this tick).
await new Promise((resolve, reject) => {
  const child = spawn("node", ["scripts/generate-voiceover.mjs", "animated-film"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`generate-voiceover exited ${code}`))));
});

// Spawn the render as a fully detached background process — this tick
// does NOT wait for it (it can take hours). A future tick picks up the
// result once the lock's PID has exited.
const paddedNum = String(nextEpisode).padStart(2, "0");
const episodeFile = readdirSync(episodesDir).find((f) => f.startsWith(`ep-${paddedNum}-`));
const episodeSlug = episodeFile.replace(/\.json$/, "");
const outDir = path.join(repoRoot, "blender", "out", `ep${paddedNum}_full`).replace(/\\/g, "/");
const logPath = path.join(repoRoot, "blender", `ep${paddedNum}_full_render.log`);

const pythonExpr = [
  "import sys, os",
  `sys.path.insert(0, os.path.join(r'${repoRoot}', 'blender'))`,
  "from scene_assembler import render_full",
  `render_full(r'${path.join(episodesDir, episodeFile)}', out_dir=r'${outDir}')`,
].join("\n");

const child = spawn(
  "cmd.exe",
  ["/c", blenderExe, "-b", "--python-expr", pythonExpr, ">", logPath, "2>&1"],
  { cwd: repoRoot, detached: true, stdio: "ignore", windowsHide: true }
);
child.unref();

writeFileSync(
  lockPath,
  JSON.stringify({ episode: nextEpisode, slug: episodeSlug, pid: child.pid, startedAt: new Date().toISOString() }, null, 2)
);
console.log(`Spawned detached render for episode ${nextEpisode} (pid ${child.pid}), log at ${logPath}`);
