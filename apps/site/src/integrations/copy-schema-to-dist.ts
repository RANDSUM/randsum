import type { AstroIntegration } from 'astro'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Astro integration that copies the games meta-schema
 * (packages/games/randsum.json — the single source of truth) into the build
 * output at schemas/v1/randsum.json, so production always serves the current
 * schema at its declared `$id` (https://randsum.dev/schemas/v1/randsum.json)
 * regardless of whether the checked-in public/ copy has drifted.
 *
 * The checked-in public/schemas/v1/randsum.json copy (served by `astro dev`)
 * is kept honest by the sync test in __tests__/schema-sync.test.ts.
 */
export function copySchemaToDist(): AstroIntegration {
  return {
    name: 'copy-schema-to-dist',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const integrationDir = path.dirname(fileURLToPath(import.meta.url))
        const source = path.resolve(integrationDir, '../../../../packages/games/randsum.json')

        if (!fs.existsSync(source)) {
          console.warn(`[copy-schema-to-dist] source not found: ${source}`)
          return
        }

        const destDir = path.join(fileURLToPath(dir), 'schemas', 'v1')
        fs.mkdirSync(destDir, { recursive: true })
        fs.copyFileSync(source, path.join(destDir, 'randsum.json'))
        console.warn('[copy-schema-to-dist] Copied randsum.json to dist/schemas/v1/')
      }
    }
  }
}
