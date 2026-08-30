/**
 * Layout budget for quiz content.
 *
 * The run screen has to fit a laptop without scrolling, which is a height problem long
 * before it is a width one (see "Quiz layout" in CLAUDE.md). These limits are the measured
 * maxima of the content the layout was verified against, so anything written later stays
 * inside a box that is known to work: a vignette that runs to 500 characters would push
 * the answers off a 1024x600 screen and nobody would notice until a reader complained.
 *
 * Run with `npm run lint:quizzes`. The zod schema in content.config.ts checks structure;
 * this checks the things a schema cannot see, including whether an answer is reachable.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'quizzes');

const LIMITS = { ask: 320, explanation: 330, option: 120, options: 4 };

/**
 * The correct answer must not stand out by length.
 *
 * An audit of the first 306 single-answer questions found the right option was the
 * longest one 78 % of the time — a reader could pass by counting characters. GIVEAWAY is
 * the margin at which that is blatant enough to fail a build; TELL is the smaller margin
 * used to report how often a bank still leans that way, so a weeding pass has a number to
 * work against. The fix is never to truncate the right answer into something untrue: it is
 * to give the distractors the same kind of reasoning clause the correct one carries.
 */
const GIVEAWAY = 25;
const TELL = 15;
const TELL_RATE = 0.4;

const problems = [];
const tells = new Map();
const seenByBank = new Map();

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const quiz = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  const bankKey = `${quiz.topic}:${quiz.level}`;
  const seen = seenByBank.get(bankKey) ?? new Map();

  for (const q of quiz.questions) {
    const at = `${file} ${q.id}`;
    const ask = ((q.vignette ? `${q.vignette} ` : '') + q.text).length;

    if (ask > LIMITS.ask) problems.push(`${at}: question is ${ask} characters, limit ${LIMITS.ask}`);
    if (q.explanation.length > LIMITS.explanation)
      problems.push(`${at}: explanation is ${q.explanation.length} characters, limit ${LIMITS.explanation}`);
    if (q.options.length !== LIMITS.options)
      problems.push(`${at}: ${q.options.length} options, expected ${LIMITS.options}`);
    q.options.forEach((o, i) => {
      if (o.length > LIMITS.option) problems.push(`${at}: option ${i} is ${o.length} characters, limit ${LIMITS.option}`);
    });

    /* Structural traps the schema cannot catch: an unreachable answer key, a "single"
       question with two right answers, a duplicate id inside one bank. */
    if (q.correct.some((i) => i >= q.options.length)) problems.push(`${at}: correct index points past the options`);
    if (q.type === 'single' && q.correct.length !== 1) problems.push(`${at}: type "single" with ${q.correct.length} correct answers`);
    if (new Set(q.options).size !== q.options.length) problems.push(`${at}: two options are identical`);
    if (seen.has(q.id)) problems.push(`${at}: id already used in ${seen.get(q.id)} of the same bank`);
    seen.set(q.id, file);

    if (q.type === 'single') {
      const lengths = q.options.map((o) => o.length);
      const answer = lengths[q.correct[0]];
      const longestDistractor = Math.max(...lengths.filter((_, i) => i !== q.correct[0]));
      const stat = tells.get(bankKey) ?? { n: 0, telling: 0 };
      stat.n++;
      if (answer > longestDistractor + TELL) stat.telling++;
      tells.set(bankKey, stat);
      if (answer > longestDistractor + GIVEAWAY)
        problems.push(
          `${at}: the correct option is ${answer - longestDistractor} characters longer than every distractor — ` +
            `length gives the answer away. Give the distractors a reason, do not truncate the right one.`,
        );
    }
  }
  seenByBank.set(bankKey, seen);
}

for (const [bank, seen] of seenByBank) {
  if (seen.size < 20) console.warn(`note: bank ${bank} holds ${seen.size} questions`);
}

for (const [bank, { n, telling }] of tells) {
  if (n && telling / n > TELL_RATE)
    console.warn(
      `note: in bank ${bank} the correct answer is the clearly longest option in ${telling}/${n} questions ` +
        `(${Math.round((telling / n) * 100)} %) — due a rebalancing pass`,
    );
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`Quiz content within budget: ${[...seenByBank].map(([b, s]) => `${b}=${s.size}`).join(' ')}`);
