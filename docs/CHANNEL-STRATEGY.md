# Channel analysis & strategy — 2026-09-24

Data source: `src/suckhoe/channel-report-vi.md`, `channel-report-en.md`,
`published.json`, git history. Written by the SDLC Discovery phase; this
document is the binding input for every content/marketing decision below.

## 1. Hard numbers

| Metric | VI "Bà Lang Mách Mẹo" | EN "Grandma's Home Remedies" |
|---|---|---|
| Subscribers | 250 | 0 |
| Total views (lifetime) | 3,015 | 233 |
| Videos | 81 | 78 |
| Views, last 28 days | 116 | 82 |
| Watch time, last 28 days | 24 min | 9 min |
| Net subs, last 28 days | -1 | 0 |
| **Views of last 25 uploads** | **0 / 25 videos** | **0 / 25 videos** |

Publishing history (`published.json`):

- 2026-08-22 → 08-28: ~50 uploads in one week (the documented
  mass-upload incident). Channel-report shows views collapsing to
  near-zero starting **2026-08-23** — channel-level suppression kicked in
  and **never lifted**.
- 2026-09-02 → 09-05: second burst (23 uploads in 4 days).
- 2026-09-15 → now: ~5/day steady cadence — **every single upload scores
  0 views**. This is not "low reach", it is zero distribution.
- EN channel additionally shows a **4× duplicate upload** of the same
  video on 2026-09-17 (queue/dedupe bug — fixed in this workstream via
  video_id recording, see PRD R-17).

## 2. Diagnosis

Both channels sit inside YouTube's **mass-produced / repetitious-content
reduced-distribution state** (the same classifier family that hit the
TikTok strike history documented in README). Evidence:

1. Distribution dropped to *exactly* zero and stayed there for 4+ weeks —
   a channel-level flag, not per-video scoring (a healthy channel always
   gets a handful of impressions per Short).
2. Cadence reduction (7/day → 3-4/day) did **not** recover reach, because
   the *content fingerprint* never changed — same template, same TTS
   voice, same silhouette, same structure, same background. Rate was the
   trigger; sameness is what keeps the flag set.
3. The niche (health remedies) is YMYL — the strictest quality bar on the
   platform. A template-farm fingerprint in YMYL gets the least benefit
   of the doubt.
4. EN channel: 0 subs after 78 videos confirms the same suppression from
   day one — the EN clone inherited the fingerprint, not just the code.

## 3. Strategy ruling

**Speed of uploads was never the product — differentiation is.** The
pipeline's job changes from "publish more" to "publish differently".
Concretely:

### 3.1 Stop feeding the classifier
- Drop scheduled mass publishing immediately: **1 upload/day max per
  channel**, and only videos produced by the upgraded pipeline (music,
  SFX, captions, varied visuals — see PRD §A). Uploading more of the same
  template at any cadence only re-confirms the flag.
- Do NOT bulk-upload the remaining episode backlog. The queue should
  drain through the new format only.

### 3.2 Change the content fingerprint (the real fix)
Everything in workstream A exists for this: music bed, SFX, karaoke
captions, per-category palettes, ingredient imagery, varied hook styles.
A human reviewer must be able to tell two consecutive uploads apart in
the first 3 seconds — that is the bar.

### 3.3 Dual-track channel plan
- **Track A — rehabilitation (default):** keep both channels, run the new
  format at ≤1/day for 3-4 weeks, watch `channel-report` for the first
  non-zero impressions. No impressions after ~4 weeks of new-format
  uploads → the flag is effectively permanent.
- **Track B — relaunch trigger:** if Track A fails, launch a new channel
  with the upgraded pipeline from day one (new fingerprint, no upload
  bursts, max 1/day). Cost of a fresh channel is low (250 subs is not a
  moat); keeping a permanently flagged one costs more.
- Both decisions are data-driven via `channel-report` — already
  automated. Add the "impressions/views > 0" check as the explicit
  go/no-go signal.

### 3.4 Diversify distribution beyond the Shorts feed
- **Long-form is the recovery lever already in the repo.** 20-minute
  episodes earn search + suggested traffic, which does not depend on the
  Shorts-feed classifier. Prioritize `suckhoe-long` output (1/week) while
  Shorts run at reduced cadence.
- The animated-film series ("Nha Ba Tu") is a second, non-YMYL
  fingerprint — a healthy hedge if health content stays suppressed.

### 3.5 Marketing loop upgrades (workstream C)
The analytics→content loop is the missing organ: strategy-report job,
comment→episode mining, title/hook variants, trend radar, publish-slot
learning. These make the agent act like a channel manager, not a cron.

### 3.6 Non-negotiable compliance (unchanged, now enforced in code)
YMYL rules move from README prose into `validate-episodes.mjs`: banned
claim words ("chữa", "trị", "thay thuốc", "cure", "treat"), mandatory
folk-wisdom framing, ingredient caution fields. CI fails the build before
a non-compliant episode can ever upload — one strike could kill a
channel that is already on probation.

## 4. Success metrics (check weekly via channel-report)

| Signal | Bad (current) | Recovery | Healthy |
|---|---|---|---|
| Views per new Short, first 72h | 0 | 50-500 | 1k+ |
| Channel views / 28d | ~100 | 1k+ | 10k+ |
| Net subs / 28d | ≤0 | +10 | +100 |
| Avg view duration | n/a (no impressions) | >70% of length | >85% |

## 5. Explicitly out of scope
- Buying ads / paid subs (violates YT ToS, and pointless at 0 organic).
- Re-uploading deleted catalog under new titles (double-dipping the same
  fingerprint).
- New channel creation — Track B is a *decision point*, executed only
  after the 3-4 week rehabilitation window, and channel creation itself
  is a manual Google-account step.
