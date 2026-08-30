export type QuizLevel = 'nurse' | 'doctor';

export interface Question {
  id: string;
  type: 'single' | 'multiple';
  /** Clinical vignette or plain recall. Drives the case quota of a run. */
  kind?: 'case' | 'recall';
  /** Guideline behind the claim, plus where the case skeleton came from. Not rendered. */
  source?: string;
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
export const QUIZ_TIME_LIMIT = 15 * 60;

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

/* ---- Assembling one run out of the bank -------------------------------------------- */

/** Questions played in one run, however large the bank behind it is. */
export const QUIZ_RUN_SIZE = 20;
/** Share of a run that must be clinical vignettes rather than recall. */
export const CASE_SHARE = 0.6;
/** How many past runs are remembered, so the next one draws something else. */
export const SEEN_RUNS = 2;
/** Ids kept in the seen list. Older ones fall off the end. */
export const SEEN_MEMORY = QUIZ_RUN_SIZE * SEEN_RUNS;

/** Fisher-Yates on a copy. `rnd` is injected so the tests are deterministic. */
function shuffled<T>(xs: readonly T[], rnd: () => number): T[] {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The questions for one run: a case quota, unseen ones first, in random order.
 *
 * Every count is clamped to what the bank actually holds and short pools are backfilled
 * from the rest, so a bank of twenty still yields twenty and the one-question fixture
 * yields one. The quota is a target, never a reason to return fewer questions.
 */
export function pickRun(
  bank: readonly Question[],
  seen: readonly string[] = [],
  rnd: () => number = Math.random,
): Question[] {
  const size = Math.min(QUIZ_RUN_SIZE, bank.length);
  const seenSet = new Set(seen);
  const cases = bank.filter((q) => q.kind === 'case');
  const recall = bank.filter((q) => q.kind !== 'case');
  const fresh = (pool: readonly Question[]) => pool.filter((q) => !seenSet.has(q.id)).length;

  /* The quota bends before it repeats a question. A bank with only a handful of recall
     questions would otherwise put every one of them into every run: the reader would meet
     the same eight questions each time while forty unseen cases sat unused. */
  let wantCases = Math.round(size * CASE_SHARE);
  let wantRecall = size - wantCases;
  const toCases = Math.min(Math.max(0, wantRecall - fresh(recall)), Math.max(0, fresh(cases) - wantCases));
  wantCases += toCases;
  wantRecall -= toCases;
  const toRecall = Math.min(Math.max(0, wantCases - fresh(cases)), Math.max(0, fresh(recall) - wantRecall));
  wantCases -= toRecall;
  wantRecall += toRecall;

  /* Unseen first: a reader who just played should meet new questions, not a reshuffle. */
  const draw = (pool: readonly Question[], n: number) =>
    n <= 0
      ? []
      : [
          ...shuffled(pool.filter((q) => !seenSet.has(q.id)), rnd),
          ...shuffled(pool.filter((q) => seenSet.has(q.id)), rnd),
        ].slice(0, n);

  const picked = [...draw(cases, wantCases), ...draw(recall, wantRecall)];
  if (picked.length < size) {
    const taken = new Set(picked.map((q) => q.id));
    picked.push(...draw(bank.filter((q) => !taken.has(q.id)), size - picked.length));
  }
  return shuffled(picked, rnd);
}

/**
 * The same question with its options in a different order.
 *
 * Without this the correct answer keeps its position across runs and is remembered as a
 * position rather than as an answer. Safe here because no explanation refers to the order.
 */
export function shuffleOptions(q: Question, rnd: () => number = Math.random): Question {
  const order = shuffled(q.options.map((_, i) => i), rnd);
  return {
    ...q,
    options: order.map((src) => q.options[src]),
    correct: order.flatMap((src, dst) => (q.correct.includes(src) ? [dst] : [])),
  };
}
