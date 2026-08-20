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
