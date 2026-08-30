import { describe, it, expect } from 'vitest';
import { groupBanks, findBank, type QuizEntry } from './banks';
import type { Question } from './quiz';

const q = (id: string): Question => ({
  id,
  type: 'single',
  text: id,
  options: ['a', 'b', 'c', 'd'],
  correct: [0],
  explanation: '',
});
const entry = (id: string, topic: string, level: 'nurse' | 'doctor', ids: string[]): QuizEntry => ({
  id,
  data: { topic, level, questions: ids.map(q) },
});

describe('grouping quiz files into banks', () => {
  it('merges the files of one quiz, base file first', () => {
    const banks = groupBanks([
      entry('03-nurse-cases', '03', 'nurse', ['c1']),
      entry('03-nurse', '03', 'nurse', ['n1']),
    ]);
    expect(banks).toHaveLength(1);
    expect(banks[0].questions.map((x) => x.id)).toEqual(['n1', 'c1']);
  });

  it('keeps topics and levels apart, медсестра first', () => {
    const banks = groupBanks([
      entry('04-doctor', '04', 'doctor', ['a']),
      entry('03-doctor', '03', 'doctor', ['b']),
      entry('03-nurse', '03', 'nurse', ['c']),
    ]);
    expect(banks.map((b) => `${b.topic}:${b.level}`)).toEqual(['03:nurse', '03:doctor', '04:doctor']);
  });

  it('a duplicate id inside one bank is a build error', () => {
    expect(() =>
      groupBanks([entry('03-nurse', '03', 'nurse', ['n1']), entry('03-nurse-cases', '03', 'nurse', ['n1'])]),
    ).toThrow(/Duplicate question id "n1"/);
  });

  it('the same id in a different bank is fine', () => {
    expect(() =>
      groupBanks([entry('03-nurse', '03', 'nurse', ['n1']), entry('03-doctor', '03', 'doctor', ['n1'])]),
    ).not.toThrow();
  });

  it('finds a bank by topic and level', () => {
    const banks = groupBanks([entry('03-nurse', '03', 'nurse', ['n1'])]);
    expect(findBank(banks, '03', 'nurse')?.questions).toHaveLength(1);
    expect(findBank(banks, '03', 'doctor')).toBeUndefined();
  });
});
