import { describe, expect, test } from 'bun:test'
import { NOTATION_DOCS } from '../../src/docs'
import { isDiceNotation } from '../../src/notation/isDiceNotation'

/**
 * Substitute template variables in a forms[].notation string with real values
 * so the result is executable dice notation.
 *
 * Substitution rules (applied in order):
 *  - `({..})` or `({...})` — optional exception list (Unique); drop the whole optional block
 *  - `(n)` or `(d)`        — literal optional count; substitute with 1
 *  - `{condition}`         — comparison condition placeholder; substitute with `{<3}`
 *  - `V{...}`              — Replace notation; needs n=y pairs; substitute V{...} → V{1=2}
 *  - `{N1,N2,...}`         — die-size sequence; substitute with `{4,6,8}`
 *  - `{n,b}`               — success/botch pair; substitute with `{7,1}`
 *  - `{n}`                 — single numeric threshold; substitute with `{7}`
 *  - `{N}`                 — single die size; substitute with `{6}`
 *  - `{a,b,c,...}`         — custom face list; substitute with `{1,2,3}`
 *  - `{..}` / `{...}`      — catch-all condition block; substitute with `{1}`
 *  - bare `N` (uppercase)  — die-size placeholder; substitute with `6`
 *  - bare `n` (lowercase)  — count placeholder; substitute with `1`
 *  - leading `x`           — quantity prefix; substitute with `4`
 */
function substituteTemplateVars(notation: string): string {
  return (
    notation
      // U({..}) / U({...}) — optional exception list; drop entire optional block
      .replace(/\(\{\.{2,3}\}\)/g, '')
      // (n) or (d) → 1
      .replace(/\([nd]\)/g, '1')
      // {condition} → {<3}
      .replace(/\{condition\}/g, '{<3}')
      // V{...} — Replace notation needs n=y pairs
      .replace(/V\{\.{2,3}\}/, 'V{1=2}')
      // {N1,N2,...} → {4,6,8}
      .replace(/\{N1,N2,\.\.\.\}/g, '{4,6,8}')
      // {n,b} (success, botch thresholds) → {7,1}
      .replace(/\{n,b\}/g, '{7,1}')
      // {n} single threshold → {7}
      .replace(/\{n\}/g, '{7}')
      // {N} single die size → {6}
      .replace(/\{N\}/g, '{6}')
      // {a,b,c,...} custom faces → {1,2,3}
      .replace(/\{a,b,c,\.\.\.\}/g, '{1,2,3}')
      // {..} or {...} catch-all condition → {1}
      .replace(/\{\.{2,3}\}/g, '{1}')
      // bare N at end of string → 6
      .replace(/N$/g, '6')
      // bare N before a non-brace character (e.g. xDDN → xDD6)
      .replace(/N(?=[^}]|$)/g, '6')
      // bare n → 1 (lowercase n as count placeholder)
      .replace(/n/g, '1')
      // leading x → 4 (quantity prefix, e.g. xDN → 4D6)
      .replace(/^x/, '4')
  )
}

/**
 * True if the substituted notation already contains a die core, so we should
 * NOT prepend a default die prefix.
 */
const hasCore = (s: string): boolean =>
  /\d*[dD]\d+/.test(s) ||
  /\d*[dD]%/.test(s) ||
  /\d*[dD][fF]/.test(s) ||
  /\d*[zZ]\d+/.test(s) ||
  /\d*[gG]\d+/.test(s) ||
  /\d*[dD]{2}\d+/.test(s) ||
  /\d*[dD]\{[^}]+\}/.test(s)

const DIE_PREFIX = '4d6'

describe('NotationDoc.forms[].notation — live parser conformance', () => {
  for (const [key, doc] of Object.entries(NOTATION_DOCS)) {
    describe(`${doc.title} (${key})`, () => {
      for (const form of doc.forms) {
        test(`form "${form.notation}" parses as valid dice notation after substitution`, () => {
          const substituted = substituteTemplateVars(form.notation)
          const candidate = hasCore(substituted) ? substituted : `${DIE_PREFIX}${substituted}`

          expect(isDiceNotation(candidate)).toBe(true)
        })
      }
    })
  }
})
