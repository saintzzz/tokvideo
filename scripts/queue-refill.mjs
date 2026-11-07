#!/usr/bin/env node
// Queue refill: keeps the unpublished long-form backlog above MIN_QUEUE
// episodes by writing a brand-new 5-episode folk-horror arc when the
// queue runs low. Owner directive 2026-11-06: "hàng đợi còn dưới 5 video
// thì tự viết kịch bản, đừng để tao phải đụng tay".
//
// Writer backends, tried in order:
//   --agent claude|codex   local agent CLI (best quality; used by the
//                          mac crontab so new arcs get committed audio
//                          generated locally)
//   GEMINI_API_KEY         Gemini generateContent
//   OPENAI_API_KEY         OpenAI chat completions
//   ANTHROPIC_API_KEY      Anthropic messages
//   (none)                 text.pollinations.ai anonymous - free,
//                          works from GitHub Actions with no secret
//
// After writing the arc it registers the slugs in
// src/suckhoe/long-form/index.ts and runs validate-episodes.mjs.
// Committing is left to the caller (CI job step or local wrapper).
//
// Usage:
//   node scripts/queue-refill.mjs              # check-only report
//   node scripts/queue-refill.mjs --write      # write an arc if queue<5
//   node scripts/queue-refill.mjs --write --agent claude
//   MIN_QUEUE=5 ARC_SIZE=5 node scripts/queue-refill.mjs --write

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LONG_DIR = path.join(ROOT, "src/suckhoe/long-form");
const INDEX_TS = path.join(LONG_DIR, "index.ts");
const LEDGER = path.join(ROOT, "src/suckhoe/published-long.json");
const MIN_QUEUE = Number(process.env.MIN_QUEUE || 5);
const ARC_SIZE = Number(process.env.ARC_SIZE || 5);
const WRITE = process.argv.includes("--write");
const agentIdx = process.argv.indexOf("--agent");
const AGENT = agentIdx > -1 ? process.argv[agentIdx + 1] : process.env.LOCAL_AGENT || "";
const AI_MODEL = process.env.AI_MODEL || "";

// ---------------------------------------------------------------- pool ---
// Rotating Vietnamese folk-horror settings. The picker prefers a motif
// that does not yet exist as an arc; order reflects what has performed
// (enclosed cursed places/objects, water + night travel).
const MOTIF_POOL = [
  { arc: "ngo-mo-co", title: "NGÔI MỘ CỔ", hook: "ngôi mộ cổ không bia giữa nghĩa địa bỏ hoang, đêm rằm có người ngồi trên nấm mộ" },
  { arc: "chuong-chua", title: "CHUÔNG CHÙA ĐÊM", hook: "tiếng chuông chùa đổi tự vang lúc nửa đêm dù chùa đã bỏ hoang mấy chục năm" },
  { arc: "ghe-mua-lu", title: "GHE MÙA LŨ", hook: "chiếc ghe chở đò khuya mùa nước lũ, khách lên ghe rồi không bao giờ xuống bến" },
  { arc: "ong-tho-duc", title: "ÔNG THỢ ĐÚC", hook: "ông thợ đúc đồng nhận đúc tượng thần cho miếu, đêm hoàn thiện tượng tự quay đầu" },
  { arc: "buc-vai-do", title: "BỨC VẢI ĐỎ", hook: "bức vải đỏ quấn quanh cây gạo đầu làng, ai gỡ xuống là gặp chuyện" },
  { arc: "can-nha-rong", title: "CĂN NHÀ RỖNG", hook: "căn nhà bỏ trống giữa làng, đêm nào cũng có tiếng quét nhà nhưng vào thì không có ai" },
  { arc: "dan-oc-den", title: "ĐÀN ỐC ĐEN", hook: "bầy ốc đen kéo về đồng sau trận mưa lạ, bà con bảo là đoàn quân đi mượn đường" },
  { arc: "hom-go-so", title: "HÒM GỖ SỒI", hook: "chiếc hòm gỗ sồi trôi về bãi sông, mở ra thấy đầy tóc người bện thành bím" },
];

function loadJson(p) { return JSON.parse(readFileSync(p, "utf8")); }

function unpublishedSlugs() {
  const ledger = existsSync(LEDGER) ? loadJson(LEDGER) : {};
  const published = new Set(Object.keys(ledger));
  const src = readFileSync(INDEX_TS, "utf8");
  const slugs = [...src.matchAll(/from "\.\/([a-z0-9-]+)\.json"/g)].map(m => m[1]);
  return slugs.filter(s => !published.has(s) && !s.endsWith("-teaser"));
}

function existingArcs() {
  const arcs = new Set();
  for (const f of readdirSync(LONG_DIR)) {
    const m = f.match(/^([a-z0-9-]+)-tap-\d+\.json$/);
    if (m) arcs.add(m[1]);
  }
  return arcs;
}

