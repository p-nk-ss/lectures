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

/** Lives lost one per wrong answer; the run ends when they run out. */
export const QUIZ_LIVES = 3;
/** Whole-run budget in seconds, shared across all questions. */
export const QUIZ_TIME_LIMIT = 10 * 60;

export type QuizOutcome = 'win' | 'lives' | 'time';

export interface RunState {
  /** Questions answered so far. */
  answered: number;
  total: number;
  /** Wrong answers so far. */
  wrong: number;
  secondsLeft: number;
}

export const livesLeft = (wrong: number): number => Math.max(0, QUIZ_LIVES - wrong);

/** MM:SS, clamped at zero — a negative clock would read as a bug, not as "time up". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * How the run ended, or null while it is still going.
 *
 * Time and lives are checked before completion: a run that used its last life on the
 * final question has lost, even though every question is answered.
 */
export function outcomeOf(run: RunState): QuizOutcome | null {
  if (run.secondsLeft <= 0) return 'time';
  if (livesLeft(run.wrong) === 0) return 'lives';
  if (run.answered >= run.total) return 'win';
  return null;
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
