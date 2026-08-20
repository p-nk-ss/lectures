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

- **Content collections** (`site/src/content.config.ts`): `lectures` (MDX, glob loader), `quizzes` (JSON per topic+level), `glossary` (single `terms.json`). Lecture slug starts with its two-digit topic id (`03-terminalni-stany`); topic registry is `src/lib/topics.ts` (ids `01`–`08`), holding each topic's colour and its `icons` triple — the title-slide motif, which must stay distinct per topic. `'heart'` and `'ecg'` are drawn (CSS pixels / `PixelEcg.astro`); the rest map to `public/icons/icon-<name>.png`.
- **Publication gate**: lectures have `status: draft | reviewed | published`. `filterVisible()` (`src/lib/visibility.ts`) hides non-published entries from prod builds; dev and `SHOW_DRAFTS=1` builds show everything. Quizzes and glossary are not gated.
- **Slides**: a custom rehype plugin (`src/lib/rehype-sections.mjs`, wired in `astro.config.mjs`) wraps each `## h2` block into `<section class="slide lecture-section">` at build time — lecture MDX stays plain markdown; the lecture page renders those sections as full-screen presentation slides. `rehypeHeadingIds` must run before it (anchor ids). Slide numbering is assigned at runtime, not in the plugin: the page prepends a title slide and appends a final slide, and the HUD counts every `.slide` in DOM order.
- **Presentation mode**: `Base.astro` takes `variant="presentation"` (used by `lektsiyi/[slug].astro`) — no header, footer, or `.container`; the page owns the viewport and provides its own sticky HUD. Snapping lives on `html[data-variant='presentation']` in `global.css` and is `proximity`, not `mandatory`, so sections taller than the viewport stay scrollable and never clip.
- **Interactivity**: the only Preact island is `src/components/quiz/Quiz.tsx`; its logic lives in pure functions (`src/lib/quiz.ts`, `storage.ts`) covered by vitest. Everything else is Astro components with inline scripts.
- **Client state**: localStorage only, keys prefixed `aiti:` (`aiti:read:{slug}` = '1' when the last slide was reached, `aiti:progress:{slug}` = highest slide index reached, `aiti:quiz:{topic}:{level}`). The home cards derive their progress bars from these.
- **Video library** (`src/pages/video.astro`, nav item «Відео»): built by parsing the `<VideoEmbed>` tags out of each lecture's MDX body (`src/lib/videos.ts`, vitest-covered) and pairing them with the `##` heading they sit under; heading slugs come from `render()`, so each entry deep-links to the exact section. The embeds are the single source of truth — do not build this list from a parallel array, it would drift from the page. `VideoEmbed`'s `description` prop is not rendered on the lecture page; it exists to caption the library entry.
- **Search**: Pagefind runs after `astro build` (see `build` script). `pagefind-ui.js` is UMD — `PagefindUI` lands on `window`, the module namespace is empty (already handled in `SearchModal.astro`; do not revert to `mod.PagefindUI`). Its URL is assembled at runtime (`['', 'pagefind', 'pagefind-ui.js'].join('/')`) so Vite's import-analysis skips it; a string literal there 500s every dev page with an error overlay, `@vite-ignore` notwithstanding.

## Design system — "Pixel Quest"

Retro-game pixel style, spec in `design_handoff_pixelquest/README.md` (the `.dc.html` files there are visual references, not code). **Dark-only** — there is no light theme and no theme toggle; do not reintroduce `[data-theme='light']` without a designed pixel palette.

Tokens live on `:root` in `src/styles/global.css`: `--bg #1a1c2c`, `--surface #24284a`, `--surface-2 #161830`, `--surface-3 #1e2140`, `--ink #0f1020`, `--accent #ffd23e`, `--ok #5ee9a0`, `--danger #ff5f6b` (+ `--danger-bg/--danger-text`), `--title-shadow #b13e53`. Older names (`--border`, `--primary`, `--text-muted`, `--radius`, `--shadow-card`) survive as aliases so components keep resolving — `--radius` is `0`.

