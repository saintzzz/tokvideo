#!/usr/bin/env node
// Pipeline watchdog: scans recent GitHub Actions runs, classifies
// failures from their logs, and auto-remediates what it safely can —
// no waiting for a human to forward a failure email.
// Owner directive 2026-11-06: "watchdog tự phân tích lỗi pipeline để
// kịp thời khắc phục và sửa chữa".
//
// Remediation table (per failed run, newest first, max MAX_RUNS):
//   transient (TTS 403, ETIMEDOUT, 429, 5xx, EAI_AGAIN, push conflict)
//       -> rerun failed jobs (attempt < 3)
//   deterministic (post-render black gate, coverage, audio, quota)
//       -> count failures in quarantine.json; >=2 (or coverage/audio
//          immediately) BLOCKS the slug in every picker so it stops
//          burning slots. Unblocked automatically once resolved.
//   stuck in_progress runs (teaser >60min, long >270min)
//       -> cancel; the missed-slot dispatch re-picks the slug.
//   MEDIA_ELEMENT_ERROR / 404 on a public/ asset
//       -> if the file now exists and is git-tracked: rerun; else FINDING
//   "Could not resolve" / Composition not found for a slug whose JSON
//   exists but is unregistered
//       -> auto-register in index.ts (needs committer), then rerun
//   empty LONG_SLUG dispatch / validation errors / unknown
//       -> FINDING only (needs a human or a later session)
//
// Also checks the unpublished queue depth and records QUEUE LOW when
// below MIN_QUEUE (the workflow step then runs queue-refill --write).
//
// Writes a markdown report to src/suckhoe/pipeline-watchdog.md; the
// calling workflow step commits it.
//
// Usage: GITHUB_TOKEN=... node scripts/pipeline-watchdog.mjs
//        node scripts/pipeline-watchdog.mjs --dry-run   (no reruns)

import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sanityCheckAudio } from "./lib/audio-probe.mjs";
import { loadQuarantine, saveQuarantine, isBlocked, blockSlug } from "./lib/quarantine.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LONG_DIR = path.join(ROOT, "src/suckhoe/long-form");
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const REPO = process.env.GH_REPO || "saintzzz/tokvideo";
const DRY = process.argv.includes("--dry-run");
const MAX_RUNS = 12;
const REPORT = path.join(ROOT, "src/suckhoe/pipeline-watchdog.md");
const MIN_QUEUE = Number(process.env.MIN_QUEUE || 5);

const api = async (p, opts = {}) => {
  const r = await fetch(`https://api.github.com${p}`, {
    ...opts,
    headers: { authorization: `Bearer ${TOKEN}`, accept: "application/vnd.github+json", ...(opts.headers || {}) },
  });
  if (opts.raw) return r;
  if (!r.ok) throw new Error(`GH ${p} -> ${r.status}`);
  if (r.status === 204) return {};
  const text = await r.text();
  return text ? JSON.parse(text) : {};
};

const findings = [];
const actions = [];

async function jobLog(jobId) {
  const r = await api(`/repos/${REPO}/actions/jobs/${jobId}/logs`, { raw: true });
  if (!r.ok) return "";
  return (await r.text()).slice(-60000); // tail is where the error lives
}

const TRANSIENT = /edge-tts|edge_tts|HTTP 403|ETIMEDOUT|ECONNRESET|EAI_AGAIN|429|50[0-9] |rate limit|send-pack|rebase|could not push|Connection|timed out|apt-get|EAI_AGAIN/i;
const ASSET_404 = /MEDIA_ELEMENT_ERROR|Format error|404|ENOENT|no such file/i;
const UNREGISTERED = /Could not resolve|Composition.*not found|does not exist|Cannot find module/i;
// Deterministic signatures — a rerun CANNOT fix these, so the episode
// is quarantined after a bounded retry instead of letting the picker
// re-pick it forever and burn every slot (fail-loop, 2026-11-21).
const DETERMINISTIC = [
  ["quota", /uploadLimitExceeded|dailyUploadLimit|quotaExceeded/i],
  ["black-gate", /black_start|blackdetect|post-render visual gate|black segment/i],
  ["coverage", /coverage gate|visual coverage|no valid visual|Coverage FAIL/i],
  ["audio", /committed audio incomplete|audio incomplete|beat-\d+\.mp3.*(?:missing|0 bytes|sanity)/i],
];
const NON_SLUG_WORDS = new Set(["form", "next", "publish", "teaser", "render", "video"]);

