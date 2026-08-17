import { describe, it, expect, beforeEach } from 'vitest';
import { saveBest, getBest } from './storage';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

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
