import { describe, expect, it } from 'vitest';
import { charDelay, MAX_LINE_MS, schedule, speedFor, TYPE_MS, typingDuration, visibleAt } from './typewriter';

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

describe('speedFor', () => {
  const vignette =
    'Чоловік 64 років, передній інфаркт міокарда, 3 години від початку болю. Шкіра холодна й волога, ' +
    'АТ 82/55 мм рт. ст., ЧСС 112/хв, сплутаний, діурезу за годину немає. Лактат 4,2 ммоль/л. ' +
    'На ехокардіографії — фракція викиду близько 25 %, нижня порожниста вена не спадається. ' +
    'Яка стадія за SCAI і який профіль перфузії?';

  it('leaves short lines at the base speed', () => {
    expect(speedFor('Коротке питання?')).toBe(1);
  });

  it('speeds up a line that would otherwise run past the cap', () => {
    expect(speedFor(vignette)).toBeLessThan(1);
  });

  it('keeps even a long clinical vignette inside the cap', () => {
    expect(typingDuration(vignette) * speedFor(vignette)).toBeLessThanOrEqual(MAX_LINE_MS + 1);
  });

  it('never slows a line down', () => {
    for (const t of ['', 'а', 'Питання.', 'а'.repeat(400)]) {
      expect(speedFor(t)).toBeLessThanOrEqual(1);
    }
  });
});

describe('schedule / visibleAt', () => {
  it('reveals nothing before the first character is due', () => {
    const t = schedule('абв');
    expect(visibleAt(t, 0)).toBe(0);
  });

  it('reveals characters in order as time passes', () => {
    const t = schedule('абв');
    expect(visibleAt(t, TYPE_MS)).toBe(1);
    expect(visibleAt(t, TYPE_MS * 2)).toBe(2);
    expect(visibleAt(t, TYPE_MS * 3)).toBe(3);
  });

  it('reveals the whole line once the schedule is exhausted', () => {
    const t = schedule('абв');
    expect(visibleAt(t, 10_000)).toBe(3);
  });

  it('catches up after a long gap instead of falling behind', () => {
    const t = schedule('а'.repeat(50));
    // a frame that arrives 20 characters late reveals all 20 at once
    expect(visibleAt(t, TYPE_MS * 20)).toBe(20);
  });

  it('finishes a long line within the cap', () => {
    const long = 'а, '.repeat(140);
    const t = schedule(long);
    expect(t[t.length - 1]).toBeLessThanOrEqual(MAX_LINE_MS + 1);
    expect(visibleAt(t, MAX_LINE_MS + 1)).toBe(long.length);
  });

  it('is empty for an empty line', () => {
    expect(schedule('').length).toBe(0);
    expect(visibleAt(schedule(''), 0)).toBe(0);
  });
});
