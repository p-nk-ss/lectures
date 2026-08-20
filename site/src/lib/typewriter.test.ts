import { describe, expect, it } from 'vitest';
import { charDelay, TYPE_MS, typingDuration } from './typewriter';

describe('charDelay', () => {
  it('runs at the base speed for ordinary characters', () => {
    expect(charDelay('а')).toBe(TYPE_MS);
    expect(charDelay(' ')).toBe(TYPE_MS);
  });

  it('adds a beat after sentence-ending punctuation', () => {
    expect(charDelay('.')).toBeGreaterThan(charDelay('а'));
    expect(charDelay('?')).toBe(charDelay('.'));
  });

  it('pauses less on a comma than on a full stop', () => {
    expect(charDelay(',')).toBeLessThan(charDelay('.'));
    expect(charDelay(',')).toBeGreaterThan(charDelay('а'));
  });

  it('falls back to the base speed past the end of the string', () => {
    expect(charDelay(undefined)).toBe(TYPE_MS);
  });
});

describe('typingDuration', () => {
  it('is zero for an empty string', () => {
    expect(typingDuration('')).toBe(0);
  });

  it('scales with length', () => {
    expect(typingDuration('аааааа')).toBe(6 * TYPE_MS);
  });

  it('counts punctuation pauses', () => {
    expect(typingDuration('аб.')).toBeGreaterThan(typingDuration('абв'));
  });

  it('keeps a typical question well under the run clock', () => {
    const q = 'За якою ознакою поділяють анестезію на інгаляційну та неінгаляційну?';
    expect(typingDuration(q)).toBeLessThan(2000);
  });
});
