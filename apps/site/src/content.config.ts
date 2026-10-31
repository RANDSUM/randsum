import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

// The notation spec is not a Starlight doc: /spec renders it through its own
// layout (src/spec/SpecLayout.astro, ADR-015). The ID drops the leading "v",
// so v0.9.0.md is served at /spec/v/0.9.0/.
const specs = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/specs',
    generateId: ({ entry }) => entry.replace(/\.md$/, '').replace(/^v/, '')
  }),
  // The document header (src/spec/components/SpecHead.astro) and the Markdown
  // copies (src/spec/document.ts) read these; the body starts at the Abstract.
  schema: z.object({
    title: z.string(),
    version: z.string(),
    revision: z.number().int().positive().optional(),
    status: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    editor: z.string()
  })
})

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  specs
}
