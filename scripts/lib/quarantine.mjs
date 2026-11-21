// Failure quarantine: the watchdog records deterministic per-slug
// failures here, and the pickers skip blocked slugs so a poisoned
// episode stops burning publish slots (2026-11-21: a slug that dies at
// the post-render gate was re-picked every tick - each slot burned a
// full render and uploaded nothing).
//
// Read through freshJson so a delayed cron's stale checkout still sees
// the latest blocklist. An entry stops blocking when it expires OR the
// episode JSON was modified after quarantining (someone/something fixed
// it - reinstate automatically).

import { statSync } from "node:fs";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { freshJson } from "./fresh-ledger.mjs";

const ROOT = path.join(import.meta.dirname, "..", "..");
export const QUARANTINE_REL = "src/suckhoe/quarantine.json";
const FILE = path.join(ROOT, QUARANTINE_REL);
const QUARANTINE_TTL_MS = 3 * 24 * 3600e3;

export function loadQuarantine() {
  return freshJson(QUARANTINE_REL);
}

export function saveQuarantine(q) {
  writeFileSync(FILE, JSON.stringify(q, null, 2) + "\n");
}

export function isBlocked(q, slug, epPath) {
  const e = q?.[slug];
  if (!e?.blocked) return false;
  if (Date.parse(e.expiresAt ?? 0) < Date.now()) return false;
  try {
    if (epPath && statSync(epPath).mtimeMs > (e.epMtime ?? 0)) return false;
  } catch {
    // Episode file gone — a stub slated for deletion stays blocked.
  }
  return true;
}

export function blockSlug(q, slug, kind, epPath, extra = {}) {
  let epMtime = 0;
  try { epMtime = statSync(epPath).mtimeMs; } catch { /* keep 0 */ }
  const prev = q[slug] ?? {};
  q[slug] = {
    ...prev,
    ...extra,
    kind,
    blocked: true,
    epMtime,
    quarantinedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + QUARANTINE_TTL_MS).toISOString(),
  };
}
