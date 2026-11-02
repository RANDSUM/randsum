import type { APIRoute } from 'astro'
import { getLatestVersion } from '../../spec/versions'
import { NOTATION_ORIGIN, SITE_ORIGIN } from '../../spec/urls'

const SPEC = NOTATION_ORIGIN

export const GET: APIRoute = async () => {
  const latest = await getLatestVersion()
  const body = `# RANDSUM Dice Notation Specification

The RANDSUM Dice Notation Specification defines the syntax and semantics of RANDSUM dice notation — a human-readable, machine-parseable format for expressing dice rolls in tabletop RPGs.

## Latest Version

- **v${latest}**: ${SPEC}/v/${latest}/

## Full Spec for LLMs

The complete specification text is available at:
${SPEC}/llms-full.txt

## Links

- Specification: ${SPEC}/
- Conformance vectors: ${SPEC}/conformance/v${latest}.json
- Documentation: ${SITE_ORIGIN}
- GitHub: https://github.com/RANDSUM/notation-spec
- npm: https://www.npmjs.com/package/@randsum/notation-spec
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
