import { useEffect, useState } from 'preact/hooks';
import { charDelay } from '../../lib/typewriter';

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reveals `text` one character at a time. `skip()` jumps to the end. */
export function useTypewriter(text: string) {
  const [n, setN] = useState(0);

  /* A new line starts from scratch — unless the reader asked for less motion, in which
     case there is no typing at all and the line is simply there. */
  useEffect(() => setN(reducedMotion() ? text.length : 0), [text]);

  useEffect(() => {
    if (n >= text.length) return;
    const id = setTimeout(() => setN((v) => v + 1), charDelay(text[n]));
    return () => clearTimeout(id);
  }, [n, text]);

  return { n, done: n >= text.length, skip: () => setN(text.length) };
}

interface Props { text: string; n: number; done: boolean }

/**
 * The whole line is always in the DOM: the untyped tail is transparent but still occupies
 * its space, so the box never reflows as the text arrives and screen readers get the
 * finished sentence instead of a stream of fragments.
 */
export default function Typewriter({ text, n, done }: Props) {
  return (
    <span class="tw">
      <span>{text.slice(0, n)}</span>
      {!done && <span class="tw-caret" aria-hidden="true">▌</span>}
      <span class="tw-rest">{text.slice(n)}</span>
    </span>
  );
}
