import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveBest,
  getBest,
  ownKeys,
  lectureState,
  topicBests,
  clearLecture,
  clearTopicQuizzes,
  clearAllProgress,
  clearAllQuizzes,
  clearEverything,
} from './storage';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  /* Enumerable: the clear-all helpers walk the store by index, and a stub that always
     reports length 0 would let them pass while clearing nothing. */
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as unknown as Storage;
});

const seed = () => {
  localStorage.setItem('aiti:progress:03-terminalni-stany', '7');
  localStorage.setItem('aiti:read:03-terminalni-stany', '1');
  localStorage.setItem('aiti:progress:04-hostra-sercevo-sudynna-nedostatnist', '5');
  localStorage.setItem('aiti:quiz:03:nurse', '{"score":9,"total":20,"date":"2026-08-20"}');
  localStorage.setItem('aiti:quiz:04:doctor', '{"score":18,"total":20,"date":"2026-08-20"}');
  localStorage.setItem('theme-unrelated', 'x');
};

describe('best results', () => {
  it('saves and reads', () => {
    saveBest('03', 'nurse', { score: 7, total: 12, date: '2026-08-17' });
    expect(getBest('03', 'nurse')?.score).toBe(7);
  });
  it('keeps better result', () => {
    saveBest('03', 'nurse', { score: 10, total: 12, date: '2026-08-17' });
    saveBest('03', 'nurse', { score: 4, total: 12, date: '2026-08-18' });
    expect(getBest('03', 'nurse')?.score).toBe(10);
  });
  it('null when absent or corrupted', () => {
    expect(getBest('03', 'doctor')).toBeNull();
    localStorage.setItem('aiti:quiz:03:doctor', '{broken');
    expect(getBest('03', 'doctor')).toBeNull();
  });
});

describe('reading state', () => {
  it('reports percentage of slides reached', () => {
    localStorage.setItem('aiti:progress:05-x', '5');
    expect(lectureState('05-x', 20).pct).toBe(25);
  });
  it('a finished lecture is 100 % whatever the slide counter says', () => {
    localStorage.setItem('aiti:progress:05-x', '3');
    localStorage.setItem('aiti:read:05-x', '1');
    expect(lectureState('05-x', 20)).toEqual({ pct: 100, read: true });
  });
  it('untouched lecture is zero', () => {
    expect(lectureState('05-x', 20)).toEqual({ pct: 0, read: false });
  });
  it('lists the levels a topic has results for', () => {
    seed();
    expect(topicBests('03')).toEqual(['nurse']);
    expect(topicBests('04')).toEqual(['doctor']);
    expect(topicBests('07')).toEqual([]);
  });
});

describe('clearing', () => {
  it('own keys ignore anything outside the prefix', () => {
    seed();
    expect(ownKeys()).toHaveLength(5);
    expect(ownKeys()).not.toContain('theme-unrelated');
  });

  it('one lecture drops its progress and its read flag only', () => {
    seed();
    expect(clearLecture('03-terminalni-stany')).toBe(2);
    expect(localStorage.getItem('aiti:progress:03-terminalni-stany')).toBeNull();
    expect(localStorage.getItem('aiti:read:03-terminalni-stany')).toBeNull();
    expect(localStorage.getItem('aiti:progress:04-hostra-sercevo-sudynna-nedostatnist')).toBe('5');
    expect(localStorage.getItem('aiti:quiz:03:nurse')).not.toBeNull();
  });

  it('one topic drops both its quiz levels only', () => {
    seed();
    expect(clearTopicQuizzes('03')).toBe(1);
    expect(localStorage.getItem('aiti:quiz:03:nurse')).toBeNull();
    expect(localStorage.getItem('aiti:quiz:04:doctor')).not.toBeNull();
    expect(localStorage.getItem('aiti:read:03-terminalni-stany')).toBe('1');
  });

  it('all progress leaves the quiz results alone, and the reverse', () => {
    seed();
    expect(clearAllProgress()).toBe(3);
    expect(ownKeys()).toEqual(['aiti:quiz:03:nurse', 'aiti:quiz:04:doctor']);
    expect(clearAllQuizzes()).toBe(2);
    expect(ownKeys()).toEqual([]);
  });

  it('everything clears our keys and nothing else', () => {
    seed();
    expect(clearEverything()).toBe(5);
    expect(ownKeys()).toEqual([]);
    expect(localStorage.getItem('theme-unrelated')).toBe('x');
  });

  it('clearing what is already gone removes nothing', () => {
    expect(clearLecture('99-nope')).toBe(0);
    expect(clearEverything()).toBe(0);
  });
});
