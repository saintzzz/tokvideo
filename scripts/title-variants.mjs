// Title-variant generator (PRD M-04): writes 3 alternate channelTitle
// candidates per episode into src/suckhoe/title-variants.json, keyed by
// slug. Patterns rotate across the archetypes that historically
// differentiate winners on this channel (specific ingredient + benefit,
// named-host framing, curiosity gap). The upload path keeps using
// channelTitle as canonical; variants exist for manual A/B rotation and
// for the writer to study which pattern the channel-report favors.
//
// Rule-based only — no AI calls, deterministic, CI-safe.
// Usage: node scripts/title-variants.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const epDir = path.join(root, "src", "suckhoe", "episodes");

const variants = {};
let n = 0;
for (const f of readdirSync(epDir).filter((f) => f.endsWith(".json"))) {
  let ep;
  try {
    ep = JSON.parse(readFileSync(path.join(epDir, f), "utf8"));
  } catch {
    continue;
  }
  if (!ep?.slug || !ep.channelTitle) continue;
  const en = ep.locale === "en";
  const host = en ? "Grandma June" : "Bà Tư";
  const ingredient = ep.ingredientName ?? "";
  const base = ep.channelTitle;
  variants[ep.slug] = en
    ? [
        base,
        `${host}'s ${ingredient} trick`,
        `The ${ingredient} remedy your grandma knew`,
      ]
    : [
        base,
        `${host} mách: ${ingredient}`,
        `Mẹo ${ingredient} xưa nay ai cũng cần`,
      ];
  n++;
}

const out = path.join(root, "src", "suckhoe", "title-variants.json");
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), variants }, null, 2));
console.log(`Wrote ${n} title variant set(s) to ${out}`);
