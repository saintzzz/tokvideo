# Feature Map - tokvideo

> Mined 2026-11-24 (intake brownfield rule). Repo is primarily a Remotion video-pipeline codebase; the HTML below is an internal design artifact, not a product page.

## Blender concept: Ba Tu model sheet (internal asset)
- **Purpose:** visual reference sheet for the "Ba Tu" character used in video productions
- **Route:** `blender/ba-tu-concept.html` (open locally, not deployed)
- **Preconditions:** none
- **Baseline:** model sheet renders (title "Ba Tu Model Sheet")
- **Code entry:** `blender/ba-tu-concept.html`
- **State owner:** none (static asset)
- **Updated:** 2026-11-24 | by intake FM mining

## Video pipeline flows (see AGENTS.md)
- **Purpose:** English Arena ad episodes + suckhoe long-form renders
- **Entry:** `src/english-arena/episodes/<slug>.json` -> `node scripts/render-english-arena.mjs <slug>`
- **Code entry:** `scripts/render-english-arena.mjs`, `scripts/generate-voiceover.mjs`, `scripts/lib/captions.mjs`
- **State owner:** episode JSONs under `src/english-arena/episodes/` + committed media dirs
- **Updated:** 2026-11-24 | by intake FM mining
