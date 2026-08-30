import type { QuizLevel } from './quiz';

/**
 * The two tracks a reader belongs to.
 *
 * The level is a property of the person, not of the test, so it is chosen once on
 * `/tests/` and every page below it stays inside that choice. Kept here rather than
 * inlined so the label, the glyph and the description cannot drift between the choice
 * screen, the topic list and the run header.
 */
export interface LevelInfo {
  id: QuizLevel;
  /** Display name in the interface, already upper-case for the pixel headings. */
  label: string;
  /** Same name in the accusative, for sentences like «Тест: ... (лікар)». */
  word: string;
  /** Decorative glyph — must be wrapped in `<span class="g">`, Press Start 2P has neither. */
  glyph: string;
  blurb: string;
}

export const LEVELS: LevelInfo[] = [
  {
    id: 'nurse',
    label: 'МЕДСЕСТРА',
    word: 'медсестра',
    glyph: '♥',
    blurb: 'Розпізнати стан, діяти до приходу лікаря, доглядати й вчасно доповісти.',
  },
  {
    id: 'doctor',
    label: 'ЛІКАР',
    word: 'лікар',
    glyph: '✚',
    blurb: 'Обрати тактику, дозу й метод; розібрати клінічний випадок до рішення.',
  },
];

export const levelById = (id: string): LevelInfo | undefined => LEVELS.find((l) => l.id === id);
