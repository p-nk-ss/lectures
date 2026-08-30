import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  computeResult,
  formatClock,
  isCorrect,
  livesLeft,
  outcomeOf,
  pickRun,
  QUIZ_LIVES,
  QUIZ_RUN_SIZE,
  QUIZ_TIME_LIMIT,
  shuffleOptions,
  type Question,
  type QuizLevel,
  type QuizOutcome,
} from '../../lib/quiz';
import { getSeen, pushSeen, saveBest } from '../../lib/storage';
import Scene, { type Mood } from './Scene';
import Typewriter from './Typewriter';

interface Props { topic: string; level: QuizLevel; bankUrl: string; bankSize: number }

/* The doctor has a name; the student is the reader and never speaks. */
const DOCTOR = 'ВІРДЖИНІЯ';

export default function Quiz({ topic, level, bankUrl, bankSize }: Props) {
  /* The bank is far larger than one run and is fetched rather than inlined into the page:
     the reader is on the rules panel while it arrives, and the run only needs it at the
     moment it is assembled. */
  const [bank, setBank] = useState<Question[] | null>(null);
  const [bankError, setBankError] = useState(false);
  const [pool, setPool] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
  const [wrong, setWrong] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_TIME_LIMIT);
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  /* Retrying the wrong ones is practice: no clock, no lives, no saved result. */
  const [practice, setPractice] = useState(false);
  /* The clock is shared by the whole run, so it must not start before the reader does. */
  const [started, setStarted] = useState(false);
  /* The doctor reacts before she explains: without this beat the nod or the head shake
     would only start once the whole explanation had finished typing. */
  const [reacting, setReacting] = useState(false);

  const q = pool[idx];
  const lives = livesLeft(wrong);
  const right = q ? isCorrect(q, selected) : false;

  /* The doctor asks, then reacts. Both lines live in the same box, and the idle one is
     kept as an invisible sizer so switching between them never resizes it. */
  const ask = q ? (q.vignette ? `${q.vignette} ${q.text}` : q.text) : '';
  const react = q ? q.explanation : '';
  const line = checked ? react : ask;
  const other = checked ? ask : react;
  /* The typing cursor lives inside Typewriter; the run only needs to know when the line
     is finished, and a counter to tell it to jump to the end. */
  const [typed, setTyped] = useState(false);
  const [skipTick, setSkipTick] = useState(0);
  useEffect(() => { setTyped(false); setSkipTick(0); }, [line]);

  const loadBank = () => {
    setBankError(false);
    fetch(bankUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setBank(d.questions as Question[]))
      .catch(() => setBankError(true));
  };
  useEffect(loadBank, [bankUrl]);

  /* One run: a fresh sample, its options reordered, and the ids remembered so the next
     run reaches for something else. */
  const startRun = () => {
    if (!bank) return;
    const run = pickRun(bank, getSeen(topic, level)).map((q) => shuffleOptions(q));
    pushSeen(topic, level, run.map((q) => q.id));
    setPool(run);
    setPractice(false);
    setStarted(true);
    setIdx(0);
    setSelected([]);
    setChecked(false);
    setAnswers(new Map());
    setWrong(0);
    setReacting(false);
    setSecondsLeft(QUIZ_TIME_LIMIT);
    setOutcome(null);
  };

  const finish = (o: QuizOutcome, at: Map<string, number[]>) => {
    if (!practice) {
      const r = computeResult(pool, at);
      saveBest(topic, level, {
        score: r.score,
        total: r.total,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setOutcome(o);
  };

  useEffect(() => {
    if (!started || practice || outcome) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [started, practice, outcome]);

  useEffect(() => {
    if (!started || practice || outcome || secondsLeft > 0) return;
    finish('time', answers);
  }, [secondsLeft, started, practice, outcome]);

  const toggle = (i: number) => {
    if (checked) return;
    if (q.type === 'single') setSelected([i]);
    else setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };

  const check = () => {
    const next = new Map(answers).set(q.id, selected);
    setChecked(true);
    setAnswers(next);
    setReacting(true);
    if (!isCorrect(q, selected)) setWrong((w) => w + 1);
  };

  useEffect(() => {
    if (!reacting) return;
    const id = setTimeout(() => setReacting(false), 1100);
    return () => clearTimeout(id);
  }, [reacting]);

  const advance = () => {
    const answered = idx + 1;
    const o = practice
      ? (answered >= pool.length ? 'win' : null)
      : outcomeOf({ answered, total: pool.length, wrong, secondsLeft });
    if (o) {
      finish(o, answers);
      return;
    }
    setIdx(answered);
    setSelected([]);
    setChecked(false);
    setReacting(false);
  };

  const retryWrong = () => {
    const { wrongIds } = computeResult(pool, answers);
    setPool(pool.filter((x) => wrongIds.includes(x.id)));
    setPractice(true);
    setStarted(true);
    setIdx(0);
    setSelected([]);
    setChecked(false);
    setAnswers(new Map());
    setWrong(0);
    setReacting(false);
    setOutcome(null);
  };

  /* "Пройти заново" means a new sample, not the same twenty again. */
  const restart = startRun;

  const hearts = (cls: string) => (
    <span class={cls} aria-label={`Життя: ${lives} з ${QUIZ_LIVES}`}>
      {Array.from({ length: QUIZ_LIVES }, (_, i) => (
        <span key={i} class={`pixel-heart ${i < lives ? 'alive' : 'spent'}`} aria-hidden="true">
          <span />
        </span>
      ))}
    </span>
  );

  if (!started) {
    return (
      <div class="quiz quiz-intro">
        {/* A monitor trace before the shift starts. Hotlinked from Giphy's CDN like the
            result stickers, and decorative — the rules below carry the meaning. */}
        <div class="intro-art" aria-hidden="true">
          <img
            src="https://media.giphy.com/media/WNSxSbRwVRz7q/giphy.gif"
            alt=""
            width={500}
            height={375}
            loading="lazy"
          />
        </div>
        <p class="kicker"><span class="g">★</span> ПРАВИЛА <span class="g">★</span></p>
        <ul class="rules">
          <li>
            <b>{Math.min(QUIZ_RUN_SIZE, bankSize)}</b>
            <span>
              питань — одне за одним, повернутись назад не можна
              {bankSize > QUIZ_RUN_SIZE && ' (щоразу інші, з банку на ' + bankSize + ')'}
            </span>
          </li>
          <li>
            <b>{formatClock(QUIZ_TIME_LIMIT)}</b>
            <span>на весь тест; час іде безперервно, зокрема поки читаєте пояснення</span>
          </li>
          <li>
            {hearts('rule-lives')}
            <span>життя — кожна помилка забирає одне, на нулі тест завершується</span>
          </li>
        </ul>
        <p class="intro-note">
          Після завершення можна розібрати помилкові питання без таймера й життів.
        </p>
        <button class="primary" onClick={startRun} disabled={!bank}>
          <span class="g">▶</span> {bank ? 'ПОЧАТИ ЗМІНУ' : 'ЗАВАНТАЖЕННЯ…'}
        </button>
        {bankError && (
          <p class="bank-error" role="alert">
            Не вдалося завантажити питання.{' '}
            <button class="retry" onClick={loadBank}>Спробувати ще раз</button>
          </p>
        )}
      </div>
    );
  }

  if (outcome) {
    const r = computeResult(pool, answers);
    const won = outcome === 'win';
    const perfect = won && r.score === r.total;
    const heading = won
      ? (perfect ? 'PERFECT RUN' : 'РІВЕНЬ ПРОЙДЕНО')
      : outcome === 'lives' ? 'GAME OVER' : 'ЧАС ВИЙШОВ';
    const note = won
      ? (perfect ? 'Жодної помилки.' : 'Тест складено.')
      : outcome === 'lives'
        ? `Життя скінчились на питанні ${idx + 1} з ${pool.length}.`
        : `Ви встигли відповісти на ${answers.size} з ${pool.length}.`;
    /* Three outcomes, three stickers: flawless, passed-with-mistakes, failed. */
    const sticker = !won
      ? { id: 'oS36z5ZEMrZYP2pFd0', file: 'giphy.gif', w: 516, h: 516, alt: 'Піксельна анімація: GAME OVER' }
      : perfect
        ? { id: 'S1UvyIzO5wUPoEWh9i', file: 'giphy.gif', w: 480, h: 384, alt: 'Анімація бездоганного проходження' }
        : { id: 'VbtB71uYYChnZjGa6Y', file: 'giphy.gif', w: 480, h: 480, alt: 'Анімація складеного тесту: not great, not terrible' };

    return (
      <div class={`quiz quiz-result ${won ? 'won' : 'lost'}`}>
        <Scene mood={won ? 'win' : 'lose'} />
        <div class="outcome-art">
          {/* Hotlinked from Giphy's CDN rather than copied into the repo: these are
              third-party stickers, and the winning one alone is 1.6 MB. `file` picks the
              rendition — the art box is 190px tall, so a 200w copy is enough when a
              replacement sticker runs to megabytes. */}
          <img
            src={`https://media.giphy.com/media/${sticker.id}/${sticker.file}`}
            alt={sticker.alt}
            width={sticker.w}
            height={sticker.h}
            loading="lazy"
          />
        </div>
        <p class="outcome">{heading}</p>
        <p class="score">{r.score} / {r.total}</p>
        <p>{note}</p>
        <div class="result-actions">
          {r.wrongIds.length > 0 && (
            <button onClick={retryWrong}>Розібрати помилки ({r.wrongIds.length})</button>
          )}
          <button onClick={restart}>Пройти заново</button>
        </div>
        <a href={`/tests/${level}/`}>До списку тестів</a>
      </div>
    );
  }

  const low = !practice && secondsLeft <= 60;
  /* Reaction first, then she talks through the explanation, then she rests on the verdict. */
  const mood: Mood = reacting
    ? (right ? 'ok' : 'bad')
    : !typed ? 'talk' : checked ? (right ? 'ok' : 'bad') : 'idle';

  return (
    <div class="quiz quiz-run">
      <Scene
        mood={mood}
        hud={
          <>
            {hearts('lives')}
            <span class="counter">{idx + 1} / {pool.length}</span>
            {practice
              ? <span class="clock practice">РОЗБІР</span>
              : <span class={`clock ${low ? 'low' : ''}`} role="timer">{formatClock(secondsLeft)}</span>}
          </>
        }
      />
      <Dialogue
        speaker={DOCTOR}
        badge={checked ? (right ? 'ok' : 'bad') : undefined}
        onSkip={typed ? undefined : () => setSkipTick((t) => t + 1)}
      >
        {/* Two lines share one grid cell: the hidden one holds the box open at the height
            of the longer text, so the answer never shoves the options down the page. */}
        <div class="line-stack">
          <p class="line"><Typewriter text={line} skipTick={skipTick} onDone={() => setTyped(true)} /></p>
          <p class="line sizer" aria-hidden="true">{other}</p>
        </div>
      </Dialogue>

      {/* One wrapper so the answers can move into their own column beside the scene on a
          screen that is wider than it is tall. */}
      <div class="answers">
        {q.type === 'multiple' && !checked && <p class="hint">Оберіть усі правильні відповіді.</p>}

        {/* Rendered from the start, hidden until the doctor stops talking: reserving the
            space means the button below them never moves. */}
        <ul class={`options ${typed || checked ? 'revealed' : ''}`}>
          {q.options.map((opt, i) => {
            const isSel = selected.includes(i);
            const cls = checked
              ? q.correct.includes(i) ? 'correct' : isSel ? 'wrong' : ''
              : isSel ? 'selected' : '';
            return (
              <li key={i} style={`--i:${i}`}>
                <button class={cls} onClick={() => toggle(i)} disabled={checked || !typed}>
                  <span class="key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {!checked
          ? <button class="primary" disabled={selected.length === 0} onClick={check}>Перевірити</button>
          : <button class="primary" onClick={advance}>{idx + 1 < pool.length ? 'Далі' : 'Результат'}</button>}
      </div>
    </div>
  );
}

interface DialogueProps {
  speaker: string;
  badge?: 'ok' | 'bad';
  onSkip?: () => void;
  children: ComponentChildren;
}

/**
 * The message box under the scene: a comic balloon with stepped corners and a tail pointing
 * back at the doctor. Same two-layer trick as the glossary tooltip — `clip-path` cuts the
 * border off along with everything else, so the outline is a second element behind the fill
 * rather than a `border`.
 */
function Dialogue({ speaker, badge, onSkip, children }: DialogueProps) {
  return (
    <div class={`dialogue ${badge ? `is-${badge}` : ''}`} onClick={onSkip}>
      <span class="talk-ink" aria-hidden="true" />
      <span class="talk-fill" aria-hidden="true" />
      <p class="speaker">
        <span class="name">{speaker}</span>
        {badge === 'ok' && <span class="verdict ok">✔ ПРАВИЛЬНО</span>}
        {badge === 'bad' && <span class="verdict bad">✕ НЕПРАВИЛЬНО</span>}
      </p>
      {children}
      {onSkip && (
        <button class="tw-skip" onClick={onSkip}>Показати повністю</button>
      )}
    </div>
  );
}
