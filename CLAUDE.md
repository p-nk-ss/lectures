# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static lecture site "Анестезіологія та інтенсивна терапія" for `lectures.pankaz.dev`. UI and content language is **Ukrainian**; code comments are English. The Astro project lives in `site/` — run all npm commands from there.

## Commands

```bash
cd site
npm run dev          # dev server (daemonizes in Astro 7; drafts visible)
npx astro dev stop   # stop the daemonized dev server (also: status, logs)
npm run build        # prod build + Pagefind index (drafts EXCLUDED)
SHOW_DRAFTS=1 npm run build   # preview-style build that includes drafts
npm run preview      # serve dist/ (also daemonizes; npx astro preview stop)
npm test             # vitest run (all)
npx vitest run src/lib/quiz.test.ts   # single test file
npm run check        # astro check (types)
```

Full-text search (Ctrl+K) only works against a built site (`npm run build && npm run preview`); in dev the modal shows a fallback message.

## Architecture

- **Content collections** (`site/src/content.config.ts`): `lectures` (MDX, glob loader), `quizzes` (JSON per topic+level), `glossary` (single `terms.json`). Lecture slug starts with its two-digit topic id (`03-terminalni-stany`); topic registry with colors is `src/lib/topics.ts` (ids `01`–`08`).
- **Publication gate**: lectures have `status: draft | reviewed | published`. `filterVisible()` (`src/lib/visibility.ts`) hides non-published entries from prod builds; dev and `SHOW_DRAFTS=1` builds show everything. Quizzes and glossary are not gated.
- **Section cards**: a custom rehype plugin (`src/lib/rehype-sections.mjs`, wired in `astro.config.mjs`) wraps each `## h2` block into `<section class="lecture-section">` at build time — lecture MDX stays plain markdown; the lecture page styles sections as numbered timeline cards. `rehypeHeadingIds` must run before it (anchor ids for TOC).
- **Interactivity**: the only Preact island is `src/components/quiz/Quiz.tsx`; its logic lives in pure functions (`src/lib/quiz.ts`, `storage.ts`) covered by vitest. Everything else is Astro components with inline scripts.
- **Client state**: localStorage only, keys prefixed `aiti:` (`aiti:theme`, `aiti:read:{slug}`, `aiti:quiz:{topic}:{level}`).
- **Search**: Pagefind runs after `astro build` (see `build` script). `pagefind-ui.js` is UMD — `PagefindUI` lands on `window`, the module namespace is empty (already handled in `SearchModal.astro`; do not revert to `mod.PagefindUI`).

## Design system

Dark-first: tokens on `:root` in `src/styles/global.css`, light theme via `[data-theme='light']` override (toggle stores `aiti:theme`; dark is the default, not system-dependent). Style direction: 21st.dev/Linear — glass surfaces, ambient glows, dot-grid background, indigo→violet accent. Icons are vendored Tabler SVGs in `src/assets/icons/` rendered via `Icon.astro` (`?raw` imports; the `@tabler/icons` npm exports map blocks subpath imports). No emoji in UI chrome. All motion respects `prefers-reduced-motion`.

Layout gotcha: lecture grid children need `min-width: 0` — sections have no `overflow: hidden` (the timeline number dots hang outside the card), so without it long content blows out mobile layouts.

## Content rules (medical)

- Every medical claim (doses, protocols, algorithm steps) must come from a verifiable source: ERC 2021/2025, AHA 2020/2025, МОЗ України orders, textbooks. Nothing from memory.
- Each lecture gets an audit/review doc in `docs/reviews/<slug>.md` (claim → status → current recommendation → source) plus an author checklist. Deviations from the source pptx are marked with `{/* CHANGED: ... */}` comments in the MDX.
- **No AI-generated medical illustrations.** Allowed visuals: hand-made SVG schemes (`src/components/algorithms/`), open-licensed media (PD/CC0/CC-BY) embedded via `Figure.astro` with the license in the caption, and YouTube lite-embeds (`VideoEmbed.astro`).
- Raster images inside the source pptx files (`lectures/*.pptx`, untracked) have unknown licenses — do not copy them into the site.
- Publication pipeline: `draft` → review doc → author reads and approves → set `status: published` → merge to `main`.

New lectures repeat Task 12 of `docs/superpowers/plans/2026-08-17-lectures-site.md` (topic 05 has no pptx; build its outline from `Анестезіологія_та_інтенсивна_терапія.docx`).

## Deploy & accounts

- GitHub remote: `p-nk-ss/lectures` (personal). **Never create repos or push as `pankazjha-lnoks` — that is the user's work account** (both are logged into `gh`; keep `p-nk-ss` active).
- Cloudflare Pages: root directory `site`, build `npm run build`, output `dist`; Preview environment sets `SHOW_DRAFTS=1`, production does not.

## Known warnings

`[astro] markdown.rehypePlugins ... deprecated` at build time is known and harmless on Astro 7; the config still works.
