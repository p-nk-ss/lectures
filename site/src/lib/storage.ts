import type { QuizLevel } from './quiz';

export interface BestResult { score: number; total: number; date: string }

/** Every key this site writes lives under one prefix, so it can be found and cleared. */
export const KEY_PREFIX = 'aiti:';

export const quizKey = (topic: string, level: QuizLevel) => `${KEY_PREFIX}quiz:${topic}:${level}`;
export const progressKey = (slug: string) => `${KEY_PREFIX}progress:${slug}`;
export const readKey = (slug: string) => `${KEY_PREFIX}read:${slug}`;

export function getBest(topic: string, level: QuizLevel): BestResult | null {
  try {
    const raw = localStorage.getItem(quizKey(topic, level));
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
    localStorage.setItem(quizKey(topic, level), JSON.stringify(r));
  } catch {
    // storage full/unavailable — non-critical
  }
}

/* ---- Reading and clearing what a reader has accumulated ---------------------------- */

/**
 * Keys currently held under our prefix.
 *
 * Enumerated from storage rather than derived from the lecture list: a renamed or removed
 * lecture would otherwise leave a key nobody can reach, and "скинути все" has to mean all.
 */
export function ownKeys(store: Storage = localStorage): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k?.startsWith(KEY_PREFIX)) out.push(k);
    }
  } catch {
    // storage unavailable — nothing to report
  }
  return out;
}

function remove(keys: string[], store: Storage = localStorage): number {
  let n = 0;
  for (const k of keys) {
    try {
      if (store.getItem(k) === null) continue;
      store.removeItem(k);
      n++;
    } catch {
      // storage unavailable — nothing to clear
    }
  }
  return n;
}

/** How far a reader got through one lecture. `read` wins: it means the last slide was reached. */
export function lectureState(slug: string, totalSlides: number, store: Storage = localStorage): { pct: number; read: boolean } {
  let progress = 0;
  let read = false;
  try {
    progress = Number(store.getItem(progressKey(slug)) ?? 0);
    read = store.getItem(readKey(slug)) === '1';
  } catch {
    // storage unavailable — treat as untouched
  }
  if (read) return { pct: 100, read: true };
  const total = Math.max(1, totalSlides);
  return { pct: Math.min(100, Math.max(0, Math.round((progress / total) * 100))), read: false };
}

/** Best results a topic has stored, by level. */
export function topicBests(topic: string, store: Storage = localStorage): QuizLevel[] {
  return (['nurse', 'doctor'] as QuizLevel[]).filter((lvl) => {
    try {
      return store.getItem(quizKey(topic, lvl)) !== null;
    } catch {
      return false;
    }
  });
}

/** Returns how many keys were actually removed, so the caller can skip a needless reload. */
export const clearLecture = (slug: string, store: Storage = localStorage) =>
  remove([progressKey(slug), readKey(slug)], store);

export const clearTopicQuizzes = (topic: string, store: Storage = localStorage) =>
  remove([quizKey(topic, 'nurse'), quizKey(topic, 'doctor')], store);

export const clearAllProgress = (store: Storage = localStorage) =>
  remove(ownKeys(store).filter((k) => k.startsWith(`${KEY_PREFIX}progress:`) || k.startsWith(`${KEY_PREFIX}read:`)), store);

export const clearAllQuizzes = (store: Storage = localStorage) =>
  remove(ownKeys(store).filter((k) => k.startsWith(`${KEY_PREFIX}quiz:`)), store);

export const clearEverything = (store: Storage = localStorage) => remove(ownKeys(store), store);
