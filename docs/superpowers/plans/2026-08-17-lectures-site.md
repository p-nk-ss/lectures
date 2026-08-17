# Lectures Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Статический сайт лекций «Анестезіологія та інтенсивна терапія» на `lectures.pankaz.dev`: каркас (дизайн-система, шаблон лекции, квиз-движок, поиск, глоссарий) + пилотная лекция «Термінальні стани» + деплой на Cloudflare Pages.

**Architecture:** Astro 5 (Content Collections, static output) в подпапке `site/` репозитория. Интерактив — Preact-островки (квиз, поиск-модалка). Контент — MDX-лекции с гейтом публикации по `status`, квизы — JSON-коллекция, глоссарий — JSON. Поиск — Pagefind поверх собранной статики.

**Tech Stack:** Astro 5, Preact, MDX, Pagefind, Vitest, plain CSS (custom properties, без Tailwind), @fontsource-variable (Inter, Manrope), Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-08-17-lectures-site-design.md`

## Global Constraints

- Язык UI и контента — **украинский**. Комментарии в коде — английский.
- Сайт полностью статический: без БД, логинов, серверного кода. Прогресс — только `localStorage`, префикс ключей `aiti:`.
- Гейт публикации: в прод-сборку попадают только лекции `status: published`. Черновики видны в dev и в preview-сборках с env `SHOW_DRAFTS=1`.
- Медицинские данные (дозировки, протоколы) — только из проверяемых источников со ссылкой (ERC 2021+, AHA 2020/2025, наказы МОЗ Украины, учебники). Ничего «по памяти».
- Запрещена ИИ-генерация медицинских иллюстраций. Только SVG-схемы, открытые медиа (с лицензией в подписи), YouTube lite-embed.
- Mobile-first: базовые стили — для узкого экрана, `@media (min-width: …)` — расширения.
- Идентификаторы тем: `01`…`08` (двухзначная строка). Slug лекции начинается с id темы: `03-terminalni-stany`.
- Node 20+. Рабочая директория сайта — `site/` (все npm-команды оттуда).
- Astro-проект: `output: 'static'` (default), интеграции `@astrojs/preact`, `@astrojs/mdx`.

---

## File Structure

```
site/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── content.config.ts            # схемы коллекций
│   ├── content/
│   │   ├── lectures/03-terminalni-stany.mdx   # пилот (+ 99-test.mdx dev-фикстура)
│   │   ├── quizzes/03-nurse.json, 03-doctor.json
│   │   └── glossary/terms.json
│   ├── lib/
│   │   ├── topics.ts                # реестр 8 тем (id, название, цвет)
│   │   ├── visibility.ts            # фильтр публикации
│   │   ├── quiz.ts                  # логика квиза (чистые функции)
│   │   └── storage.ts               # localStorage-обёртки
│   ├── styles/global.css            # дизайн-токены, база, prose
│   ├── components/
│   │   ├── callouts/ (Important, Dose, ForDoctors, ClinicalCase).astro
│   │   ├── VideoEmbed.astro
│   │   ├── T.astro                  # термин-tooltip
│   │   ├── Algorithm.astro          # обёртка SVG-схем
│   │   ├── algorithms/BLS.astro     # пилотная схема
│   │   ├── SearchModal.astro
│   │   └── quiz/Quiz.tsx            # Preact-островок
│   ├── layouts/Base.astro
│   └── pages/
│       ├── index.astro
│       ├── lektsiyi/[slug].astro
│       ├── tests/index.astro
│       ├── tests/[topic]/[level].astro
│       └── glossary.astro
├── content-src/                     # (в корне репо) извлечённый сырой текст pptx
└── docs/reviews/                    # (в корне репо) ревью-документы лекций
```

---

### Task 1: Scaffold Astro-проекта

**Files:**
- Create: `site/` (astro-проект), `site/astro.config.mjs`, `site/package.json`, `.gitignore` (корень репо)

**Interfaces:**
- Produces: рабочий Astro 5 проект с Preact, MDX, Vitest; команды `npm run dev|build|test|check` из `site/`.

- [ ] **Step 1: Создать проект**

Из корня репозитория (`D:\projects\lectures`):

```bash
npm create astro@latest site -- --template minimal --typescript strict --no-install --no-git
cd site
npm install
npx astro add preact mdx --yes
npm install -D vitest @astrojs/check typescript pagefind @fontsource-variable/inter @fontsource-variable/manrope
```

- [ ] **Step 2: Конфиг Astro**

`site/astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://lectures.pankaz.dev',
  integrations: [preact(), mdx()],
});
```

- [ ] **Step 3: Скрипты и vitest**

В `site/package.json` секция scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

`site/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node' },
});
```

- [ ] **Step 4: .gitignore в корне репо**

Добавить (создать файл, если нет):

```
node_modules/
site/dist/
site/.astro/
.~lock.*
```

- [ ] **Step 5: Проверка**

Run: `cd site && npm run build`
Expected: сборка проходит (pagefind отработает по пустому dist — предупреждение допустимо).

- [ ] **Step 6: Commit**

```bash
git add site .gitignore
git commit -m "feat: scaffold Astro project with Preact, MDX, Vitest, Pagefind"
```

---

### Task 2: Дизайн-токены, глобальные стили, Base layout

**Files:**
- Create: `site/src/styles/global.css`, `site/src/layouts/Base.astro`, `site/src/lib/topics.ts`
- Modify: `site/src/pages/index.astro` (временная заглушка на Base)

**Interfaces:**
- Produces: `Base.astro` с props `{ title: string; description?: string }`, слот `default`; CSS-переменные `--bg --surface --surface-2 --text --text-muted --border --primary --primary-soft --danger --warn --ok --radius --font-heading --font-body --topic-01…--topic-08`; `TOPICS: Topic[]` из `topics.ts` где `Topic = { id: string; order: number; module: 1|2; title: string; short: string; color: string }`.

- [ ] **Step 1: Реестр тем**

`site/src/lib/topics.ts`:

```ts
export interface Topic {
  id: string;        // '01'..'08'
  order: number;
  module: 1 | 2;
  title: string;     // полное название темы
  short: string;     // короткое для карточек/навигации
  color: string;     // CSS var reference
}

export const TOPICS: Topic[] = [
  { id: '01', order: 1, module: 1, title: 'Поняття про анестезіологію та реаніматологію. Види анестезії', short: 'Анестезіологія та реаніматологія', color: 'var(--topic-01)' },
  { id: '02', order: 2, module: 1, title: 'Інгаляційний наркоз і неінгаляційний наркоз', short: 'Наркоз', color: 'var(--topic-02)' },
  { id: '03', order: 3, module: 1, title: 'Термінальні стани', short: 'Термінальні стани', color: 'var(--topic-03)' },
  { id: '04', order: 4, module: 1, title: 'Реанімація та інтенсивна терапія при гострій серцево-судинній недостатності', short: 'Гостра серцево-судинна недостатність', color: 'var(--topic-04)' },
  { id: '05', order: 5, module: 1, title: 'Реанімація та інтенсивна терапія при гострій дихальній недостатності', short: 'Гостра дихальна недостатність', color: 'var(--topic-05)' },
  { id: '06', order: 6, module: 2, title: 'Види шоку: клініка, діагностика, реанімація та інтенсивна терапія', short: 'Шок', color: 'var(--topic-06)' },
  { id: '07', order: 7, module: 2, title: 'Коматозні стани: клініка, діагностика, реанімація та інтенсивна терапія', short: 'Коматозні стани', color: 'var(--topic-07)' },
  { id: '08', order: 8, module: 2, title: 'Гострі отруєння: клініка, діагностика, реанімація та інтенсивна терапія', short: 'Гострі отруєння', color: 'var(--topic-08)' },
];

