import { describe, it, expect } from 'vitest';
import {
  isCorrect,
  computeResult,
  livesLeft,
  formatClock,
  outcomeOf,
  QUIZ_LIVES,
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
