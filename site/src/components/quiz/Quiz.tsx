import { useState } from 'preact/hooks';
import { computeResult, isCorrect, type Question, type QuizLevel } from '../../lib/quiz';
import { saveBest } from '../../lib/storage';

interface Props { topic: string; level: QuizLevel; questions: Question[] }

export default function Quiz({ topic, level, questions }: Props) {
  const [pool, setPool] = useState<Question[]>(questions);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
  const [finished, setFinished] = useState(false);

  const q = pool[idx];

  const toggle = (i: number) => {
    if (checked) return;
    if (q.type === 'single') setSelected([i]);
    else setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };

  const check = () => {
    setChecked(true);
    setAnswers((m) => new Map(m).set(q.id, selected));
  };

  const next = () => {
    if (idx + 1 < pool.length) {
      setIdx(idx + 1);
      setSelected([]);
      setChecked(false);
    } else {
      const result = computeResult(pool, answers);
      if (pool.length === questions.length) {
        saveBest(topic, level, { score: result.score, total: result.total, date: new Date().toISOString().slice(0, 10) });
      }
      setFinished(true);
    }
  };

  const retryWrong = () => {
    const { wrongIds } = computeResult(pool, answers);
    setPool(questions.filter((x) => wrongIds.includes(x.id)));
    setIdx(0);
    setSelected([]);
    setChecked(false);
    setAnswers(new Map());
    setFinished(false);
  };

  if (finished) {
    const r = computeResult(pool, answers);
    return (
      <div class="quiz-result">
        <p class="score">{r.score} / {r.total}</p>
        <p>{r.score === r.total ? 'Бездоганно! 🎉' : 'Помилки — це навчання.'}</p>
        {r.wrongIds.length > 0 && <button onClick={retryWrong}>Повторити помилкові ({r.wrongIds.length})</button>}
        <a href="/tests/">До списку тестів</a>
      </div>
    );
  }

  return (
    <div class="quiz">
      <div class="progress"><span style={{ width: `${(idx / pool.length) * 100}%` }} /></div>
      <p class="counter">Питання {idx + 1} з {pool.length}</p>
      {q.vignette && <p class="vignette">{q.vignette}</p>}
      <h2>{q.text}</h2>
      {q.type === 'multiple' && <p class="hint">Оберіть усі правильні відповіді.</p>}
      <ul class="options">
        {q.options.map((opt, i) => {
          const isSel = selected.includes(i);
          const cls = checked
            ? q.correct.includes(i) ? 'correct' : isSel ? 'wrong' : ''
            : isSel ? 'selected' : '';
          return (
            <li key={i}>
              <button class={cls} onClick={() => toggle(i)} disabled={checked}>{opt}</button>
            </li>
          );
        })}
      </ul>
      {checked && (
        <div class={`explain ${isCorrect(q, selected) ? 'ok' : 'bad'}`}>
          <strong>{isCorrect(q, selected) ? '✅ Правильно.' : '❌ Неправильно.'}</strong> {q.explanation}
        </div>
      )}
      {!checked
        ? <button class="primary" disabled={selected.length === 0} onClick={check}>Перевірити</button>
        : <button class="primary" onClick={next}>{idx + 1 < pool.length ? 'Далі' : 'Результат'}</button>}
    </div>
  );
}