function pickMotif() {
  const used = existingArcs();
  return MOTIF_POOL.find(m => !used.has(m.arc)) || MOTIF_POOL[Math.floor(Math.random() * MOTIF_POOL.length)];
}

// ------------------------------------------------------------- prompt ---
const SCHEMA_NOTE = `Mỗi episode là 1 file JSON object với đúng các field sau (KHÔNG thêm field khác):
{
  "id": "<slug>", "arc": "<arc>", "arcTitle": "<ARC TITLE>", "episode": <1-5>,
  "slug": "<slug>",
  "title": "<tiêu đề tập, tiếng Việt có dấu, kết thúc bằng yếu tố gây tò mò>",
  "description": "<2-3 câu tóm tắt + #truyenma #kechuyen #truyendangian>",
  "tags": ["truyện ma", "truyện ma dân gian", "kể chuyện", "<arc>"],
  "narrator": "vi-VN-NamMinhNeural",
  "thumbnailSubjects": ["<2-3 mô tả ngắn tiếng Anh cho ảnh thumbnail>"],
  "scenePrompts": { "<scene-key>": "<english photorealistic cinematic prompt>" },
  "beats": [ { "speaker": "narrator", "scene": "<scene-key>", "caption": "<tối đa 45 ký tự>", "text": "<2-4 câu, 250-500 ký tự>" } ]
}
LUẬT BẮT BUỘC:
- 14-18 beats mỗi tập. Mỗi beat: speaker="narrator" luôn; scene phải là 1 trong các scene-key đã khai báo trong scenePrompts; caption là bản rút gọn <45 ký tự của text.
- 8-12 scene-key khác nhau mỗi tập, tái sử dụng scene giữa các beat.
- Kể ngôi thứ nhất, giọng kể chuyện dân gian Bà Tư: mộc mạc, chậm rãi, có chi tiết quê (tên làng, món ăn, phong tục). Không em-dash.
- Audit 2026-11-06: tập 2-5 KHÔNG được mở bằng recap dài - tối đa 1 beat nhắc lại rồi vào thẳng tình tiết/hình ảnh mạnh nhất của tập mới trong 1-3 beat đầu.
- thumbnailSubjects: 2-3 gợi ý ảnh RIÊNG của tập này (cảnh/vật/nhân vật cụ thể xuất hiện trong tập), không lặp subject giữa các tập - tránh cận cảnh tối giống nhau.
- Tập nào cũng phải có hook mạnh trong 2 beat đầu, leo thang giữa, kết mở dẫn sang tập sau (trừ tập cuối kết trọn, trả nợ minh oan).
- KHÔNG markdown, KHÔNG giải thích - output chỉ là JSON thuần của 1 episode.`;

function arcPrompt(motif) {
  return `Bạn là nhà biên kịch truyện ma dân gian Việt Nam cho kênh "Truyện Ma Dài Kỳ".
Viết outline cho 1 arc 5 tập với motif: ${motif.hook} (arc id "${motif.arc}", tên "${motif.title}").
Output JSON thuần (không markdown): { "arcTitle": "${motif.title}", "premises": ["<tóm tắt 1-2 câu tập 1>", ... 5 phần tử] }
Quy tắc: tập 1 đặt bối cảnh + lời cấm bị phá; tập 2-4 leo thang + mở bí mật (xác chết, món nợ, kẻ gây nghiệp); tập 5 đối chất + trả nợ + minh oan. Nhân vật quê, tên Việt thật. Không em-dash.`;
}

function epPrompt(motif, premises, i) {
  return `Bạn là nhà biên kịch truyện ma dân gian Việt Nam cho kênh "Truyện Ma Dài Kỳ" (Bà Tư kể).
Arc "${motif.title}" (id "${motif.arc}") - motif: ${motif.hook}.
Outline 5 tập: ${premises.map((p, j) => `T${j + 1}: ${p}`).join(" | ")}
Hãy viết TẬP ${i + 1}: ${premises[i]}
Slug tập: "${motif.arc}-tap-0${i + 1}".
${SCHEMA_NOTE}`;
}

// ------------------------------------------------------------ backends ---
function extractJson(text) {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s === -1 || e <= s) throw new Error("no JSON object in output");
  return JSON.parse(text.slice(s, e + 1));
}

function callAgent(prompt) {
  if (AGENT === "claude") {
    return execFileSync("claude", ["-p", prompt], { encoding: "utf8", maxBuffer: 64 << 20, timeout: 600000 });
  }
  if (AGENT === "codex") {
    return execFileSync("codex", ["exec", "--skip-git-repo-check", prompt], { encoding: "utf8", maxBuffer: 64 << 20, timeout: 600000 });
  }
  throw new Error(`unknown agent ${AGENT}`);
}

