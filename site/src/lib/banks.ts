import type { Question, QuizLevel } from './quiz';

/**
 * One quiz is spread over several files — the weeded original and the clinical cases
 * written later — so that a new batch is a new file to review rather than an edit to
 * content that has already been signed off. This puts them back together.
 */

/** Structural, not `CollectionEntry<'quizzes'>`: the merge is testable without Astro. */
export interface QuizEntry {
  id: string;
  data: { topic: string; level: QuizLevel; questions: Question[] };
}

export interface Bank {
  topic: string;
  level: QuizLevel;
  questions: Question[];
}

const bankKey = (topic: string, level: QuizLevel) => `${topic}:${level}`;

/**
 * Banks by topic and level, topics ascending and медсестра before лікар.
 *
 * Files are merged in id order, so the base file comes before its `-cases` companion and
 * the bank is the same on every build. A duplicate question id across the files of one
 * bank is a build error: ids are what the seen-history and the result screen key on, and
 * a collision would silently make two questions one.
 */
export function groupBanks(entries: QuizEntry[]): Bank[] {
  const byKey = new Map<string, Bank>();
  for (const e of [...entries].sort((a, b) => a.id.localeCompare(b.id))) {
    const { topic, level, questions } = e.data;
    const bank = byKey.get(bankKey(topic, level)) ?? { topic, level, questions: [] };
    for (const q of questions) {
      if (bank.questions.some((x) => x.id === q.id)) {
        throw new Error(`Duplicate question id "${q.id}" in quiz ${topic}/${level} (${e.id})`);
      }
      bank.questions.push(q);
    }
    byKey.set(bankKey(topic, level), bank);
  }
  return [...byKey.values()].sort(
    (a, b) => a.topic.localeCompare(b.topic) || (a.level === b.level ? 0 : a.level === 'nurse' ? -1 : 1),
  );
}

export const findBank = (banks: Bank[], topic: string, level: QuizLevel): Bank | undefined =>
  banks.find((b) => b.topic === topic && b.level === level);