export const topicById = (id: string): Topic | undefined => TOPICS.find((t) => t.id === id);
```

- [ ] **Step 2: global.css**

`site/src/styles/global.css` (база; при реализации UI-задач полировать с опорой на скилы frontend-design / ui-ux-pro-max, направление — современный эдтех):

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/manrope';

:root {
  --font-heading: 'Manrope Variable', system-ui, sans-serif;
  --font-body: 'Inter Variable', system-ui, sans-serif;

  --bg: #f7f7fb;
  --surface: #ffffff;
  --surface-2: #eef0f7;
  --text: #1a1c2c;
  --text-muted: #5b607a;
  --border: #dcdfeb;

  --primary: #5b5bd6;
  --primary-soft: #e9e9fc;
  --danger: #e5484d;
  --warn: #f5a524;
  --ok: #30a46c;

  --topic-01: #5b5bd6;
  --topic-02: #0e9888;
  --topic-03: #e5484d;
  --topic-04: #d6409f;
  --topic-05: #0091ff;
  --topic-06: #f76b15;
  --topic-07: #8e4ec6;
  --topic-08: #46a758;

  --radius: 14px;
}

[data-theme='dark'] {
  --bg: #12131c;
  --surface: #1b1d2a;
  --surface-2: #232636;
  --text: #ecedf5;
  --text-muted: #9aa0bd;
  --border: #323650;
  --primary: #7c7ce8;
  --primary-soft: #26264a;
}

* { box-sizing: border-box; }
html { color-scheme: light; }
html[data-theme='dark'] { color-scheme: dark; }

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.7;
  background: var(--bg);
  color: var(--text);
}

h1, h2, h3, h4 { font-family: var(--font-heading); line-height: 1.25; }

.container { max-width: 72rem; margin-inline: auto; padding-inline: 1rem; }
.prose { max-width: 42rem; }
.prose img { max-width: 100%; height: auto; border-radius: var(--radius); }
.prose figcaption { font-size: 0.85rem; color: var(--text-muted); }
.prose table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; }
.prose th, .prose td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
```

- [ ] **Step 3: Base layout**

`site/src/layouts/Base.astro`:

```astro
---
import '../styles/global.css';

interface Props { title: string; description?: string }
const { title, description = 'Лекції з анестезіології та інтенсивної терапії' } = Astro.props;
---
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <script is:inline>
      const t = localStorage.getItem('aiti:theme');
      if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches))
        document.documentElement.dataset.theme = 'dark';
    </script>
  </head>
  <body>
    <header class="site-header">
      <div class="container nav">
        <a href="/" class="brand">АіІТ · лекції</a>
        <nav>
          <a href="/tests/">Тести</a>
          <a href="/glossary/">Глосарій</a>
          <button id="search-open" aria-label="Пошук">🔍</button>
          <button id="theme-toggle" aria-label="Тема">◐</button>
        </nav>
      </div>
    </header>
    <main class="container"><slot /></main>
    <footer class="container site-footer">
      <p>Навчальні матеріали. Не замінюють клінічні протоколи та призначення лікаря.</p>
    </footer>
    <script>
      document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const root = document.documentElement;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next === 'dark' ? 'dark' : '';
        if (next === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
        localStorage.setItem('aiti:theme', next);
      });
    </script>
    <style>
      .site-header { position: sticky; top: 0; background: var(--surface); border-bottom: 1px solid var(--border); z-index: 10; }
      .nav { display: flex; align-items: center; justify-content: space-between; padding-block: 0.6rem; }
      .brand { font-family: var(--font-heading); font-weight: 800; text-decoration: none; color: var(--text); }
      nav { display: flex; gap: 0.75rem; align-items: center; }
      nav a { color: var(--text-muted); text-decoration: none; font-weight: 600; }
      nav button { background: none; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; color: var(--text); padding: 0.25rem 0.5rem; }
      .site-footer { color: var(--text-muted); font-size: 0.85rem; padding-block: 2rem; }
    </style>
  </body>
</html>
```

- [ ] **Step 4: Заглушка главной**

`site/src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Анестезіологія та інтенсивна терапія — лекції">
  <h1>Анестезіологія та інтенсивна терапія</h1>
  <p>Каркас. Контент — далі.</p>
</Base>
```

- [ ] **Step 5: Проверка**

Run: `cd site && npm run check && npm run build`
Expected: без ошибок типов, сборка ок.

- [ ] **Step 6: Commit**

```bash
git add site
git commit -m "feat: design tokens, base layout, theme toggle, topics registry"
```

---

### Task 3: Content Collections + фильтр публикации (TDD)

**Files:**
- Create: `site/src/content.config.ts`, `site/src/lib/visibility.ts`, `site/src/lib/visibility.test.ts`, `site/src/content/lectures/99-test.mdx`, `site/src/content/quizzes/99-nurse.json`, `site/src/content/glossary/terms.json`

**Interfaces:**
- Consumes: —
- Produces: коллекции `lectures`, `quizzes`, `glossary`; `filterVisible<T extends { data: { status: string } }>(entries: T[], opts: { prod: boolean; showDrafts: boolean }): T[]`; `showDrafts()` — читает `import.meta.env.SHOW_DRAFTS`. Схема квиза = типу `Question` из Task 5.

- [ ] **Step 1: Failing test**

`site/src/lib/visibility.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { filterVisible } from './visibility';

const e = (status: string) => ({ data: { status } });

describe('filterVisible', () => {
  it('prod: only published', () => {
    const r = filterVisible([e('draft'), e('reviewed'), e('published')], { prod: true, showDrafts: false });
    expect(r.map((x) => x.data.status)).toEqual(['published']);
  });
  it('prod + SHOW_DRAFTS: everything', () => {
    const r = filterVisible([e('draft'), e('published')], { prod: true, showDrafts: true });
    expect(r).toHaveLength(2);
  });
  it('dev: everything', () => {
    const r = filterVisible([e('draft')], { prod: false, showDrafts: false });
    expect(r).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `cd site && npm test`
Expected: FAIL — `Cannot find module './visibility'`.

- [ ] **Step 3: Implement**

`site/src/lib/visibility.ts`:

```ts
export function filterVisible<T extends { data: { status: string } }>(
  entries: T[],
  opts: { prod: boolean; showDrafts: boolean },
): T[] {
  if (!opts.prod || opts.showDrafts) return entries;
  return entries.filter((e) => e.data.status === 'published');
}

export const showDrafts = (): boolean => import.meta.env.SHOW_DRAFTS === '1';
```

- [ ] **Step 4: Run — verify pass**

Run: `cd site && npm test`
Expected: PASS (3 tests).

- [ ] **Step 5: Схемы коллекций**

`site/src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const lectures = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lectures' }),
  schema: z.object({
    title: z.string(),
    module: z.union([z.literal(1), z.literal(2)]),
    order: z.number().int().positive(),
    description: z.string(),
    updatedAt: z.coerce.date(),
    sources: z.array(z.string()).default([]),
    videos: z.array(z.string().url()).default([]),
    status: z.enum(['draft', 'reviewed', 'published']).default('draft'),
  }),
});

const question = z.object({
  id: z.string(),
  type: z.enum(['single', 'multiple']),
  text: z.string(),
  vignette: z.string().optional(),
  options: z.array(z.string()).min(4).max(5),
  correct: z.array(z.number().int().nonnegative()).min(1),
  explanation: z.string(),
});

