import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notebook = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notebook' }),
  schema: z
    .object({
      number: z.number().int().positive(),
      title: z.string(),
      dek: z.string(),
      date: z.coerce.date().optional(),
      status: z.enum(['draft', 'published']),
      linkedin_url: z.url().optional(),
    })
    .refine((entry) => entry.status === 'draft' || entry.date !== undefined, {
      message: 'Published entries need a date.',
      path: ['date'],
    }),
});

export const collections = { notebook };
