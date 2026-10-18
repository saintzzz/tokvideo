# PO-001 — Arc-per-day publishing cadence + topic roadmap

Owner directive 2026-10-13: "1 ngày phải đăng đủ số tập của 1 câu
chuyện" + "nghiên cứu thời gian nào dễ được viral nhất" + PO chủ động
chọn nội dung -> tạo video -> đăng.

## 1. Why arc-per-day

Evidence from the Giếng Cũ launch (2026-10-10): all 5 episodes were
uploaded within ~10 minutes of each other. Result after 48h — tập 1
got 23 views (~10-20x every Short on the channel), tập 2-5 got ~1
each. YouTube promotes at most one video per channel at a time; a
same-minute batch makes only the first eligible for distribution.

Fix: the whole arc ships inside ONE day, episodes ~3h apart, sequenced
through the day's audience peaks so binge-viewers always find the next
tập already up.

## 2. Publish slots (researched)

Vietnamese YouTube audience peaks (multiple VN creator sources, 2025):
- 06:00-08:00 — morning commute / wake-up check
- 11:00-13:00 — lunch break
- 17:00-19:00 — after work/school
- 19:00-23:00 — prime time; horror/audio-story content specifically
  skews night (radio-style listening before sleep), 21-23h retention
  is highest for long-form narrative
- Weekdays > weekends for serialized fiction; Thu strongest.

Chosen ticks (cron `30 22,3,6,9,12,15 * * *`):

| Slot (VN) | Audience window |
|---|---|
| 05:30 | early-morning listeners; also the only slot allowed to start a NEW arc |
| 10:30 | mid-morning |
| 13:30 | lunch |
| 16:30 | afternoon |
| 19:30 | evening prime |
| 22:30 | night prime (horror sweet spot) |

Uploads land ~40-60 min after the tick (voiceover+render+thumbnail
pipeline), so the effective publish times are ~06:10 / 11:10 / 14:10 /
17:10 / 20:10 / 23:10 — a 5-episode arc completes by ~20:10 the same
day, ending right as the night-horror audience comes online.

Arc atomicity is enforced in `scripts/next-long-form-slug.mjs`: an
episode that starts a new arc is only eligible while VN hour is
05:00-08:59; a continuing-arc episode is eligible at every tick.
Failed ticks simply retry at the next slot — 6 slots vs 5 eps leaves
one slot of slack.

## 3. Topic roadmap (PO pick)

Ranking the next arcs by VN horror-market demand signals (what the big
story channels — Đình Soạn, Duy Thuận, Radio Âm Dương — run on):

| Rank | Theme | Why |
|---|---|---|
| 1 (queued) | **Dung Trả Lời** — vong mimicking voices, Xóm Cuối Đèo | already written+imaged; "ma giả tiếng người thân" is a top-tier VN fear trope |
| 2 | **Gia tộc nuôi ma gà** — a family bound to a spirit jar (hũ ma), each generation pays a price | "bùa ngải / nuôi ma" is the single strongest VN horror niche after làng quê; deep folklore roots (Tày/Nùng ma gà legend), serial-friendly |
| 3 | **Quỷ nhập tràng / tử thi trỗi dậy** — funeral-night corpse possession | proven performer (Đình Soạn's flagship theme), strong visual hooks |
| 4 | **Miền tây sông nước — ma da / xác chết trôi** | distinct region flavor, reuses river/mist visuals, "truyện ma có thật" SEO |
| 5 | Serial "Nhà Ma" style domestic hauntings | safest fallback, but closest to what we already did (Giếng Cũ) — lower differentiation |

PO decision: next arc after Dung Trả Lời = **"Hũ Ma Gà"** (5 tập,
family curse around a spirit jar — greed, inheritance, a price paid
per generation). Differentiated from both existing arcs (well-ghost vs
voice-mimic vs family-sorcery), highest niche demand, and scene assets
are cheap to generate (đồng quê Bắc Bộ / vùng cao, hũ sành, ban thờ,
đình làng).

**Status**: `hu-ma-ga-tap-01..05.json` written (42/36/29/29/27 beats),
scene prompts + metadata included; scene images generating via
`generate-story-visuals.mjs --long` (Pollinations anon tier, slow).
Twist structure: tập 1-3 là "ma ám gia tộc" kinh điển, tập 4 lộ oan hồn
trong hũ chính là người bán ma bị ông cố giết — arc biến thành chuyện
nợ và chuộc lỗi, khác biệt hẳn 2 arc trước.

**Arc 4 — "Đêm Khâm Liệm" (rank 3, tử thi trỗi dậy), written 2026-10-18:**
`dem-kham-liem-tap-01..05.json` (38/28/27/20/17 beats). Nhân chứng Hải
về lo tang ông nội; đêm khâm liệm đầu xác ngồi dậy, thầy cúng phán
vong nhập tràng đến đúng nhà này vì cái rương phong ấn trên gác —
xương cô gái chết oan bị nhà điền chủ thỉnh hồn giữ làm "tài sản"
70 năm. Twist tập 4: ông nội chính là Tốn, người tình bị đánh trục
xuất của cô Lụa — ông giữ rương không vì lộc mà vì yêu và sợ thả
sai lễ cô tan hồn. Arc kết bằng lễ hội hồn: hai hồn gặp nhau một
lần rồi cùng siêu (kèm hồn đứa con trong bụng — rương 2 hồn).

## 4. What the PO measures each arc

From `channel-report-vi.md` per-arc, 72h after the arc completes:
- tập 1 views (seed metric) — Giếng Cũ baseline: 23
- arc completion ratio — views tập 5 / views tập 1 (want ≥ 40%;
  measures whether viewers binge the arc)
- impressions CTR in Studio when available
- subs delta over the arc week

Decision rule: if two consecutive arcs land tập-1 views < 10, the
format (not the topic) is the problem — revisit production quality
before writing more arcs. If a theme clearly outperforms, double down
on that theme for the next arc instead of rotating.