const quizzes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/quizzes' }),
  schema: z.object({
    topic: z.string().regex(/^\d{2}$/),
    level: z.enum(['nurse', 'doctor']),
    questions: z.array(question).min(1),
  }),
});

const glossary = defineCollection({
  loader: file('./src/content/glossary/terms.json'),
  schema: z.object({
    id: z.string(),
    term: z.string(),
    definition: z.string(),
    synonyms: z.array(z.string()).default([]),
  }),
});

export const collections = { lectures, quizzes, glossary };
```

- [ ] **Step 6: Фикстуры**

`site/src/content/lectures/99-test.mdx` (dev-фикстура, всегда draft, в прод не попадает):

```mdx
---
title: 'Тестова лекція (dev)'
module: 1
order: 99
description: 'Фікстура для перевірки компонентів. Не публікується.'
updatedAt: 2026-08-17
status: draft
---

## Розділ 1

Текст для перевірки типографіки.
```

`site/src/content/quizzes/99-nurse.json`:

```json
{
  "topic": "99",
  "level": "nurse",
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "text": "Тестове питання: 2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correct": [1],
      "explanation": "Арифметика."
    }
  ]
}
```

`site/src/content/glossary/terms.json`:

```json
[
  {
    "id": "asystoliya",
    "term": "Асистолія",
    "definition": "Повна відсутність електричної та механічної активності серця.",
    "synonyms": []
  }
]
```

- [ ] **Step 7: Проверка сборки**

Run: `cd site && npm run check && npm run build`
Expected: коллекции валидируются, сборка ок.

- [ ] **Step 8: Commit**

```bash
git add site/src
git commit -m "feat: content collections (lectures, quizzes, glossary) + publication gate"
```

---

### Task 4: MDX-компоненты: callout-блоки, VideoEmbed, термин-tooltip, Algorithm

**Files:**
- Create: `site/src/components/callouts/Important.astro`, `Dose.astro`, `ForDoctors.astro`, `ClinicalCase.astro`; `site/src/components/VideoEmbed.astro`, `site/src/components/T.astro`, `site/src/components/Algorithm.astro`
- Modify: `site/src/content/lectures/99-test.mdx` (использовать все компоненты)

**Interfaces:**
- Consumes: коллекция `glossary` (Task 3).
- Produces: `<Important>`, `<Dose>`, `<ClinicalCase title?>`, `<ForDoctors>` — слотовые callout'ы; `<VideoEmbed id title />` (id — YouTube video id); `<T id>текст</T>`; `<Algorithm title>` — обёртка (figure + подпись) для вложенного SVG-компонента.

- [ ] **Step 1: Callout'ы**

`site/src/components/callouts/Important.astro`:

```astro
<aside class="callout important" role="note">
  <strong class="label">⚠️ Важливо</strong>
  <div><slot /></div>
</aside>
<style>
  .callout { border-radius: var(--radius); padding: 0.9rem 1rem; margin-block: 1rem; border: 1px solid; }
  .important { background: color-mix(in srgb, var(--danger) 8%, var(--surface)); border-color: color-mix(in srgb, var(--danger) 35%, transparent); }
  .label { display: block; margin-bottom: 0.25rem; color: var(--danger); }
</style>
```

`site/src/components/callouts/Dose.astro`:

```astro
<aside class="callout dose" role="note">
  <strong class="label">💉 Дозування</strong>
  <div><slot /></div>
