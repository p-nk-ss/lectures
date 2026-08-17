# Лекції: Анестезіологія та інтенсивна терапія

Статичний сайт лекцій для `lectures.pankaz.dev`: актуалізовані лекції за сучасними протоколами (ERC 2021/2025, AHA 2020/2025, накази МОЗ України) + тести для самоконтролю, глосарій і пошук.

## Структура

- `site/` — Astro-проєкт (Preact-островки, MDX, Pagefind, Vitest).
- `lectures/` — вихідні pptx-презентації.
- `content-src/` — сирий текст, витягнутий із pptx.
- `docs/superpowers/` — дизайн-спека і план реалізації.
- `docs/reviews/` — ревʼю-документи лекцій (аудит актуальності, чеклист автора).

## Розробка

Node 20+.

```bash
cd site
npm install
npm run dev      # dev-сервер (чернетки видно)
npm test         # vitest
npm run check    # astro check
npm run build    # прод-збірка + індекс Pagefind
```

## Публікація лекцій

1. Лекція створюється зі `status: draft` — видна в dev і в preview-деплоях (`SHOW_DRAFTS=1`), у прод не потрапляє.
2. Аудит джерел і зміни фіксуються в `docs/reviews/<slug>.md`.
3. Автор перевіряє чернетку та чеклист ревʼю-документа.
4. `status: published` → commit → merge в `main` → автодеплой у прод.

## Деплой

Cloudflare Pages: Root directory — `site`, Build command — `npm run build`, Output — `dist`. Для Preview-оточення встановлено `SHOW_DRAFTS=1`. Прод-домен — `lectures.pankaz.dev`.
