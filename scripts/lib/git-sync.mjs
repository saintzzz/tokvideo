// One correct way to commit repo-state files from automation.
// Every script that commits (published.json, reports, logs) funnels
// through commitAndPush so the pull --rebase incantation that the
// workflow comments require can't drift between call sites.

import { execFileSync } from "node:child_process";

const git = (args, opts = {}) =>
  execFileSync("git", args, { encoding: "utf8", ...opts }).trim();

/**
 * Commit `files` with `message` and push, rebasing on remote first.
 * Retries the push once after a fresh pull --rebase (the stale-checkout
 * race documented in .github/workflows/render.yml comments).
 * @returns {boolean} true when a commit was created, false when nothing changed.
 */
export const commitAndPush = ({ files, message, remote = "origin", branch = "main" }) => {
  for (const f of files) git(["add", f]);
  const dirty = git(["status", "--porcelain", "--", ...files]);
  if (!dirty) return false;

  git(["commit", "-m", `${message} [skip ci]`]);

  git(["fetch", remote]);
  git(["pull", "--rebase", remote, branch]);
  try {
    git(["push", remote, `HEAD:${branch}`]);
  } catch {
    // Remote moved again during our push — one re-pull + retry.
    git(["pull", "--rebase", remote, branch]);
    git(["push", remote, `HEAD:${branch}`]);
  }
  return true;
};
