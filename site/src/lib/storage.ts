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
