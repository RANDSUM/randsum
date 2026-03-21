import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const specs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/specs' }),
  schema: z.object({
    title: z.string().optional(),
    version: z.string().optional(),
    status: z.string().optional(),
    date: z.string().optional()
  })
})

export const collections = { specs }