</aside>
<style>
  .callout { border-radius: var(--radius); padding: 0.9rem 1rem; margin-block: 1rem; border: 1px solid; }
  .dose { background: color-mix(in srgb, var(--warn) 10%, var(--surface)); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
  .label { display: block; margin-bottom: 0.25rem; color: var(--warn); }
</style>
```

`site/src/components/callouts/ClinicalCase.astro`:

```astro
---
interface Props { title?: string }
const { title } = Astro.props;
---
<aside class="callout case" role="note">
  <strong class="label">🩺 Клінічний випадок{title ? `: ${title}` : ''}</strong>
  <div><slot /></div>
</aside>
<style>
  .callout { border-radius: var(--radius); padding: 0.9rem 1rem; margin-block: 1rem; border: 1px solid; }
  .case { background: color-mix(in srgb, var(--primary) 8%, var(--surface)); border-color: color-mix(in srgb, var(--primary) 35%, transparent); }
  .label { display: block; margin-bottom: 0.25rem; color: var(--primary); }
</style>
```

`site/src/components/callouts/ForDoctors.astro`:

```astro
<details class="for-doctors">
  <summary>🎓 Поглиблено — для лікарів</summary>
  <div class="body"><slot /></div>
</details>
<style>
  .for-doctors { border: 1px solid color-mix(in srgb, #8e4ec6 35%, transparent); background: color-mix(in srgb, #8e4ec6 8%, var(--surface)); border-radius: var(--radius); margin-block: 1rem; }
  summary { cursor: pointer; font-weight: 700; padding: 0.9rem 1rem; color: #8e4ec6; }
  .body { padding: 0 1rem 0.9rem; }
</style>
```

- [ ] **Step 2: VideoEmbed (lite)**

`site/src/components/VideoEmbed.astro`:

```astro
---
interface Props { id: string; title: string }
const { id, title } = Astro.props;
---
<button class="yt" data-id={id} aria-label={`Відтворити відео: ${title}`}>
  <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={title} loading="lazy" width="480" height="360" />
  <span class="play">▶</span>
  <span class="yt-title">{title}</span>
</button>
<script>
  document.querySelectorAll<HTMLButtonElement>('button.yt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = document.createElement('div');
      wrap.className = 'yt-frame';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1`;
      iframe.title = btn.getAttribute('aria-label') ?? '';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      wrap.append(iframe);
      btn.replaceWith(wrap);
    });
  });
</script>
<style>
  .yt { position: relative; display: block; width: 100%; border: 0; padding: 0; cursor: pointer; border-radius: var(--radius); overflow: hidden; margin-block: 1rem; }
  .yt img { width: 100%; height: auto; display: block; }
  .play { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3rem; color: #fff; background: rgba(0,0,0,0.35); }
  .yt-title { position: absolute; left: 0; right: 0; bottom: 0; padding: 0.5rem; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,0.7)); text-align: left; }
  :global(.yt-frame) { aspect-ratio: 16 / 9; margin-block: 1rem; }
  :global(.yt-frame iframe) { width: 100%; height: 100%; border: 0; border-radius: var(--radius); }
</style>
```

- [ ] **Step 3: Термин-tooltip**

`site/src/components/T.astro`:

```astro
---
import { getCollection } from 'astro:content';

interface Props { id: string }
const { id } = Astro.props;
const term = (await getCollection('glossary')).find((t) => t.id === id);
if (!term) throw new Error(`Glossary term not found: ${id}`);
---
<span class="term" tabindex="0">
  <slot /><span class="term-tip" role="tooltip"><strong>{term.data.term}.</strong> {term.data.definition}</span>
</span>
<style>
  .term { border-bottom: 1.5px dotted var(--primary); cursor: help; position: relative; }
  .term-tip { display: none; position: absolute; left: 0; top: 100%; z-index: 20; width: min(20rem, 80vw); background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0.6rem 0.75rem; font-size: 0.9rem; line-height: 1.5; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  .term:hover .term-tip, .term:focus .term-tip { display: block; }
</style>
```

- [ ] **Step 4: Algorithm-обёртка**

`site/src/components/Algorithm.astro`:

```astro
---
interface Props { title: string }
const { title } = Astro.props;
---
<figure class="algorithm">
  <div class="scroll"><slot /></div>
  <figcaption>{title}</figcaption>
</figure>
<style>
  .algorithm { margin: 1.25rem 0; }
  .scroll { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem; }
  .scroll :global(svg) { display: block; margin-inline: auto; max-width: 100%; height: auto; }
  figcaption { text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 0.4rem; }
</style>
```

- [ ] **Step 5: Обновить фикстуру**

В `99-test.mdx` добавить импорт и использование каждого компонента:

```mdx
import Important from '../../components/callouts/Important.astro';
import Dose from '../../components/callouts/Dose.astro';
import ForDoctors from '../../components/callouts/ForDoctors.astro';
import ClinicalCase from '../../components/callouts/ClinicalCase.astro';
import VideoEmbed from '../../components/VideoEmbed.astro';
import T from '../../components/T.astro';

<Important>Критичний текст.</Important>
<Dose>Адреналін 1 мг в/в (тест-текст).</Dose>
<ForDoctors>Поглиблений текст.</ForDoctors>
<ClinicalCase title="Тест">Віньєтка.</ClinicalCase>
<VideoEmbed id="dQw4w9WgXcQ" title="Тестове відео" />

Термін: <T id="asystoliya">асистолія</T>.
```

- [ ] **Step 6: Проверка**

Run: `cd site && npm run dev` — открыть `/lektsiyi/99-test/` невозможно (страницы лекций ещё нет) → проверка через build: `npm run check && npm run build`.
Expected: без ошибок. Визуальная проверка компонентов — в Task 8 после появления страницы лекции.

- [ ] **Step 7: Commit**

```bash
git add site/src
git commit -m "feat: MDX content components (callouts, lite video, term tooltip, algorithm)"
```

---

### Task 5: Логика квиза и localStorage (TDD)

**Files:**
- Create: `site/src/lib/quiz.ts`, `site/src/lib/quiz.test.ts`, `site/src/lib/storage.ts`, `site/src/lib/storage.test.ts`

**Interfaces:**
- Produces:
  - `type QuizLevel = 'nurse' | 'doctor'`
  - `interface Question { id: string; type: 'single' | 'multiple'; text: string; vignette?: string; options: string[]; correct: number[]; explanation: string }`
  - `isCorrect(q: Question, selected: number[]): boolean`
  - `interface QuizResult { score: number; total: number; wrongIds: string[] }`
  - `computeResult(questions: Question[], answers: Map<string, number[]>): QuizResult`
  - `interface BestResult { score: number; total: number; date: string }`
  - `saveBest(topic: string, level: QuizLevel, r: BestResult): void` — сохраняет только если `score/total` лучше сохранённого
  - `getBest(topic: string, level: QuizLevel): BestResult | null`
  - ключ localStorage: `` `aiti:quiz:${topic}:${level}` ``

- [ ] **Step 1: Failing tests — quiz**

`site/src/lib/quiz.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isCorrect, computeResult, type Question } from './quiz';

const q = (id: string, type: 'single' | 'multiple', correct: number[]): Question => ({
  id, type, text: id, options: ['a', 'b', 'c', 'd'], correct, explanation: '',
});

describe('isCorrect', () => {
  it('single: exact match', () => {
    expect(isCorrect(q('1', 'single', [2]), [2])).toBe(true);
    expect(isCorrect(q('1', 'single', [2]), [1])).toBe(false);
  });
  it('multiple: set equality, order-independent', () => {
    expect(isCorrect(q('1', 'multiple', [0, 2]), [2, 0])).toBe(true);
    expect(isCorrect(q('1', 'multiple', [0, 2]), [0])).toBe(false);
    expect(isCorrect(q('1', 'multiple', [0, 2]), [0, 2, 3])).toBe(false);
  });
  it('empty selection is wrong', () => {
    expect(isCorrect(q('1', 'single', [0]), [])).toBe(false);
  });
});

describe('computeResult', () => {
  it('counts score and collects wrong ids (unanswered = wrong)', () => {
    const qs = [q('a', 'single', [0]), q('b', 'single', [1]), q('c', 'multiple', [0, 1])];
    const answers = new Map<string, number[]>([['a', [0]], ['b', [3]]]);
    expect(computeResult(qs, answers)).toEqual({ score: 1, total: 3, wrongIds: ['b', 'c'] });
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `cd site && npm test`
Expected: FAIL — модуль `./quiz` не найден.

- [ ] **Step 3: Implement quiz.ts**

```ts
export type QuizLevel = 'nurse' | 'doctor';

export interface Question {
  id: string;
  type: 'single' | 'multiple';
  text: string;
  vignette?: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export function isCorrect(q: Question, selected: number[]): boolean {
  if (selected.length !== q.correct.length) return false;
  const want = new Set(q.correct);
  return selected.every((i) => want.has(i));
}

export interface QuizResult { score: number; total: number; wrongIds: string[] }

export function computeResult(questions: Question[], answers: Map<string, number[]>): QuizResult {
  let score = 0;
  const wrongIds: string[] = [];
  for (const q of questions) {
    if (isCorrect(q, answers.get(q.id) ?? [])) score++;
    else wrongIds.push(q.id);
  }
  return { score, total: questions.length, wrongIds };
}
```

- [ ] **Step 4: Failing tests — storage**

`site/src/lib/storage.test.ts` (в node-окружении подменяем localStorage):

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveBest, getBest } from './storage';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

describe('best results', () => {
  it('saves and reads', () => {
    saveBest('03', 'nurse', { score: 7, total: 12, date: '2026-08-17' });
    expect(getBest('03', 'nurse')?.score).toBe(7);
  });
  it('keeps better result', () => {
    saveBest('03', 'nurse', { score: 10, total: 12, date: '2026-08-17' });
    saveBest('03', 'nurse', { score: 4, total: 12, date: '2026-08-18' });
    expect(getBest('03', 'nurse')?.score).toBe(10);
  });
  it('null when absent or corrupted', () => {
    expect(getBest('03', 'doctor')).toBeNull();
    localStorage.setItem('aiti:quiz:03:doctor', '{broken');
    expect(getBest('03', 'doctor')).toBeNull();
  });
});
```

- [ ] **Step 5: Run — verify fail, then implement storage.ts**

```ts
import type { QuizLevel } from './quiz';

export interface BestResult { score: number; total: number; date: string }

const key = (topic: string, level: QuizLevel) => `aiti:quiz:${topic}:${level}`;

export function getBest(topic: string, level: QuizLevel): BestResult | null {
  try {
    const raw = localStorage.getItem(key(topic, level));
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.score !== 'number' || typeof v?.total !== 'number') return null;
    return v as BestResult;
  } catch {
    return null;
  }
}

export function saveBest(topic: string, level: QuizLevel, r: BestResult): void {
  const prev = getBest(topic, level);
  if (prev && prev.score / prev.total >= r.score / r.total) return;
  try {
    localStorage.setItem(key(topic, level), JSON.stringify(r));
  } catch {
    // storage full/unavailable — non-critical
  }
}
```

- [ ] **Step 6: Run — verify pass**

Run: `cd site && npm test`
Expected: PASS (все тесты quiz + storage + visibility).

- [ ] **Step 7: Commit**

```bash
git add site/src/lib
git commit -m "feat: quiz scoring and localStorage best-result logic (TDD)"
```

---

### Task 6: Quiz UI (Preact-островок) + страница теста

**Files:**
- Create: `site/src/components/quiz/Quiz.tsx`, `site/src/pages/tests/[topic]/[level].astro`

**Interfaces:**
- Consumes: `Question`, `computeResult`, `isCorrect` (Task 5); `saveBest` (Task 5); коллекция `quizzes` (Task 3); `topicById` (Task 2).
- Produces: `<Quiz topic level questions />` — props `{ topic: string; level: 'nurse' | 'doctor'; questions: Question[] }`; URL теста: `/tests/{topic}/{level}/`.

- [ ] **Step 1: Quiz.tsx**

```tsx
import { useState } from 'preact/hooks';
import { computeResult, isCorrect, type Question, type QuizLevel } from '../../lib/quiz';
import { saveBest } from '../../lib/storage';

interface Props { topic: string; level: QuizLevel; questions: Question[] }

export default function Quiz({ topic, level, questions }: Props) {
  const [pool, setPool] = useState<Question[]>(questions);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
  const [finished, setFinished] = useState(false);

  const q = pool[idx];

  const toggle = (i: number) => {
    if (checked) return;
    if (q.type === 'single') setSelected([i]);
    else setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };

  const check = () => {
    setChecked(true);
    setAnswers((m) => new Map(m).set(q.id, selected));
  };

  const next = () => {
    if (idx + 1 < pool.length) {
      setIdx(idx + 1);
      setSelected([]);
      setChecked(false);
    } else {
      const result = computeResult(pool, answers);
      if (pool.length === questions.length) {
        saveBest(topic, level, { score: result.score, total: result.total, date: new Date().toISOString().slice(0, 10) });
      }
      setFinished(true);
    }
  };

  const retryWrong = () => {
    const { wrongIds } = computeResult(pool, answers);
    setPool(questions.filter((x) => wrongIds.includes(x.id)));
    setIdx(0);
    setSelected([]);
    setChecked(false);
    setAnswers(new Map());
    setFinished(false);
  };

  if (finished) {
    const r = computeResult(pool, answers);
    return (
      <div class="quiz-result">
        <p class="score">{r.score} / {r.total}</p>
        <p>{r.score === r.total ? 'Бездоганно! 🎉' : 'Помилки — це навчання.'}</p>
        {r.wrongIds.length > 0 && <button onClick={retryWrong}>Повторити помилкові ({r.wrongIds.length})</button>}
        <a href="/tests/">До списку тестів</a>
      </div>
    );
  }

  return (
    <div class="quiz">
      <div class="progress"><span style={{ width: `${(idx / pool.length) * 100}%` }} /></div>
      <p class="counter">Питання {idx + 1} з {pool.length}</p>
      {q.vignette && <p class="vignette">{q.vignette}</p>}
      <h2>{q.text}</h2>
      {q.type === 'multiple' && <p class="hint">Оберіть усі правильні відповіді.</p>}
      <ul class="options">
        {q.options.map((opt, i) => {
          const isSel = selected.includes(i);
          const cls = checked
            ? q.correct.includes(i) ? 'correct' : isSel ? 'wrong' : ''
            : isSel ? 'selected' : '';
          return (
            <li key={i}>
              <button class={cls} onClick={() => toggle(i)} disabled={checked}>{opt}</button>
            </li>
          );
        })}
      </ul>
      {checked && (
        <div class={`explain ${isCorrect(q, selected) ? 'ok' : 'bad'}`}>
          <strong>{isCorrect(q, selected) ? '✅ Правильно.' : '❌ Неправильно.'}</strong> {q.explanation}
        </div>
      )}
      {!checked
        ? <button class="primary" disabled={selected.length === 0} onClick={check}>Перевірити</button>
        : <button class="primary" onClick={next}>{idx + 1 < pool.length ? 'Далі' : 'Результат'}</button>}
    </div>
  );
}
```

Стили квиза добавить в `global.css` (островок Preact не имеет scoped-стилей Astro):

```css
.quiz .progress { height: 6px; background: var(--surface-2); border-radius: 3px; overflow: hidden; }
.quiz .progress span { display: block; height: 100%; background: var(--primary); transition: width 0.3s; }
.quiz .counter, .quiz .hint { color: var(--text-muted); font-size: 0.85rem; }
.quiz .vignette { background: var(--surface-2); border-radius: var(--radius); padding: 0.75rem 1rem; }
.quiz .options { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.quiz .options button { width: 100%; text-align: left; padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid var(--border); background: var(--surface); color: var(--text); font: inherit; cursor: pointer; }
.quiz .options button.selected { border-color: var(--primary); background: var(--primary-soft); }
.quiz .options button.correct { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 12%, var(--surface)); }
.quiz .options button.wrong { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, var(--surface)); }
.quiz .explain { border-radius: var(--radius); padding: 0.75rem 1rem; margin-block: 0.75rem; }
.quiz .explain.ok { background: color-mix(in srgb, var(--ok) 10%, var(--surface)); }
.quiz .explain.bad { background: color-mix(in srgb, var(--danger) 10%, var(--surface)); }
.quiz button.primary { background: var(--primary); color: #fff; border: 0; border-radius: 10px; padding: 0.6rem 1.25rem; font-weight: 700; cursor: pointer; }
.quiz button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
.quiz-result { text-align: center; display: grid; gap: 0.5rem; justify-items: center; }
.quiz-result .score { font-size: 2.5rem; font-weight: 800; font-family: var(--font-heading); margin: 0; }
```

- [ ] **Step 2: Страница теста**

`site/src/pages/tests/[topic]/[level].astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import Quiz from '../../../components/quiz/Quiz.tsx';
import { topicById } from '../../../lib/topics';

export async function getStaticPaths() {
  const quizzes = await getCollection('quizzes');
  return quizzes.map((q) => ({
    params: { topic: q.data.topic, level: q.data.level },
    props: { quiz: q },
  }));
}

const { quiz } = Astro.props;
const topic = topicById(quiz.data.topic);
const levelName = quiz.data.level === 'nurse' ? 'медсестра' : 'лікар';
---
<Base title={`Тест: ${topic?.short ?? quiz.data.topic} (${levelName})`}>
  <h1>Тест: {topic?.short ?? 'Тема ' + quiz.data.topic}</h1>
  <p class="muted">Рівень: {levelName} · {quiz.data.questions.length} питань</p>
  <Quiz client:load topic={quiz.data.topic} level={quiz.data.level} questions={quiz.data.questions} />
</Base>
```

- [ ] **Step 3: Проверка вручную**

Run: `cd site && npm run dev`, открыть `http://localhost:4321/tests/99/nurse/`.
Expected: вопрос показывается, выбор → «Перевірити» → объяснение → «Результат»; результат пишется в `localStorage` (`aiti:quiz:99:nurse` в DevTools).

- [ ] **Step 4: Build + commit**

Run: `cd site && npm run check && npm run build` → ок.

```bash
git add site/src
git commit -m "feat: quiz island and test page"
```

---

### Task 7: Страница /tests (список тестов + результаты)

**Files:**
- Create: `site/src/pages/tests/index.astro`

**Interfaces:**
- Consumes: коллекция `quizzes`, `TOPICS`/`topicById` (Task 2), ключи `aiti:quiz:{topic}:{level}`.
- Produces: `/tests/` — сгруппированный по темам список ссылок на `/tests/{topic}/{level}/` с лучшими результатами.

- [ ] **Step 1: Страница**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { TOPICS, topicById } from '../../lib/topics';

const quizzes = await getCollection('quizzes');
const byTopic = new Map<string, typeof quizzes>();
for (const q of quizzes) {
  const list = byTopic.get(q.data.topic) ?? [];
  list.push(q);
  byTopic.set(q.data.topic, list);
}
const topics = [...byTopic.keys()].sort();
---
<Base title="Тести — АіІТ">
  <h1>Тести для самоконтролю</h1>
  {topics.map((id) => {
    const t = topicById(id);
    return (
      <section class="topic-tests" style={`--accent: ${t?.color ?? 'var(--primary)'}`}>
        <h2>{t?.short ?? `Тема ${id}`}</h2>
        <div class="levels">
          {(byTopic.get(id) ?? []).sort((a, b) => a.data.level.localeCompare(b.data.level)).map((q) => (
            <a class="level-card" href={`/tests/${id}/${q.data.level}/`} data-topic={id} data-level={q.data.level}>
              <span>{q.data.level === 'nurse' ? '🩹 Медсестра' : '🎓 Лікар'}</span>
              <span class="best" data-best>—</span>
              <span class="count">{q.data.questions.length} питань</span>
            </a>
          ))}
        </div>
      </section>
    );
  })}
  <script>
    document.querySelectorAll<HTMLAnchorElement>('.level-card').forEach((card) => {
      const raw = localStorage.getItem(`aiti:quiz:${card.dataset.topic}:${card.dataset.level}`);
      if (!raw) return;
      try {
        const b = JSON.parse(raw);
        card.querySelector('[data-best]')!.textContent = `найкраще: ${b.score}/${b.total}`;
      } catch {}
    });
  </script>
  <style>
    .topic-tests { border-left: 4px solid var(--accent); padding-left: 1rem; margin-block: 1.5rem; }
    .levels { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); }
    .level-card { display: grid; gap: 0.2rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.9rem 1rem; text-decoration: none; color: var(--text); font-weight: 600; }
    .best, .count { color: var(--text-muted); font-size: 0.85rem; font-weight: 400; }
  </style>
</Base>
```

- [ ] **Step 2: Проверка + commit**

Dev: `/tests/` показывает тему 99 с одним уровнем; после прохождения теста — лучший результат. Build ок.

```bash
git add site/src/pages/tests
git commit -m "feat: tests index page with best results"
```

---

### Task 8: Страница лекции (TOC, prose, прогресс, ссылка на тест)

**Files:**
- Create: `site/src/pages/lektsiyi/[slug].astro`

**Interfaces:**
- Consumes: коллекция `lectures`, `filterVisible`/`showDrafts` (Task 3), `topicById` (Task 2), ключ `aiti:read:{slug}`.
- Produces: `/lektsiyi/{slug}/`; в конце страницы элемент `#lecture-end` с `data-slug`; кнопки-ссылки на `/tests/{topic}/nurse/` и `/tests/{topic}/doctor/` (если тесты темы существуют).

- [ ] **Step 1: Страница**

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { filterVisible, showDrafts } from '../../lib/visibility';
import { topicById } from '../../lib/topics';

export async function getStaticPaths() {
  const all = await getCollection('lectures');
  const visible = filterVisible(all, { prod: import.meta.env.PROD, showDrafts: showDrafts() });
  return visible.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
const topicId = entry.id.slice(0, 2);
const topic = topicById(topicId);
const quizzes = await getCollection('quizzes', (q) => q.data.topic === topicId);
const toc = headings.filter((h) => h.depth === 2);
const fmt = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' });
---
<Base title={entry.data.title} description={entry.data.description}>
  <article class="lecture" style={`--accent: ${topic?.color ?? 'var(--primary)'}`}>
    <header class="lecture-head">
      {entry.data.status !== 'published' && <p class="draft-badge">Чернетка — не опубліковано</p>}
      <h1>{entry.data.title}</h1>
      <p class="meta">Оновлено: {fmt.format(entry.data.updatedAt)}</p>
    </header>
    <div class="lecture-grid">
      {toc.length > 0 && (
        <nav class="toc" aria-label="Зміст">
          <strong>Зміст</strong>
          <ol>{toc.map((h) => <li><a href={`#${h.slug}`}>{h.text}</a></li>)}</ol>
        </nav>
      )}
      <div class="prose"><Content /></div>
    </div>
    {entry.data.sources.length > 0 && (
      <section class="sources">
        <h2>Джерела</h2>
        <ul>{entry.data.sources.map((s) => <li>{s}</li>)}</ul>
      </section>
    )}
    {quizzes.length > 0 && (
      <section class="quiz-cta">
        <h2>Перевір себе</h2>
        {quizzes.map((q) => (
          <a class="btn" href={`/tests/${topicId}/${q.data.level}/`}>
            Тест: {q.data.level === 'nurse' ? 'медсестра' : 'лікар'} →
          </a>
        ))}
      </section>
    )}
    <div id="lecture-end" data-slug={entry.id}></div>
  </article>
  <script>
    const el = document.getElementById('lecture-end');
    const slug = el?.dataset.slug;
    if (el && slug) {
      new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) {
          try { localStorage.setItem(`aiti:read:${slug}`, '1'); } catch {}
          obs.disconnect();
        }
      }).observe(el);
    }
  </script>
  <style>
    .lecture-head h1 { border-left: 5px solid var(--accent); padding-left: 0.75rem; }
    .draft-badge { display: inline-block; background: var(--warn); color: #000; border-radius: 6px; padding: 0.1rem 0.5rem; font-size: 0.8rem; font-weight: 700; }
    .meta { color: var(--text-muted); font-size: 0.85rem; }
    .lecture-grid { display: grid; gap: 2rem; }
    .toc ol { padding-left: 1.25rem; }
    .toc a { color: var(--text-muted); text-decoration: none; }
    .btn { display: inline-block; background: var(--accent); color: #fff; border-radius: 10px; padding: 0.6rem 1rem; text-decoration: none; font-weight: 700; margin-right: 0.5rem; }
    @media (min-width: 60rem) {
      .lecture-grid { grid-template-columns: 14rem minmax(0, 1fr); align-items: start; }
      .toc { position: sticky; top: 4.5rem; }
    }
  </style>
</Base>
```

- [ ] **Step 2: Проверка**

Dev: открыть `/lektsiyi/99-test/`. Expected: бейдж «Чернетка», TOC, все компоненты из Task 4 рендерятся (callout'ы, видео-фасад, tooltip термина при hover/tap), докрутка до конца ставит `aiti:read:99-test`.

- [ ] **Step 3: Build + commit**

`npm run check && npm run build` → в прод-сборке страницы `99-test` НЕТ (draft). Проверить: `ls site/dist/lektsiyi` — пусто/нет папки.

```bash
git add site/src/pages/lektsiyi
git commit -m "feat: lecture page with TOC, sources, quiz links, read tracking"
```

---

### Task 9: Главная страница

**Files:**
- Modify: `site/src/pages/index.astro` (заменить заглушку)

**Interfaces:**
- Consumes: `TOPICS` (Task 2), коллекция `lectures` + `filterVisible` (Task 3), ключи `aiti:read:{slug}`, `aiti:quiz:{topic}:{level}`.
- Produces: карточки 8 тем по 2 модулям; тема без видимой лекции — карточка «незабаром» без ссылки.

- [ ] **Step 1: Страница**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import { TOPICS } from '../lib/topics';
import { filterVisible, showDrafts } from '../lib/visibility';

const all = await getCollection('lectures');
const visible = filterVisible(all, { prod: import.meta.env.PROD, showDrafts: showDrafts() })
  .filter((l) => l.data.order <= 8);
const bySlugPrefix = new Map(visible.map((l) => [l.id.slice(0, 2), l]));
const modules = [
  { n: 1, title: 'Модуль I. Поняття про анестезіологію та реаніматологію' },
  { n: 2, title: 'Модуль II. Шокові, коматозні стани та гострі отруєння' },
];
---
<Base title="Анестезіологія та інтенсивна терапія — лекції">
  <section class="hero">
    <h1>Анестезіологія та інтенсивна терапія</h1>
    <p>Актуалізовані лекції за сучасними протоколами (ERC, AHA, МОЗ України) + тести для самоконтролю.</p>
  </section>
  {modules.map((m) => (
    <section>
      <h2>{m.title}</h2>
      <div class="cards">
        {TOPICS.filter((t) => t.module === m.n).map((t) => {
          const lecture = bySlugPrefix.get(t.id);
          return lecture ? (
            <a class="card" href={`/lektsiyi/${lecture.id}/`} style={`--accent: ${t.color}`} data-slug={lecture.id} data-topic={t.id}>
              <span class="num">Тема {t.order}</span>
              <span class="title">{t.short}</span>
              <span class="status" data-status></span>
            </a>
          ) : (
            <div class="card soon" style={`--accent: ${t.color}`}>
              <span class="num">Тема {t.order}</span>
              <span class="title">{t.short}</span>
              <span class="status">незабаром</span>
            </div>
          );
        })}
      </div>
    </section>
  ))}
  <script>
    document.querySelectorAll<HTMLAnchorElement>('a.card').forEach((card) => {
      const read = localStorage.getItem(`aiti:read:${card.dataset.slug}`);
      const el = card.querySelector('[data-status]')!;
      const bests = ['nurse', 'doctor']
        .map((lvl) => localStorage.getItem(`aiti:quiz:${card.dataset.topic}:${lvl}`))
        .filter(Boolean).length;
      el.textContent = [read ? '✓ прочитано' : '', bests ? `тестів пройдено: ${bests}` : '']
        .filter(Boolean).join(' · ');
    });
  </script>
  <style>
    .hero { padding-block: 1.5rem; }
    .cards { display: grid; gap: 0.9rem; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
    .card { display: grid; gap: 0.25rem; background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--accent); border-radius: var(--radius); padding: 1rem; text-decoration: none; color: var(--text); }
    .card .num { color: var(--accent); font-weight: 800; font-size: 0.8rem; text-transform: uppercase; }
    .card .title { font-family: var(--font-heading); font-weight: 700; }
    .card .status { color: var(--text-muted); font-size: 0.85rem; min-height: 1.2em; }
    .card.soon { opacity: 0.6; }
  </style>
</Base>
```

- [ ] **Step 2: Проверка + commit**

Dev: главная показывает 8 карточек в 2 модулях; в dev тема 99 не показывается (`order <= 8`), активных ссылок нет (все лекции draft, но dev показывает draft — карточка 03 появится после Task 12; сейчас все «незабаром», кроме отсутствующих). Build ок.

```bash
git add site/src/pages/index.astro
git commit -m "feat: home page with module/topic cards and local progress"
```

---

### Task 10: Глоссарий

**Files:**
- Create: `site/src/pages/glossary.astro`

**Interfaces:**
- Consumes: коллекция `glossary` (Task 3).
- Produces: `/glossary/` — алфавитный список с клиентским фильтром по подстроке (термин + синонимы).

- [ ] **Step 1: Страница**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';

const terms = (await getCollection('glossary'))
  .sort((a, b) => a.data.term.localeCompare(b.data.term, 'uk'));
---
<Base title="Глосарій — АіІТ">
  <h1>Глосарій</h1>
  <input id="filter" type="search" placeholder="Фільтр термінів…" autocomplete="off" />
  <dl class="terms">
    {terms.map((t) => (
      <div class="entry" data-search={[t.data.term, ...t.data.synonyms].join(' ').toLowerCase()}>
        <dt>{t.data.term}{t.data.synonyms.length > 0 && <span class="syn"> ({t.data.synonyms.join(', ')})</span>}</dt>
        <dd>{t.data.definition}</dd>
      </div>
    ))}
  </dl>
  <p id="empty" hidden>Нічого не знайдено.</p>
  <script>
    const input = document.getElementById('filter') as HTMLInputElement;
    const entries = [...document.querySelectorAll<HTMLElement>('.entry')];
    const empty = document.getElementById('empty')!;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      for (const e of entries) {
        const hit = !q || e.dataset.search!.includes(q);
        e.hidden = !hit;
        if (hit) shown++;
      }
      empty.hidden = shown > 0;
    });
  </script>
  <style>
    #filter { width: 100%; max-width: 24rem; padding: 0.6rem 0.9rem; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text); font: inherit; margin-block: 0.5rem 1.25rem; }
    .entry { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-block: 0.5rem; }
    dt { font-weight: 700; font-family: var(--font-heading); }
    .syn { color: var(--text-muted); font-weight: 400; }
    dd { margin: 0.25rem 0 0; color: var(--text-muted); }
  </style>
</Base>
```

- [ ] **Step 2: Проверка + commit**

Dev: `/glossary/` — термин «Асистолія», фильтр работает. Build ок.

```bash
git add site/src/pages/glossary.astro
git commit -m "feat: glossary page with client-side filter"
```

---

### Task 11: Поиск (Pagefind + модалка, Ctrl+K)

**Files:**
- Create: `site/src/components/SearchModal.astro`
- Modify: `site/src/layouts/Base.astro` (подключить модалку)

**Interfaces:**
- Consumes: кнопка `#search-open` из Base (Task 2); собранный индекс `/pagefind/` (создаёт `npm run build`).
- Produces: `<SearchModal />`, открытие по клику и `Ctrl+K`/`Cmd+K`.

- [ ] **Step 1: Компонент**

`site/src/components/SearchModal.astro`:

```astro
<dialog id="search-dialog">
  <button id="search-close" aria-label="Закрити">✕</button>
  <div id="search"></div>
  <p id="search-fallback" hidden>Пошук доступний лише у зібраній версії сайту.</p>
</dialog>
<script>
  const dialog = document.getElementById('search-dialog') as HTMLDialogElement;
  let inited = false;

  async function openSearch() {
    dialog.showModal();
    if (inited) return;
    inited = true;
    try {
      // Served from /pagefind/ in the built site; absent in dev.
      const mod = await import(/* @vite-ignore */ '/pagefind/pagefind-ui.js' as string);
      new mod.PagefindUI({ element: '#search', showSubResults: true, translations: { placeholder: 'Пошук по лекціях…' } });
    } catch {
      document.getElementById('search-fallback')!.hidden = false;
    }
  }

  document.getElementById('search-open')?.addEventListener('click', openSearch);
  document.getElementById('search-close')?.addEventListener('click', () => dialog.close());
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.open ? dialog.close() : openSearch();
    }
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
</script>
<style>
  dialog { width: min(40rem, 92vw); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text); padding: 1rem; }
  dialog::backdrop { background: rgba(0, 0, 0, 0.45); }
  #search-close { float: right; background: none; border: 0; cursor: pointer; color: var(--text-muted); font-size: 1rem; }
</style>
```

- [ ] **Step 2: Подключить в Base**

В `Base.astro` перед `</body>`:

```astro
---
import SearchModal from '../components/SearchModal.astro';
---
<SearchModal />
```

Также добавить ссылку на стили Pagefind в `<head>` (грузятся из собранного индекса; в dev — 404, не критично):

```html
<link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
```

- [ ] **Step 3: Проверка**

Run: `cd site && npm run build && npm run preview`, открыть превью, `Ctrl+K`, искать украинское слово из фикстуры (например «типографіки»).
Expected: результаты с подсветкой, переход по ссылке работает. В dev-режиме модалка показывает fallback-текст.

- [ ] **Step 4: Commit**

```bash
git add site/src
git commit -m "feat: Pagefind search modal with Ctrl+K"
```

---

### Task 12: Пилотный контент — Тема 3 «Термінальні стани»

Это контентная задача: выполняется в основной сессии (нужны WebSearch/WebFetch и медицинская аккуратность), не субагентом-кодером.

**Files:**
- Create: `content-src/03-terminalni-stany.txt` (сырой текст из pptx), `site/src/content/lectures/03-terminalni-stany.mdx`, `site/src/content/quizzes/03-nurse.json`, `site/src/content/quizzes/03-doctor.json`, `site/src/components/algorithms/BLS.astro`, `docs/reviews/03-terminalni-stany.md`, изображения в `site/public/images/lectures/03/`
- Modify: `site/src/content/glossary/terms.json` (термины темы)

**Interfaces:**
- Consumes: все компоненты Task 4, схемы Task 3.
- Produces: лекция `status: draft` (видна в dev/preview, не в проде до ревью автора).

- [ ] **Step 1: Извлечь текст и медиа из pptx**

```bash
cd "C:/Users/panka/AppData/Local/Temp/claude/D--projects-lectures/214ea4bd-597f-43b9-baea-3a6d1578bf92/scratchpad"
mkdir -p pptx03 && unzip -o -q "D:/projects/lectures/Термінальні стани.pptx" -d pptx03
for f in pptx03/ppt/slides/slide*.xml; do
  echo "=== $f ==="; sed -e 's/<a:p>/\n/g' -e 's/<[^>]*>//g' "$f" | grep -v '^\s*$'
done > "D:/projects/lectures/content-src/03-terminalni-stany.txt"
ls pptx03/ppt/media/
```

Медиа просмотреть (Read для изображений), пригодные — скопировать в `site/public/images/lectures/03/`, конвертировать в WebP при необходимости.

- [ ] **Step 2: Аудит актуальности**

По каждому медицинскому утверждению из извлечённого текста — сверка с текущими рекомендациями (WebSearch/WebFetch): ERC Guidelines 2021 (+ updates), AHA 2020/2025 (BLS/ACLS), действующие наказы МОЗ Украины по СЛР/экстренной помощи. Результат — таблица в `docs/reviews/03-terminalni-stany.md`: «утверждение → статус (актуально/устарело) → текущая рекомендация → источник (ссылка)».

- [ ] **Step 3: Написать MDX-черновик**

`site/src/content/lectures/03-terminalni-stany.mdx`: структура прежней лекции + обновления. Обязательные элементы: frontmatter по схеме (`status: draft`, `sources` заполнен), разделы `##` для TOC, минимум один `<Important>`, `<Dose>` для препаратов СЛР, `<ForDoctors>` для углублённого, `<Algorithm title="Алгоритм BLS (ERC 2021)"><BLS /></Algorithm>`, 1–2 `<VideoEmbed>` (техника СЛР — официальные каналы), термины через `<T>`. Каждое медизменение — комментарий `{/* CHANGED: було X, стало Y, джерело Z */}`.

- [ ] **Step 4: SVG-алгоритм BLS**

`site/src/components/algorithms/BLS.astro` — SVG-схема цепочки BLS (непритомний → викликати допомогу → 30:2 → АЗД…), цвета через CSS-переменные (`var(--text)`, `var(--danger)` и т.д.), `viewBox`, без фиксированных width/height.

- [ ] **Step 5: Квизы**

`03-nurse.json` — 10–15 вопросов базового уровня (последовательность BLS, компрессии, признаки клинической смерти). `03-doctor.json` — 10–15 углублённых (ритмы, дозы, клинические виньетки, `type: multiple` где уместно). Каждый вопрос — с `explanation` и отсылкой к разделу лекции. Валидация схемой при build.

- [ ] **Step 6: Глоссарий**

Добавить в `terms.json` термины темы (клінічна смерть, біологічна смерть, агонія, фібриляція шлуночків, асистолія, PEA, декортикація, децеребрація и т.п.).

- [ ] **Step 7: Ревью-документ**

`docs/reviews/03-terminalni-stany.md`: список всех изменений со ссылками, встроенные видео на проверку, список недостающих фото (если есть). Финальная строка — чеклист для автора: «проверить дозировки, подтвердить видео, сменить status на published».

- [ ] **Step 8: Проверка и commit**

`cd site && npm test && npm run check && npm run build` — лекции 03 в прод-сборке НЕТ (draft). `npm run dev` — есть, все блоки рендерятся.

```bash
git add content-src site/src site/public docs/reviews
git commit -m "content: draft of lecture 03 (terminal states) with quizzes, BLS algorithm, review doc"
```

- [ ] **Step 9: Ревью автора (блокирующий шаг)**

Автор читает `docs/reviews/03-terminalni-stany.md` и черновик (dev или preview-деплой). Правки → внести → `status: published` → commit. Без одобрения автора статус не меняется.

---

### Task 13: Деплой — GitHub + Cloudflare Pages + домен

**Files:**
- Modify: — (настройки внешних сервисов; возможно `README.md` с инструкцией сборки)

**Interfaces:**
- Consumes: весь репозиторий.
- Produces: прод на `lectures.pankaz.dev`, автодеплой из `main`, preview-деплои веток с `SHOW_DRAFTS=1`.

- [ ] **Step 1: GitHub-репозиторий**

```bash
cd "D:/projects/lectures"
gh repo create lectures --private --source . --push
```

(Если `gh` не авторизован — пользователь выполняет `! gh auth login`.)

- [ ] **Step 2: Cloudflare Pages (действия пользователя в дашборде)**

Инструкция пользователю:
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → выбрать репо `lectures`.
2. Build settings: Framework preset — Astro; Root directory — `site`; Build command — `npm run build`; Output — `dist`.
3. Environment variables: для **Preview** окружения добавить `SHOW_DRAFTS=1` (production — без переменной).
4. Deploy.

- [ ] **Step 3: Домен**

Pages project → Custom domains → добавить `lectures.pankaz.dev` (Cloudflare сам создаст CNAME, домен уже в этом аккаунте).

- [ ] **Step 4: Верификация**

- `https://lectures.pankaz.dev` открывается, HTTPS ок.
- Прод: черновиков нет (лекция 03 отсутствует, если ещё draft).
- Preview-деплой ветки: черновик 03 виден с бейджем «Чернетка».
- Поиск (Ctrl+K) работает на проде.
- Проверка с телефона: типографика, карточки, квиз.

- [ ] **Step 5: README + commit**

Создать `README.md` в корне: что это, структура, как собрать (`cd site && npm i && npm run dev`), pipeline публикации лекций (draft → review doc → авторское ревью → published).

```bash
git add README.md
git commit -m "docs: README with build and publication workflow"
git push
```

---

## Повторяемый конвейер для остальных лекций (после этого плана)

Для лекций 01, 02, 04, 06, 07, 08 — повторить Task 12 с соответствующим pptx (свой номер темы, свои алгоритмы/схемы/видео). Для темы 05 (pptx нет) — Step 1 заменяется на: составление структуры по описанию темы из учебной программы (`Анестезіологія_та_інтенсивна_терапія.docx`) + современные источники; остальные шаги без изменений. Каждая лекция — отдельная ветка → preview-деплой → авторское ревью → `published` → merge в `main`.