Rules: radius 0 everywhere; borders `4px` (`--bw`) or `3px` (`--bw-sm`) solid `--ink`, dashed `--muted-border` for locked; shadows are hard offsets only, never blurred (`--shadow-hard`, `-lg`, `-xl`); hover is an instant press-in (`.press`: `translate(3px,3px)` + shrink shadow + accent border), no transition. Fonts: **Press Start 2P** for headings/labels/HUD/buttons, **IBM Plex Mono** 400/600 for all body text (never below 16px, never pixelated) — both self-hosted via `@fontsource`, cyrillic subsets included.

Animations are stepped (`steps()`), never eased; helpers `.blink/.beat/.bob` live in `global.css`. The global reduced-motion rule kills every animation, so the *unanimated* state must be the visible one — an element that relies on a keyframe to appear would simply vanish. The BLS arrows follow this: they sit dimmed and pulse down the chart through staggered `animation-delay` + `steps(1, end)` + `backwards` (that fill mode is what keeps arrows below the current one dim during their delay), and the reduced-motion block restores them all to full opacity.

Glyphs: Press Start 2P has no `★ ← ▶ ♥ ▼ ⌗ ◆`, so wrap every decorative glyph in `<span class="g">` (switches to the body stack) or it falls back at broken metrics. No emoji in UI chrome. Pixel sprites live in `public/icons/*.png` and must be rendered with `.px` (`image-rendering: pixelated`); the Tabler SVGs in `src/assets/icons/` are now only used by `SearchModal`. `public/icons/professor.png` (the glossary tooltip mascot) was cut out by the author and trimmed to its alpha bounding box.

The glossary tooltip (`T.astro`) is a comic speech balloon: stepped corners from a `clip-path` polygon shared through `--balloon` and resolved per layer (`.tip-ink` outline, `.tip-fill` inset by the 4px border), plus a tapered pixel tail whose outline comes from chained 4px `drop-shadow`s rather than a second aligned layer. `filter: drop-shadow` — not `box-shadow` — carries the offset shadow, since only the former follows the clipped outline.

The balloon is `position: fixed` and placed entirely from script — anchoring it with `absolute` let any ancestor with `overflow` clip it, which cost a term inside a scrollable table the end of its definition. The script clamps it to the viewport, flips it above the term when there is no room below (`data-flip` mirrors the tail), keeps the tail over the term, and repositions on scroll. It then re-measures and corrects by the delta: an ancestor with a transform or filter becomes the containing block for a fixed element, so the viewport coordinates it just wrote are not where the balloon actually landed.

Content mapping inside slides, all driven off plain markdown so MDX stays clean:

- top-level `<ol>` → grid of numbered stage cards; `<ul>` stays a bulleted list.
- top-level `<h3>` → a header bar (surface-2, accent left edge, hard shadow) that splits a long slide into blocks. Its margins are asymmetric on purpose — the big gap is above. Zeroing the top margin is scoped to `h2 + h3` (a bar directly under the slide title); `:first-of-type` would also flatten the first subsection of a long slide, which is exactly where the gap is needed.
- `Important` → red alert card, `Dose` → inventory slot with a pixel sprite (`icon` prop, one card per препарат, no label — the drug name carries it), `ForDoctors`/`ClinicalCase` → green-bordered panels.
- `.media-row` lays figures or video cards two-up (`.media-row.three` for three; both collapse on narrow screens). `Figure` inside `.media-row` is capped by height as well as width (`max-height: 22rem`, `width: auto`, frame `fit-content`) — otherwise a portrait photo renders twice as tall as its landscape neighbour. Standalone figures take `maxWidth` (a tall portrait would otherwise fill the slide) and `light` (a light frame for transparent line art whose labels are dark and vanish on the default surface).
- `VideoEmbed` renders a compact preview card; the player opens in one shared `<dialog>` lightbox built lazily in script and appended to `body` — hence its styles live in `global.css`, out of reach of Astro's scoping. Closing (button, Esc, backdrop) all route through the `close` event, which **drops the iframe**: merely hiding the dialog leaves the audio playing.

Layout gotchas:

