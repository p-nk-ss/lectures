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
