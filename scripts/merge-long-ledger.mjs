// Union-merge src/suckhoe/published-long.json during a git rebase/merge
// conflict. Each long-form job appends a distinct slug key, so the
// correct resolution is always "keep both sides"; on the rare duplicate
// key the incoming side (stage 3) wins as the freshest write.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const path = "src/suckhoe/published-long.json";
const load = (stage) => {
  try {
    return JSON.parse(execSync(`git show :${stage}:${path}`).toString());
  } catch {
    return {};
  }
};

const merged = { ...load(2), ...load(3) };
if (Object.keys(merged).length === 0) process.exit(0);
writeFileSync(path, JSON.stringify(merged, null, 2) + "\n");
