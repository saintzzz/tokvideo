// Weekly strategy report — closes the analytics → content loop (PRD M-01).
// Reads the channel-report-<locale>.md tables that the channel-report CI
// job already writes, joins views back to episode category via
// published.json + episodes/*.json, and emits:
//   src/suckhoe/strategy.md   — human/agent-readable priorities
//   src/suckhoe/strategy.json — machine-readable for scripts
// The daily-content-writer prompt reads strategy.md before each run so
// topic mix follows measured performance instead of stale guesses.
//
// Fully offline: needs no YouTube credentials, only the report files.
// Usage: node scripts/strategy-report.mjs

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const shDir = path.join(root, "src", "suckhoe");
const epDir = path.join(shDir, "episodes");

const published = JSON.parse(readFileSync(path.join(shDir, "published.json"), "utf8"));

// slug -> episode (for category + locale)
const episodes = new Map();
for (const f of readdirSync(epDir).filter((f) => f.endsWith(".json"))) {
  try {
    const ep = JSON.parse(readFileSync(path.join(epDir, f), "utf8"));
    if (ep?.slug) episodes.set(ep.slug, ep);
  } catch {}
}

// Parse the per-video markdown table: | Title | Views | Likes | Comments | Published |
const parseReport = (file) => {
  if (!existsSync(file)) return [];
  const rows = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\|(.+)\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([\d-]+)\s*\|$/);
    if (m && m[1].trim() !== "Title") {
      rows.push({
        title: m[1].trim(),
        views: +m[2],
        likes: +m[3],
        comments: +m[4],
        published: m[5],
      });
    }
  }
  return rows;
};

// Match a video title back to a slug via channelTitle equality or slug
// containment inside the title (titles often append " #Shorts" etc).
const titleToSlug = (title) => {
  const norm = title.toLowerCase();
  for (const [slug, ep] of episodes) {
    const ct = (ep.channelTitle ?? "").toLowerCase();
    if (ct && norm.startsWith(ct)) return slug;
  }
  return null;
};

const locales = ["vi", "en"];
const out = { generatedAt: new Date().toISOString(), locales: {} };
const md = ["# Strategy report", "", `Generated: ${out.generatedAt}`, ""];

for (const locale of locales) {
  const rows = parseReport(path.join(shDir, `channel-report-${locale}.md`));
  const byCat = new Map(); // cat -> {views, likes, comments, n}
  let matched = 0;
  for (const r of rows) {
    const slug = titleToSlug(r.title);
    const ep = slug ? episodes.get(slug) : null;
    const cat = ep?.category ?? "uncategorized";
    if (ep) matched++;
    const agg = byCat.get(cat) ?? { views: 0, likes: 0, comments: 0, n: 0 };
    agg.views += r.views;
    agg.likes += r.likes;
    agg.comments += r.comments;
    agg.n++;
    byCat.set(cat, agg);
  }
  const ranked = [...byCat.entries()]
    .map(([category, a]) => ({
      category,
      ...a,
      avgViews: a.n ? Math.round(a.views / a.n) : 0,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  out.locales[locale] = { videos: rows.length, matched, categories: ranked };

  md.push(`## ${locale.toUpperCase()} channel`);
  md.push("");
  if (!rows.length) {
    md.push("(no channel report data — run the channel-report job first)");
  } else {
    md.push(`${rows.length} videos in report, ${matched} matched to local episodes.`);
    md.push("");
    md.push("| Category | Videos | Avg views | Likes | Comments |");
    md.push("|---|---|---|---|---|");
    for (const c of ranked) {
      md.push(`| ${c.category} | ${c.n} | ${c.avgViews} | ${c.likes} | ${c.comments} |`);
    }
    const top = ranked.filter((c) => c.category !== "uncategorized").slice(0, 3);
    if (top.length) {
      md.push("");
      md.push(
        `**Priority for next batch:** ${top.map((c) => `\`${c.category}\``).join(", ")}` +
          ` — highest measured avg views. Keep a ~20-30% exploratory slice outside these.`
      );
    }
  }
  md.push("");
}

writeFileSync(path.join(shDir, "strategy.json"), JSON.stringify(out, null, 2));
writeFileSync(path.join(shDir, "strategy.md"), md.join("\n"));
console.log(md.join("\n"));
console.log(`\n(written to src/suckhoe/strategy.md + strategy.json)`);
