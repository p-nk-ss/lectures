import { describe, it, expect } from 'vitest';
import {
  isCorrect,
  computeResult,
  livesLeft,
  formatClock,
  outcomeOf,
  QUIZ_LIVES,
  QUIZ_RUN_SIZE,
  CASE_SHARE,
  pickRun,
  shuffleOptions,
  type Question,
} from './quiz';

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

describe('livesLeft', () => {
  it('spends one life per wrong answer and never goes negative', () => {
    expect(livesLeft(0)).toBe(QUIZ_LIVES);
    expect(livesLeft(1)).toBe(QUIZ_LIVES - 1);
    expect(livesLeft(QUIZ_LIVES)).toBe(0);
    expect(livesLeft(QUIZ_LIVES + 5)).toBe(0);
  });
});

describe('formatClock', () => {
  it('pads to MM:SS', () => {
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(9)).toBe('00:09');
  });
  it('clamps at zero rather than showing a negative clock', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(-3)).toBe('00:00');
  });
});

describe('outcomeOf', () => {
  const run = (o: Partial<Parameters<typeof outcomeOf>[0]> = {}) =>
    outcomeOf({ answered: 0, total: 20, wrong: 0, secondsLeft: 600, ...o });

  it('returns null while the run is going', () => {
    expect(run({ answered: 5, wrong: 2, secondsLeft: 120 })).toBeNull();
  });
  it('ends on time running out', () => {
    expect(run({ secondsLeft: 0 })).toBe('time');
  });
  it('ends on lives running out', () => {
    expect(run({ wrong: QUIZ_LIVES })).toBe('lives');
  });
  it('wins once every question is answered', () => {
    expect(run({ answered: 20, wrong: 2 })).toBe('win');
  });
  it('losing on the last question is a loss, not a win', () => {
    expect(run({ answered: 20, wrong: QUIZ_LIVES })).toBe('lives');
  });
  it('time out beats everything else', () => {
    expect(run({ answered: 20, wrong: QUIZ_LIVES, secondsLeft: 0 })).toBe('time');
  });
});

/* A tiny LCG: the shuffles have to be deterministic or these tests flap. */
const seeded = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const mk = (id: string, kind: 'case' | 'recall'): Question => ({
  id,
  kind,
  type: 'single',
  text: id,
  options: ['a', 'b', 'c', 'd'],
  correct: [1],
  explanation: '',
});
const bank = (cases: number, recall: number) => [
  ...Array.from({ length: cases }, (_, i) => mk(`c${i}`, 'case')),
  ...Array.from({ length: recall }, (_, i) => mk(`r${i}`, 'recall')),
];
const cases = (qs: Question[]) => qs.filter((q) => q.kind === 'case').length;

describe('picking a run', () => {
  it('keeps the case quota when the bank can supply it', () => {
    const run = pickRun(bank(40, 40), [], seeded(7));
    expect(run).toHaveLength(QUIZ_RUN_SIZE);
    expect(cases(run)).toBe(Math.round(QUIZ_RUN_SIZE * CASE_SHARE));
  });

  it('never returns the same ids twice in one run', () => {
    const run = pickRun(bank(40, 40), [], seeded(3));
    expect(new Set(run.map((q) => q.id)).size).toBe(run.length);
  });

  it('a bank of exactly one run gives that whole run, quota or not', () => {
    expect(pickRun(bank(0, 20), [], seeded(1))).toHaveLength(20);
  });

  it('backfills when the case pool is short of the quota', () => {
    const run = pickRun(bank(3, 40), [], seeded(11));
    expect(run).toHaveLength(QUIZ_RUN_SIZE);
    expect(cases(run)).toBe(3);
  });

  it('survives the one-question fixture', () => {
    expect(pickRun(bank(0, 1), [], seeded(1))).toHaveLength(1);
  });

  it('draws unseen questions before repeating seen ones', () => {
    const b = bank(0, 40);
    const seen = b.slice(0, 20).map((q) => q.id);
    const run = pickRun(b, seen, seeded(5));
    expect(run.every((q) => !seen.includes(q.id))).toBe(true);
  });

  it('falls back to seen questions rather than returning a short run', () => {
    const b = bank(0, 20);
    const run = pickRun(b, b.map((q) => q.id), seeded(5));
    expect(run).toHaveLength(20);
  });

  it('two consecutive draws from a large bank differ', () => {
    const b = bank(40, 40);
    const a = pickRun(b, [], seeded(2)).map((q) => q.id);
    const c = pickRun(b, a, seeded(2)).map((q) => q.id);
    expect(a.join()).not.toBe(c.join());
  });
});

describe('shuffling the options', () => {
  const q: Question = {
    id: 'q',
    type: 'multiple',
    text: 't',
    options: ['a', 'b', 'c', 'd'],
    correct: [1, 3],
    explanation: '',
  };

  it('keeps the same options, only reordered', () => {
    const s = shuffleOptions(q, seeded(9));
    expect([...s.options].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('the verdict does not change: the same answers stay right', () => {
    const s = shuffleOptions(q, seeded(9));
    const picked = q.correct.map((i) => s.options.indexOf(q.options[i]));
    expect(isCorrect(s, picked)).toBe(true);
    expect(s.correct.slice().sort()).toEqual(picked.slice().sort());
  });

  it('a wrong answer stays wrong', () => {
    const s = shuffleOptions(q, seeded(9));
    const wrong = [s.options.indexOf('a'), s.options.indexOf('b')];
    expect(isCorrect(s, wrong)).toBe(false);
  });
});