- `.slide` uses `grid-template-columns: minmax(0, 1000px)` — the `minmax(0, …)` is what keeps wide tables and figures from blowing out mobile.
- Hand-made SVG schemes need explicit `width`/`height` attributes, not just a `viewBox`: without an intrinsic size the SVG stretches to the container and scales every stroke and label with it (the BLS chart rendered at 2.3×). Size text boxes for **IBM Plex Mono**, which is far wider than a proportional font — that is why the BLS boxes are 420px for ~42-character captions.
- A hovered card that gets the press-in `transform` becomes a stacking context, trapping any glossary balloon opened inside it: later siblings paint over it however high the balloon's own `z-index`. Cards that can contain a `<T>` therefore also take `z-index` on `:hover`/`:focus-within`.
- Inside an SVG scheme, a CSS rule beats a presentation attribute: a second outline copy written as `<ellipse class="mouth" fill="none">` is repainted solid by `.mouth { fill: … }`. Give the outline its own class.
- Deliberately over-scaled images (e.g. `MallampatiRow`, which crops one quadrant by showing the file at 200% and offsetting it) need `max-width: none` — the `.prose img { max-width: 100% }` rule otherwise clamps the width only, squashing the picture.
- The glossary balloon sits inside prose, so it must reset every inherited text property, not just size: a `<T>` in a table header pulled in Press Start 2P and `text-transform: uppercase` from `.prose th`. `T.astro` now pins `font-family`, `font-weight`, `font-style`, `text-transform` and `letter-spacing`.

## Content rules (medical)

- Every medical claim (doses, protocols, algorithm steps) must come from a verifiable source: ERC 2021/2025, AHA 2020/2025, МОЗ України orders, textbooks. Nothing from memory.
- Each lecture gets an audit/review doc in `docs/reviews/<slug>.md` (claim → status → current recommendation → source) plus an author checklist. Deviations from the source pptx are marked with `{/* CHANGED: ... */}` comments in the MDX; edits that leave the claim intact (wording, notation, splitting one callout into several) get a `{/* Notation only: ... */}` / `{/* Presentation only: ... */}` comment instead, so review can skip them.
- Routes of administration are written `в/в` and `в/к`, spelled out in full at the first mention in a lecture and abbreviated after (never glued as `в/в/в.к.`). Keep the notation in sync between the MDX and that topic's quiz explanations.
- A term explained on the page belongs in `src/content/glossary/terms.json` and is wrapped in `<T id="…">` at its first mention. Prefer reusing wording already reviewed elsewhere in the lecture over writing a fresh definition. Note that `Figure`'s caption is a prop, so terms there cannot be wrapped.
- **No AI-generated medical illustrations.** Allowed visuals: hand-made SVG schemes (`src/components/algorithms/`), open-licensed media (PD/CC0/CC-BY) embedded via `Figure.astro` with the license in the caption, and YouTube lite-embeds (`VideoEmbed.astro`). `Figure`'s `license` prop is optional only for author-supplied images whose provenance is still open — those are tracked in the lecture's review doc and must be resolved before `status: published`. Never invent an attribution to fill the field.
- Raster images inside the source pptx files (`lectures/*.pptx`, untracked) have unknown licenses — do not copy them into the site. The same goes for the repo-root `images/` folder: those are watermarked stock previews. Check any candidate asset before shipping it — amplifying the near-white greys (225–252) over a white background reveals an agency watermark that is invisible at a glance.
- Publication pipeline: `draft` → review doc → author reads and approves → set `status: published` → merge to `main`.

New lectures repeat Task 12 of `docs/superpowers/plans/2026-08-17-lectures-site.md` (topic 05 has no pptx; build its outline from `Анестезіологія_та_інтенсивна_терапія.docx`).

## Deploy & accounts

- GitHub remote: `p-nk-ss/lectures` (personal). **Never create repos or push as `pankazjha-lnoks` — that is the user's work account** (both are logged into `gh`; keep `p-nk-ss` active).
- Cloudflare Pages: root directory `site`, build `npm run build`, output `dist`; Preview environment sets `SHOW_DRAFTS=1`, production does not.

## Known warnings

Both are known and harmless:

- `[astro] markdown.rehypePlugins ... deprecated` at build time — the config still works on Astro 7.
- `Pagefind doesn't support stemming for the language uk` — search works, it just will not match across word forms.
