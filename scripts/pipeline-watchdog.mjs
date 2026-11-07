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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const REPO = process.env.GH_REPO || "saintzzz/tokvideo";
const DRY = process.argv.includes("--dry-run");
const MAX_RUNS = 8;
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

const TRANSIENT = /edge-tts|edge_tts|HTTP 403|ETIMEDOUT|ECONNRESET|EAI_AGAIN|429|50[0-9] |rate limit|send-pack|rebase|could not push|Connection|timed out/i;
const ASSET_404 = /MEDIA_ELEMENT_ERROR|Format error|404|ENOENT|no such file/i;
const UNREGISTERED = /Could not resolve|Composition.*not found|does not exist|Cannot find module/i;

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
    .map(m => m[1]).filter(s => !published.has(s) && !s.endsWith("-teaser"));
}

const queueDepth = () => unpublishedSlugs().length;

// -------------------------------------------------------------- main ---
const now = new Date();
if (!TOKEN) { console.error("GITHUB_TOKEN/GH_TOKEN required"); process.exit(1); }

const runs = (await api(`/repos/${REPO}/actions/runs?per_page=40`)).workflow_runs
  .filter(r => r.conclusion === "failure" || r.conclusion === "timed_out")
  .filter(r => now - new Date(r.created_at) < 48 * 3600e3)
  .slice(0, MAX_RUNS);

console.log(`watchdog: ${runs.length} failed/timed-out runs in 48h`);
for (const run of runs) {
  const jobs = (await api(`/repos/${REPO}/actions/runs/${run.id}/jobs?per_page=30`)).jobs
    .filter(j => j.conclusion === "failure");
  if (!jobs.length) continue;
  for (const job of jobs.slice(0, 2)) {
    const log = await jobLog(job.id).catch(() => "");
    const label = `run ${run.id} job ${job.name}`;
    if (/LONG_SLUG:\s*$/m.test(log) || /suckhoe-long-\s*$/m.test(log)) {
      findings.push(`- ${label}: dispatch với slug rỗng - input sai, bỏ qua (không rerun)`);
      continue;
    }
    const slugM = log.match(/suckhoe-long-([a-z0-9-]+?)(?:\s|$|")/) || log.match(/tap-\d+/g);
    const asset = ASSET_404.test(log) ? assetFixed(log) : null;
    if (asset && !asset.ok) {
      findings.push(`- ${label}: asset còn thiếu \`${asset.path}\` - cần commit file (không tự sửa được)`);
      continue;
    }
    if (UNREGISTERED.test(log) && slugM && tryAutoRegister(slugM[0].replace("suckhoe-long-", ""))) {
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
  const lastUpload = Math.max(0, ...Object.entries(ledger)
    .filter(([k]) => !k.endsWith("-teaser"))
    .map(([, v]) => Date.parse(v.publishedAt || 0)));
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
if (depth < MIN_QUEUE) findings.unshift(`- **QUEUE LOW**: chỉ còn ${depth} tập chưa đăng (< ${MIN_QUEUE}) - queue-refill cần chạy`);
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
