export type QuizLevel = 'nurse' | 'doctor';

export interface Question {
  id: string;
  type: 'single' | 'multiple';
  text: string;
  vignette?: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export function isCorrect(q: Question, selected: number[]): boolean {
  if (selected.length !== q.correct.length) return false;
  const want = new Set(q.correct);
  return selected.every((i) => want.has(i));
}

export interface QuizResult { score: number; total: number; wrongIds: string[] }

export function computeResult(questions: Question[], answers: Map<string, number[]>): QuizResult {
  let score = 0;
  const wrongIds: string[] = [];
  for (const q of questions) {
    if (isCorrect(q, answers.get(q.id) ?? [])) score++;
    else wrongIds.push(q.id);
  }
  return { score, total: questions.length, wrongIds };
}
