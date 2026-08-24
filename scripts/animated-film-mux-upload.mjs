import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";

// Takes ONE fully-rendered animated-film episode (a continuous PNG frame
// sequence under blender/out/ep<NN>_full/, produced by
// blender/scene_assembler.py's render_full) and:
//   1. concatenates every beat's real generated audio (in order) into
//      one track matching the frame sequence exactly (render_full sized
//      each beat's frame count from that same audio file, so this is
//      always in sync by construction)
//   2. encodes frames + audio into the final mp4 via the ffmpeg binary
//      the Remotion pipeline already bundles (no extra install)
//   3. uploads it to YouTube as PRIVATE (channel owner reviews there,
//      flips to public themselves when satisfied)
//   4. records the result in src/suckhoe/../src/animated-film/produced.json
//
// Usage: node scripts/animated-film-mux-upload.mjs <episode-number> [frames-dir-override]
// The override exists only because episode 1's render was kicked off by
// hand before this pipeline existed, into blender/out/ep01_full_v2
// instead of the standard blender/out/ep01_full this script (and every
// episode from 2 onward, via animated-film-pipeline-tick.mjs) expects.

const repoRoot = path.join(import.meta.dirname, "..");
const FFMPEG = path.join(repoRoot, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const FPS = 24;

const episodeNum = Number(process.argv[2]);
if (!Number.isInteger(episodeNum)) {
  console.error("Usage: node scripts/animated-film-mux-upload.mjs <episode-number> [frames-dir-override]");
  process.exit(1);
}
const framesDirOverride = process.argv[3];

const episodesDir = path.join(repoRoot, "src", "animated-film", "episodes");
const episodeFile = readdirSync(episodesDir).find((f) => f.startsWith(`ep-${String(episodeNum).padStart(2, "0")}-`));
if (!episodeFile) {
  console.error(`No episode file found for episode ${episodeNum} in ${episodesDir}`);
  process.exit(1);
}
const slug = episodeFile.replace(/\.json$/, "");
const episode = JSON.parse(await readFile(path.join(episodesDir, episodeFile), "utf8"));

const framesDir = framesDirOverride || path.join(repoRoot, "blender", "out", `ep${String(episodeNum).padStart(2, "0")}_full`);
if (!existsSync(framesDir)) {
  console.error(`Frames directory not found: ${framesDir}`);
  process.exit(1);
}

const audioDir = path.join(repoRoot, "public", "audio", "animated-film", slug);
const outDir = path.join(repoRoot, "out");
mkdirSync(outDir, { recursive: true });

console.log(`Muxing episode ${episodeNum} (${slug})...`);

// 1. Concatenate all beat audio files in order via ffmpeg's concat
// demuxer (a text list of files, one per line) — more reliable for
// many inputs than chaining -filter_complex concat across dozens of
// -i flags.
const beatCount = episode.beats.length;
const concatListPath = path.join(outDir, `${slug}-concat-list.txt`);
const concatLines = [];
for (let i = 0; i < beatCount; i++) {
  const beatFile = path.join(audioDir, `beat-${i}.mp3`);
  if (!existsSync(beatFile)) {
    console.error(`Missing audio file for beat ${i}: ${beatFile}`);
    process.exit(1);
  }
  concatLines.push(`file '${beatFile.replace(/\\/g, "/")}'`);
}
writeFileSync(concatListPath, concatLines.join("\n"));

const audioOutPath = path.join(outDir, `${slug}-audio.mp3`);
execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", audioOutPath]);
console.log(`Concatenated audio -> ${audioOutPath}`);

// 2. Encode frames + audio into the final mp4.
const videoOutPath = path.join(outDir, `AnimatedFilm-${slug}.mp4`);
execFileSync(FFMPEG, [
  "-y",
  "-framerate", String(FPS),
  "-i", path.join(framesDir, "frame_%06d.png"),
  "-i", audioOutPath,
  "-c:v", "libx264", "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-shortest",
  videoOutPath,
]);
console.log(`Encoded final video -> ${videoOutPath}`);

// 3. Upload to YouTube as private.
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN; // VI channel — this series is VI-only so far

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("YOUTUBE_* env vars not set — video encoded but NOT uploaded. Set scripts/.env.youtube.local and re-run.");
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

const title = `${episode.title} | Nhà Bà Tư - Tập ${episodeNum}`;
const description = [
  `Tập ${episodeNum} của "Nhà Bà Tư" — phim hoạt hình ngắn về một xóm nhỏ, nơi kinh nghiệm dân gian và y học hiện đại cùng tồn tại.`,
  "",
  "Nội dung mang tính chia sẻ kinh nghiệm dân gian và thông tin tham khảo, không thay thế lời khuyên của bác sĩ.",
  "",
  "#nhabatux #hoathinh #meodangian",
].join("\n");

console.log(`Uploading ${videoOutPath} as "${title}" (privacyStatus=private)`);
const res = await youtube.videos.insert({
  part: ["snippet", "status"],
  requestBody: {
    snippet: {
      title,
      description,
      tags: ["nhabatux", "hoathinh", "meodangian"],
      categoryId: "1", // Film & Animation
    },
    status: {
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
    },
  },
  media: {
    body: (await import("node:fs")).createReadStream(videoOutPath),
  },
});

const videoId = res.data.id;
console.log(`Uploaded (private): https://youtube.com/watch?v=${videoId}`);

// 4. Record in produced.json.
const producedPath = path.join(repoRoot, "src", "animated-film", "produced.json");
const produced = JSON.parse(await readFile(producedPath, "utf8"));
produced.rendered = produced.rendered || [];
if (!produced.rendered.includes(episodeNum)) produced.rendered.push(episodeNum);
produced.published = produced.published || [];
produced.published.push({
  episode: episodeNum,
  slug,
  videoId,
  uploadedAt: new Date().toISOString(),
  approvedAt: null,
});
writeFileSync(producedPath, JSON.stringify(produced, null, 2) + "\n");
console.log(`Recorded in ${producedPath}`);
