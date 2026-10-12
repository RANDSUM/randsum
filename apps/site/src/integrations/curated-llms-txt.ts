import type { AstroIntegration } from 'astro'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Put the curated repo-root llms.txt at the top of dist/llms.txt.
 *
 * starlight-page-actions writes dist/llms.txt in its own astro:build:done hook
 * (because `baseUrl` is set), and that overwrote any public/ copy: the live
 * file was a bare URL list with no /api/roll contract. This integration runs
 * after it (it is listed after `starlight()`, and Starlight splices plugin
 * integrations in directly behind itself), keeps the generated page list, and
 * prepends the curated text from the one hand-edited source, the repo root.
 */
export function mergeLlmsTxt(curated: string, generated: string | undefined): string {
  const head = curated.trimEnd()
  if (generated === undefined) return `${head}\n`
  // The generated file opens with its own `# <site title> Documentation` line;
  // the curated text already carries the document's single H1.
  const pages = generated.replace(/^# .*\n+/, '').trim()
  if (pages.length === 0) return `${head}\n`
  return `${head}\n\n## Documentation Pages\n\n${pages}\n`
}

export function curatedLlmsTxt(
  source: string = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../llms.txt'
  )
): AstroIntegration {
  return {
    name: 'curated-llms-txt',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const dest = path.join(fileURLToPath(dir), 'llms.txt')
        const generated = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf-8') : undefined
        fs.writeFileSync(dest, mergeLlmsTxt(fs.readFileSync(source, 'utf-8'), generated))
      }
    }
  }
}
