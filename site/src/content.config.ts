import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const lectures = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lectures' }),
  schema: z.object({
    title: z.string(),
    module: z.union([z.literal(1), z.literal(2)]),
    order: z.number().int().positive(),
    description: z.string(),
    updatedAt: z.coerce.date(),
    sources: z.array(z.string()).default([]),
    videos: z.array(z.string().url()).default([]),
    status: z.enum(['draft', 'reviewed', 'published']).default('draft'),
  }),
});

const question = z.object({
  id: z.string(),
  type: z.enum(['single', 'multiple']),
  kind: z.enum(['case', 'recall']).default('recall'),
  source: z.string().optional(),
  text: z.string(),
  vignette: z.string().optional(),
  options: z.array(z.string()).min(4).max(5),
  correct: z.array(z.number().int().nonnegative()).min(1),
  explanation: z.string(),
});

const quizzes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/quizzes' }),
  schema: z.object({
    topic: z.string().regex(/^\d{2}$/),
    level: z.enum(['nurse', 'doctor']),
    questions: z.array(question).min(1),
  }),
});

const glossary = defineCollection({
  loader: file('./src/content/glossary/terms.json'),
  schema: z.object({
    id: z.string(),
    term: z.string(),
    definition: z.string(),
    synonyms: z.array(z.string()).default([]),
  }),
});

export const collections = { lectures, quizzes, glossary };