function extractSlug(job, log) {
  const hay = `${job.name}\n${log}`;
  const m =
    hay.match(/long_form_slug["']?\s*[:=]\s*"?([a-z0-9-]+)/i) ||
    hay.match(/suckhoe-long-([a-z0-9-]+?)(?=[\s"']|$)/) ||
    hay.match(/\b([a-z0-9]+(?:-[a-z0-9]+)*-tap-\d+)\b/);
  const slug = m?.[1];
  if (!slug || NON_SLUG_WORDS.has(slug)) return null;
  // Only accept slugs that are real episodes — log paths like
  // "suckhoe-long-form" must not resolve to a phantom slug.
  return existsSync(path.join(LONG_DIR, `${slug}.json`)) ? slug : null;
}

async function rerun(runId) {
  if (DRY) return "(dry-run)";
  const r = await api(`/repos/${REPO}/actions/runs/${runId}/rerun-failed-jobs`, { method: "POST" });
  return r === undefined ? "rerun requested" : "rerun requested";
}

function tryAutoRegister(slug) {
  const file = path.join(ROOT, "src/suckhoe/long-form", `${slug}.json`);
  const indexTs = path.join(ROOT, "src/suckhoe/long-form/index.ts");
  if (!existsSync(file) || !existsSync(indexTs)) return false;
  const src = readFileSync(indexTs, "utf8");
  if (src.includes(`./${slug}.json`)) return false;
  const vn = slug.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()).replace(/^[0-9]/, d => `n${d}`);
  const lastImport = src.lastIndexOf("import ");
  const eol = src.indexOf("\n", lastImport);
  let next = src.slice(0, eol + 1) + `import ${vn} from "./${slug}.json";\n` + src.slice(eol + 1);
  next = next.replace(/(\n\]\s+as LongFormEpisode\[\];)/, `\n  ${vn},$1`);
  writeFileSync(indexTs, next);
  return true;
}

function assetFixed(log) {
  const m = log.match(/(public\/[\w\-./]+\.(?:mp4|jpg|jpeg|png|mp3))/i) || log.match(/(images\/suckhoe-long\/[\w\-./]+)/i) || log.match(/(videos\/suckhoe-long\/[\w\-./]+)/i);
  if (!m) return null;
  const p = m[1].startsWith("public/") ? m[1] : `public/${m[1]}`;
  const exists = existsSync(path.join(ROOT, p));
  const tracked = exists && execSync(`git ls-files --error-unmatch "${p}"`, { cwd: ROOT, stdio: "pipe" }).toString().trim() !== "";
  return { path: p, ok: exists && tracked };
}

// ------------------------------------------------------------- queue ---
function unpublishedSlugs() {
  const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
  const published = new Set(Object.keys(ledger));
  const src = readFileSync(path.join(ROOT, "src/suckhoe/long-form/index.ts"), "utf8");
  return [...src.matchAll(/from "\.\/([a-z0-9-]+)\.json"/g)]
    .map(m => m[1])
    .filter(s => !published.has(s) && !s.endsWith("-teaser"))
    // Effective depth: a quarantined slug is dead weight, not inventory —
    // QUEUE LOW / STALL must see through it or the refill never fires.
    .filter(s => !isBlocked(quarantine, s, epPath(s)));
}

const queueDepth = () => unpublishedSlugs().length;

// -------------------------------------------------------------- main ---
const now = new Date();
if (!TOKEN) { console.error("GITHUB_TOKEN/GH_TOKEN required"); process.exit(1); }

const quarantine = loadQuarantine();
let quarantineDirty = false;
const audioDir = (slug) => path.join(ROOT, "public", "audio", "suckhoe-long", slug);
const epPath = (slug) => path.join(LONG_DIR, `${slug}.json`);
const readEp = (slug) => {
  try { return JSON.parse(readFileSync(epPath(slug), "utf8")); } catch { return null; }
};

// ---- Early-clear resolved quarantine -------------------------------------
// A blocked slug re-enters the queue the moment its root cause is gone:
// audio topped up, scene images committed, the episode JSON edited, or
// the entry simply expired. Checking at scan start means self-heal work
// from earlier steps (audio-topup, gen-thumb-visuals) takes effect at
// the very next tick instead of waiting out the TTL.
for (const [slug, e] of Object.entries(quarantine)) {
  if (!e?.blocked) continue;
  const ep = readEp(slug);
  const p = epPath(slug);
  let resolved = Date.parse(e.expiresAt ?? 0) < now;
  try { if (statSync(p).mtimeMs > (e.epMtime ?? 0)) resolved = true; } catch { /* file gone */ }
  if (!resolved && e.kind === "audio" && ep?.beats) {
    resolved = ep.beats.every((_, i) => sanityCheckAudio(path.join(audioDir(slug), `beat-${i}.mp3`)).ok);
  }
  if (!resolved && e.kind === "coverage" && ep) {
    const imgDir = path.join(ROOT, "public", "images", "suckhoe-long", slug);
    const sceneVals = Object.values(ep.sceneImages ?? {});
    resolved =
      Object.keys(ep.scenePrompts ?? {}).length > 0 ||
      (sceneVals.length > 0 && sceneVals.some(v => existsSync(path.join(imgDir, path.basename(v))))) ||
      existsSync(path.join(imgDir, "hook.jpg"));
  }
  if (resolved) {
    delete quarantine[slug];
    quarantineDirty = true;
    actions.push(`- gỡ quarantine \`${slug}\` (${e.kind}) - nguyên nhân đã hết, tập quay lại queue`);
  }
}

// ---- Stuck-run reaper ----------------------------------------------------
// A run that hangs (render stuck, runner wedged) holds its slot forever
// and nothing new dispatches behind it. Kill runs far past their
// expected duration; the missed-slot dispatch below re-picks the slug.
try {
  const inProg = (await api(`/repos/${REPO}/actions/runs?per_page=20&status=in_progress`)).workflow_runs ?? [];
  for (const r of inProg) {
    const ageMin = (now - new Date(r.started_at ?? r.created_at)) / 60000;
    if (ageMin < 45) continue; // young runs and this watchdog's own run
    const jobs = (await api(`/repos/${REPO}/actions/runs/${r.id}/jobs?per_page=10`)).jobs ?? [];
    const names = jobs.map(j => j.name).join(" ");
    const capMin = /teaser/.test(names) ? 60 : /long|publish/.test(names) ? 270 : 120;
    if (ageMin > capMin) {
      if (!DRY) await api(`/repos/${REPO}/actions/runs/${r.id}/cancel`, { method: "POST" }).catch(() => {});
      actions.push(`- giết run treo ${r.id} (${Math.round(ageMin)}p > cap ${capMin}p: ${names.slice(0, 60)}) - missed-slot sẽ dispatch lại`);
    }
  }
} catch (e) {
  findings.push(`- stuck-run reaper lỗi: ${String(e.message).slice(0, 120)}`);
}

const runs = (await api(`/repos/${REPO}/actions/runs?per_page=40`)).workflow_runs
  .filter(r => r.conclusion === "failure" || r.conclusion === "timed_out")
  .filter(r => now - new Date(r.created_at) < 48 * 3600e3)
  .slice(0, MAX_RUNS);

console.log(`watchdog: ${runs.length} failed/timed-out runs in 48h`);
for (const run of runs) {
  const jobs = (await api(`/repos/${REPO}/actions/runs/${run.id}/jobs?per_page=30`)).jobs
    .filter(j => j.conclusion === "failure");
  if (!jobs.length) continue;
  for (const job of jobs.slice(0, 3)) {
    const log = await jobLog(job.id).catch(() => "");
    const label = `run ${run.id} job ${job.name}`;
    if (/LONG_SLUG:\s*$/m.test(log) || /suckhoe-long-\s*$/m.test(log)) {
      findings.push(`- ${label}: dispatch với slug rỗng - input sai, bỏ qua (không rerun)`);
      continue;
    }
    const slug = extractSlug(job, log);
    const slugM = slug ? [slug] : null;
    const asset = ASSET_404.test(log) ? assetFixed(log) : null;
    if (asset && !asset.ok) {
      findings.push(`- ${label}: asset còn thiếu \`${asset.path}\` - cần commit file (không tự sửa được)`);
      continue;
    }
    // Deterministic failure: a rerun cannot fix it, and leaving the
    // slug pickable re-picks it every tick - a fail-loop that uploads
    // nothing while healthy episodes starve behind it.
    const detKind = DETERMINISTIC.find(([, re]) => re.test(log))?.[0];
    if (detKind && slug) {
      const prev = quarantine[slug] ?? {};
      const fails = (prev.fails ?? 0) + 1;
      // coverage/audio can never self-heal by rerunning (audio-topup
      // fixes audio out-of-band); quota is channel-level, not the
      // slug's fault - count it but never block on it.
      const blockNow = detKind === "coverage" || detKind === "audio" || fails >= 2;
      quarantine[slug] = { ...prev, kind: detKind, fails, lastRunId: run.id, lastFailAt: now.toISOString() };
      if (blockNow && detKind !== "quota") {
        blockSlug(quarantine, slug, detKind, epPath(slug), { fails, lastRunId: run.id });
        findings.push(`- ${label}: lỗi cố định \`${detKind}\` lần ${fails} ở \`${slug}\` - ĐÃ QUARANTINE, picker bỏ qua tới khi hết nguyên nhân`);
      } else {
        actions.push(`- ${label}: lỗi cố định \`${detKind}\` lần ${fails} ở \`${slug}\` - rerun ${detKind === "quota" ? "vô ích (đợi quota reset)" : "thử 1 lần"}`);
        if (detKind !== "quota" && run.run_attempt < 3) await rerun(run.id);
      }
      quarantineDirty = true;
      continue;
    }
    if (detKind) {
      findings.push(`- ${label}: lỗi cố định \`${detKind}\` nhưng không trích được slug - xem log`);
      continue;
    }
    if (UNREGISTERED.test(log) && slugM && tryAutoRegister(slugM[0])) {
      actions.push(`- ${label}: đã tự đăng ký composition cho ${slugM[0]} vào index.ts + rerun`);
      await rerun(run.id);
      continue;
    }
    if (TRANSIENT.test(log) || (asset && asset.ok)) {
      if (run.run_attempt >= 3) { findings.push(`- ${label}: lỗi tạm thời nhưng đã rerun ${run.run_attempt} lần - cần xem tay`); continue; }
      actions.push(`- ${label}: lỗi tạm thời (TTS/mạng/asset-vừa-fix) - rerun failed jobs`);
      await rerun(run.id);
      continue;
    }
    findings.push(`- ${label}: lỗi chưa phân loại - \`${(log.match(/##\[error\](.+)/) || [])[1]?.slice(0, 160) || "xem log"}\``);
  }
}

const depth = queueDepth();
// Computed outside the try below: a picker crash must not zero this and
// turn into a phantom "stalled forever" alarm.
let lastUploadMs = 0;
try {
  const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
  lastUploadMs = Math.max(0, ...Object.entries(ledger)
    .filter(([k]) => !k.endsWith("-teaser") && !k.endsWith("-fb"))
    .map(([, v]) => Date.parse(v.publishedAt || 0)));
} catch { /* ledger unreadable */ }

// Persist quarantine BEFORE the missed-slot dispatch — the picker runs
// as a subprocess and must see freshly-blocked slugs skipped, otherwise
// the self-heal dispatch re-picks the very slug we just quarantined.
if (quarantineDirty && !DRY) {
  saveQuarantine(quarantine);
  quarantineDirty = false;
}

// ----------------------------------------------------- missed slots ---
// 2026-11-07 incident: the only daily tick allowed to START a new arc
// (05:30 VN) got dropped/misattributed by GitHub, every later tick held
// the arc outside the 05:00-08:59 window, and a whole day went by with
// zero uploads - nobody noticed. Now the watchdog asks the picker what
// SHOULD be next, and if the last long-form upload is stale (>90min) it
// dispatches the manual publish job itself. upload-youtube-long has a
// ledger guard so a delayed cron picking the same slug is a no-op.
try {
  const nextSlug = execSync("node scripts/next-long-form-slug.mjs", { cwd: ROOT, encoding: "utf8" }).trim();
  const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
  const lastUpload = lastUploadMs;
  const staleMin = (Date.now() - lastUpload) / 60000;
  if (nextSlug && staleMin > 90) {
    if (!DRY) {
      await api(`/repos/${REPO}/actions/workflows/render.yml/dispatches`, {
        method: "POST",
        body: JSON.stringify({ ref: "main", inputs: { video: "suckhoe-long", long_form_slug: nextSlug } }),
      });
    }
    actions.push(`- tick bị drop/delay: upload mới nhất đã ${Math.round(staleMin)} phút trước - tự dispatch \`${nextSlug}\``);
  } else if (nextSlug) {
    actions.push(`- picker chờ ${nextSlug}, upload gần nhất ${Math.round(staleMin)} phút - nhịp bình thường`);
  } else {
    // Picker held. Owner directive 2026-11-07: "mỗi ngày đăng full 5 tập
    // dài và 5 tập xem trước" - an EMPTY day is worse than an arc that
    // starts late. If no long-form upload has landed since 05:00 VN
    // today, the morning arc-start tick was lost; dispatch the first
    // unpublished episode explicitly (bypasses the arc-start window).
    const vnNow = new Date(Date.now() + 7 * 3600e3);
    const vnHour = Number(vnNow.toISOString().slice(11, 13));
    const today5amVN = Date.parse(`${vnNow.toISOString().slice(0, 10)}T05:00:00+07:00`);
    if (vnHour >= 9 && lastUpload < today5amVN && unpublishedSlugs().length) {
      // Reuse the picker's real candidate ordering (priority + narrator
      // filter + readiness) instead of a naive first-unpublished guess.
      const slug = execSync("node scripts/next-long-form-slug.mjs", {
        cwd: ROOT, encoding: "utf8",
        env: { ...process.env, ALLOW_ARC_ANYTIME: "1" },
      }).trim();
      if (!slug) {
        findings.push(`- ngày trống nhưng picker (ALLOW_ARC_ANYTIME) vẫn trả rỗng - mọi candidate thiếu audio, audio-topup xử lý`);
      } else {
      const ep = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/long-form", `${slug}.json`), "utf8"));
      const audioDir = path.join(ROOT, "public/audio/suckhoe-long", slug);
      const missing = (ep.beats || []).filter((_, i) => !existsSync(path.join(audioDir, `beat-${i}.mp3`))).length;
      if (missing === 0) {
        if (!DRY) {
          await api(`/repos/${REPO}/actions/workflows/render.yml/dispatches`, {
            method: "POST",
            body: JSON.stringify({ ref: "main", inputs: { video: "suckhoe-long", long_form_slug: slug } }),
          });
        }
        actions.push(`- ngày trống (tick sáng bị drop): tự dispatch arc-start \`${slug}\` dù ngoài khung giờ`);
      } else {
        findings.push(`- ngày trống nhưng ${slug} thiếu ${missing} beat audio - audio-topup đang xử lý`);
      }
      }
    } else if (vnHour >= 5 && vnHour <= 8 && depth > 0) {
      findings.push(`- trong khung arc mới nhưng picker trả rỗng - kiểm tra audio/registration của arc kế tiếp`);
    }
  }
} catch (e) {
  findings.push(`- missed-slot check lỗi: ${e.message.slice(0, 140)}`);
}

// ------------------------------------------------- teaser missed slots ---
// 2026-11-20 incident: Shorts (the growth engine) produced ZERO videos
// for 2 days because teaser uploads were coupled to long renders. The
// teaser-ahead job decoupled them, but had no stall detector — a dropped
// cron or a failing teaser job silently starves the Shorts feed again.
// Cadence is 3-5 teasers/day; >8h without one means a slot was lost.
try {
  const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
  const lastTeaserMs = Math.max(0, ...Object.entries(ledger)
    .filter(([k]) => k.endsWith("-teaser"))
    .map(([, v]) => Date.parse(v.publishedAt || 0)));
  const teaserStaleMin = (Date.now() - lastTeaserMs) / 60000;
  if (teaserStaleMin > 8 * 60) {
    const tslug = execSync("node scripts/next-teaser-ahead-slug.mjs", { cwd: ROOT, encoding: "utf8" })
      .trim().match(/slug=(\S+)/)?.[1] ?? "";
    if (tslug) {
      if (!DRY) {
        await api(`/repos/${REPO}/actions/workflows/render.yml/dispatches`, {
          method: "POST",
          body: JSON.stringify({ ref: "main", inputs: { video: "suckhoe-teaser-ahead" } }),
        });
      }
      actions.push(`- Shorts stall ${Math.round(teaserStaleMin / 60)}h: tự dispatch teaser-ahead cho \`${tslug}\` (cron teaser bị drop)`);
    } else {
      findings.push(`- Shorts stall ${Math.round(teaserStaleMin / 60)}h nhưng teaser-ahead picker trả rỗng - mọi tập chưa đăng đã có teaser; cần arc mới từ queue-refill`);
    }
  }
} catch (e) {
  findings.push(`- teaser missed-slot check lỗi: ${e.message.slice(0, 140)}`);
}

if (depth < MIN_QUEUE) findings.unshift(`- **QUEUE LOW**: chỉ còn ${depth} tập chưa đăng (< ${MIN_QUEUE}) - queue-refill cần chạy`);

// ----------------------------------------------------- teaser pairs ---
// 1-long-1-short rhythm: every published episode needs its `-teaser`
// ledger entry. Missing pairs are retried by the nightly doctor; report
// them here so a persistent gap is visible in the report (and pairs
// older than the stall window escalate via the stall check above).
try {
  const ledger = JSON.parse(readFileSync(path.join(ROOT, "src/suckhoe/published-long.json"), "utf8"));
  const missingTeasers = Object.keys(ledger)
    .filter(k => !k.endsWith("-teaser") && !k.endsWith("-fb") && !ledger[`${k}-teaser`]);
  if (missingTeasers.length) {
    findings.push(`- ${missingTeasers.length} tập thiếu teaser Short: ${missingTeasers.slice(0, 8).join(", ")}${missingTeasers.length > 8 ? "..." : ""}`);
  }
} catch { /* ledger unreadable - the stall check already covers it */ }

// ---------------------------------------------------- fail-loud stall ---
// 2026-11-13 incident: 2 ngày không upload nào (mọi candidate thiếu audio
// + commit step nuốt lỗi) mà mọi run vẫn xanh - findings chỉ nằm trong
// file markdown không ai đọc. Owner: "đấy không phải auto healing".
// Khi queue còn tập mà upload mới nhất đã quá STALL_ALERT_HOURS, pipeline
// đã hết khả năng tự cứu -> FAIL run này để GitHub gửi email báo lỗi.
const STALL_H = Number(process.env.STALL_ALERT_HOURS || 20);
const stallH = (Date.now() - lastUploadMs) / 3600e3;
const critical = depth > 0 && stallH > STALL_H;
if (critical) {
  findings.unshift(`- **STALL ${Math.round(stallH)}h**: còn ${depth} tập chưa đăng mà upload mới nhất đã ${Math.round(stallH)}h trước - auto-heal không cứu được, cần người xem`);
}
if (!actions.length && !findings.length) actions.push("- không có run nào fail trong 48h - pipeline sạch");

const vn = new Date(Date.now() + 7 * 3600e3).toISOString().replace("T", " ").slice(0, 16);
const report = `# Pipeline Watchdog - ${vn} VN

Tự động quét mỗi 3h bởi job \`pipeline-watchdog\`. Queue chưa đăng: **${depth} tập**.

## Đã tự xử lý
${actions.join("\n")}

## Cần người xem
${findings.length ? findings.join("\n") : "- (trống)"}
`;
writeFileSync(REPORT, report);
console.log(report);
if (critical) process.exitCode = 1;
