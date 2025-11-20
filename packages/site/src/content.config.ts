import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'

// Define collections to prevent auto-generation warnings
export const collections = {
  packages: defineCollection({
    type: 'content',
    schema: z.object({})
  })
}