async function callApi(prompt) {
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  if (process.env.GEMINI_API_KEY) {
    const model = AI_MODEL || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`gemini ${r.status}`);
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  }
  if (process.env.OPENAI_API_KEY) {
    const model = AI_MODEL || "gpt-4o-mini";
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new Error(`openai ${r.status}`);
    return (await r.json()).choices?.[0]?.message?.content || "";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const model = AI_MODEL || "claude-haiku-4-5-20251001";
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 16000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    return (await r.json()).content?.map(c => c.text).join("") || "";
  }
  // Pollinations anonymous text endpoint - OpenAI-compatible, no key.
  const r = await fetch("https://text.pollinations.ai/openai", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL || "openai", messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`pollinations-text ${r.status}`);
  return (await r.json()).choices?.[0]?.message?.content || "";
}

async function generate(prompt) {
  if (AGENT) return callAgent(prompt);
  return callApi(prompt);
}

// ------------------------------------------------------------ validate ---
function normalizeEpisode(raw, motif, i) {
  const slug = `${motif.arc}-tap-0${i + 1}`;
  const ep = {
    id: slug, arc: motif.arc, arcTitle: motif.title.toUpperCase(), episode: i + 1,
    slug,
    title: String(raw.title || `${motif.title} - Tập ${i + 1}`),
    description: String(raw.description || `${motif.title} tập ${i + 1}. #truyenma #kechuyen #truyendangian`),
    tags: Array.isArray(raw.tags) ? raw.tags : ["truyện ma", "truyện ma dân gian", "kể chuyện", motif.arc],
    narrator: "vi-VN-NamMinhNeural",
    locale: "vi", // required by upload-long-teaser (rejects locale!=vi)
    thumbnailSubjects: Array.isArray(raw.thumbnailSubjects) ? raw.thumbnailSubjects : [],
    scenePrompts: raw.scenePrompts && typeof raw.scenePrompts === "object" ? raw.scenePrompts : {},
    beats: [],
  };
  for (const b of raw.beats || []) {
    ep.beats.push({
      speaker: b.speaker || "narrator",
      scene: String(b.scene || "default"),
      caption: String(b.caption ?? "").slice(0, 80),
      text: String(b.text || b.caption || ""),
    });
  }
  if (ep.beats.length < 10) throw new Error(`only ${ep.beats.length} beats`);
  for (const b of ep.beats) {
    if (!b.text) throw new Error("empty beat text");
    if (!ep.scenePrompts[b.scene]) ep.scenePrompts[b.scene] = `${b.scene}, dark Vietnamese rural night, photorealistic, cinematic`;
  }
  return ep;
}

function register(slugs) {
  let src = readFileSync(INDEX_TS, "utf8");
  const varName = s => s.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()).replace(/^[0-9]/, d => `n${d}`);
  const importBlock = slugs.map(s => `import ${varName(s)} from "./${s}.json";`).join("\n") + "\n";
  const lastImport = src.lastIndexOf("import ");
  const eol = src.indexOf("\n", lastImport);
  src = src.slice(0, eol + 1) + importBlock + src.slice(eol + 1);
  src = src.replace(/(\n\]\s+as LongFormEpisode\[\];)/, "\n" + slugs.map(s => `  ${varName(s)},`).join("\n") + "$1");
  writeFileSync(INDEX_TS, src);
}

// ---------------------------------------------------------------- main ---
const pending = unpublishedSlugs();
console.log(`queue-refill: ${pending.length} unpublished episodes (min ${MIN_QUEUE})`);
if (pending.length >= MIN_QUEUE) { console.log("queue OK - nothing to do"); process.exit(0); }
if (!WRITE) { console.log("QUEUE LOW - rerun with --write to generate an arc"); process.exit(2); }

const motif = pickMotif();
console.log(`writing arc "${motif.title}" (${motif.arc}) via ${AGENT || "api/pollinations"}`);

const outline = extractJson(await generate(arcPrompt(motif)));
const premises = (outline.premises || []).slice(0, ARC_SIZE);
if (premises.length !== ARC_SIZE) throw new Error(`outline gave ${premises.length} premises`);

const written = [];
for (let i = 0; i < ARC_SIZE; i++) {
  let ep = null, lastErr = null;
  for (let attempt = 0; attempt < 3 && !ep; attempt++) {
    try { ep = normalizeEpisode(extractJson(await generate(epPrompt(motif, premises, i))), motif, i); }
    catch (e) { lastErr = e; console.warn(`  tap-0${i + 1} attempt ${attempt + 1}: ${e.message}`); }
  }
  if (!ep) throw new Error(`tap-0${i + 1} failed: ${lastErr?.message}`);
  const file = path.join(LONG_DIR, `${ep.slug}.json`);
  writeFileSync(file, JSON.stringify(ep, null, 2) + "\n");
  written.push(ep.slug);
  console.log(`  wrote ${ep.slug} (${ep.beats.length} beats)`);
}

register(written);
console.log("registered in index.ts");
execSync("node scripts/validate-episodes.mjs", { cwd: ROOT, stdio: "inherit" });
console.log("QUEUE REFILLED:", written.join(", "));
