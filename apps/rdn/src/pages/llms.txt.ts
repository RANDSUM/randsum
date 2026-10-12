import type { APIRoute } from 'astro'
import { getLatestVersion } from '../utils/versions'

const SITE = 'https://notation.randsum.dev'

export const GET: APIRoute = async () => {
  const latest = await getLatestVersion()
  const body = `# RANDSUM Dice Notation Specification

The RANDSUM Dice Notation Specification defines the syntax and semantics of RANDSUM dice notation — a human-readable, machine-parseable format for expressing dice rolls in tabletop RPGs.

## Latest Version

- **v${latest}**: ${SITE}/v/${latest}

## Full Spec for LLMs

The complete specification text is available at:
${SITE}/llms-full.txt

## Links

- Site: ${SITE}
- GitHub: https://github.com/RANDSUM/randsum
- npm: https://www.npmjs.com/package/@randsum/roller
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
