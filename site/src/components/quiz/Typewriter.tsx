import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { schedule, visibleAt } from '../../lib/typewriter';

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  text: string;
  /** Incremented by the parent to jump to the end of the line. */
  skipTick: number;
  onDone: () => void;
}

/**
 * Types `text` out against a clock.
 *
 * The reveal writes to the DOM directly from a requestAnimationFrame loop rather than
 * going through component state. A state update per character makes every character wait
 * for a render *and* for Preact to run effects after paint, so the line ends up typing at
 * whatever frame rate the page happens to manage — measured at ~78 ms per character on the
 * quiz page, against an intended 7 ms. Reading the character count out of a precomputed
 * schedule keeps the line on time: a dropped frame reveals several characters at once
 * instead of delaying all of them.
 *
 * The whole line is always in the DOM, with the untyped tail transparent but still
 * occupying its space, so the box never reflows as the text arrives and screen readers get
 * the finished sentence rather than a stream of fragments.
 */
export default function Typewriter({ text, skipTick, onDone }: Props) {
  const head = useRef<HTMLSpanElement>(null);
  const tail = useRef<HTMLSpanElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const times = useMemo(() => schedule(text), [text]);
  /* Only used to jump to the end; the running reveal never re-renders this component. */
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const show = (n: number) => {
      if (head.current) head.current.textContent = text.slice(0, n);
      if (tail.current) tail.current.textContent = text.slice(n);
      if (caret.current) caret.current.hidden = n >= text.length;
    };

    if (reducedMotion() || skipTick > 0) {
      show(text.length);
      setFinished(true);
      onDone();
      return;
    }

    let raf = 0;
    const start = performance.now();
    let shown = -1;
    const step = (now: number) => {
      const n = visibleAt(times, now - start);
      if (n !== shown) {
        shown = n;
        show(n);
      }
      if (n >= text.length) {
        setFinished(true);
        onDone();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    show(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, times, skipTick]);

  return (
    <span class="tw">
      {/* Rendered once with the full text so the line is complete for assistive tech and
          for a reader with scripting disabled; the loop above rewrites the split. */}
      <span ref={head} />
      <span ref={caret} class="tw-caret" aria-hidden="true" hidden={finished}>▌</span>
      <span ref={tail} class="tw-rest">{text}</span>
    </span>
  );
}
