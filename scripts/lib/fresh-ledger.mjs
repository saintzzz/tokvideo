// Reads the LATEST published-long.json from origin/main rather than the
// checked-out SHA. The 2026-11-19 duplicate-upload incident: a cron run
// delayed ~15h by GitHub ran on the SHA captured at trigger time, saw a
// ledger missing the episode another run had just published, and
// re-uploaded it. The checkout can be arbitrarily stale under delayed
// schedules — the ledger read for publish decisions must not be.
//
// Falls back to the working-tree file when git/network is unavailable
// (local runs, shallow checkouts) — never worse than reading directly.

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "..");

export function freshJson(repoRelPath, { ref = "origin/main" } = {}) {
  const local = path.join(ROOT, repoRelPath);
  try {
    execSync(`git fetch origin ${ref.replace("origin/", "")} --quiet`, {
      cwd: ROOT,
      timeout: 30_000,
      stdio: "ignore",
    });
    const raw = execSync(`git show ${ref}:${repoRelPath}`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 8 << 20,
    });
    return JSON.parse(raw);
  } catch {
    // Local fallback — still correct when remote is unreachable.
    return existsSync(local) ? JSON.parse(readFileSync(local, "utf8")) : {};
  }
}

export function freshLongLedger() {
  return freshJson("src/suckhoe/published-long.json");
}
