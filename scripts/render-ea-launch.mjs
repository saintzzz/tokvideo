import { spawnSync } from "node:child_process";
const entry = "src/english-arena/launch/index.tsx";
const run = (args) => {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["remotion", ...args],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
};
for (const variant of ["Full", "Short"])
  run([
    "render",
    entry,
    `EnglishArena-Launch-${variant}`,
    `out/EnglishArena-Launch-${variant}.mp4`,
    "--codec=h264",
    "--crf=18",
    "--pixel-format=yuv420p",
    "--concurrency=2",
  ]);
run([
  "still",
  entry,
  "EnglishArena-Launch-Poster",
  "out/EnglishArena-Launch-Cover.png",
  "--frame=45",
]);
