import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'

export const collections = {
  packages: defineCollection({
    type: 'content',
    schema: z.object({})
  })
}
