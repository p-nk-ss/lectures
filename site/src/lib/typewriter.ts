/** Timing for the dialogue typewriter. Kept out of the component so it can be tested. */

/** Base delay between characters, in ms. Fast enough that a 20-question run does not
    lose meaningful time off the 10-minute clock. */
export const TYPE_MS = 12;

/** Punctuation gets a beat after it, the way game dialogue does. */
const PAUSE_AFTER: Record<string, number> = {
  '.': 200,
  '!': 200,
  '?': 200,
  '…': 240,
  ',': 90,
  ':': 130,
  ';': 130,
  '—': 130,
};

/** Delay before the character *after* `ch` appears. */
export function charDelay(ch: string | undefined): number {
  if (ch === undefined) return TYPE_MS;
  return TYPE_MS + (PAUSE_AFTER[ch] ?? 0);
}

/** How long the whole string takes to type, in ms. Used to size waiting states. */
export function typingDuration(text: string): number {
  let total = 0;
  for (const ch of text) total += charDelay(ch);
  return total;
}

/** No line holds the reader longer than this; the run clock is ticking meanwhile. */
export const MAX_LINE_MS = 3500;

/**
 * Multiplier applied to every character delay so a long line still lands inside
 * MAX_LINE_MS. A clinical vignette runs past 300 characters, which at the base speed
 * would take some seven seconds before the answers even appear.
 */
export function speedFor(text: string): number {
  const natural = typingDuration(text);
  return natural > MAX_LINE_MS ? MAX_LINE_MS / natural : 1;
}

/**
 * Cumulative time, in ms from the start of the line, at which each character appears.
 * `schedule[i]` is when character `i` becomes visible, so the count of visible characters
 * at time `t` is the number of entries ≤ `t`.
 *
 * The reveal is driven off this table rather than off a chain of timers: a chain makes
 * each character wait for a render, so on a busy page the line types as slowly as the page
 * happens to paint. Against a schedule, a dropped frame just reveals more characters at
 * once and the line still finishes on time.
 */
export function schedule(text: string): Float64Array {
  const speed = speedFor(text);
  const out = new Float64Array(text.length);
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    t += charDelay(text[i]) * speed;
    out[i] = t;
  }
  return out;
}

/** How many characters of `text` are visible `elapsed` ms into the line. */
export function visibleAt(times: Float64Array, elapsed: number): number {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= elapsed) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
