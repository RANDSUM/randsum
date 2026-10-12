import type { LexToken } from '../lexer/scan'
import type { PoolNode } from '../lexer/parse'
import type { PoolKind } from '../lexer/specs'
import { MODIFIER_SPECS } from '../lexer/specs'
import { TTRPG_STANDARD_DIE_SET } from '../constants'
import type { ModifierOptions, ParsedNotationOptions } from '../types'

const SPECS_BY_KEY = new Map(MODIFIER_SPECS.map(spec => [spec.key, spec]))

interface PoolHead {
  readonly sides: number
  readonly fateVariant?: 1 | 2
  readonly customFaces?: readonly string[]
}

/**
 * Read sides (and fate variant / custom faces) from a pool head whose shape the
 * lexer has already established. `marker` is the head after the quantity:
 * `d6`, `d%`, `dF.2`, `d{a,b}`, `DD6`, `g6`, `z6`.
 */
function readHead(kind: PoolKind, marker: string): PoolHead {
  switch (kind) {
    case 'percentile':
      return { sides: 100 }
    case 'fate':
      return marker.endsWith('2') ? { sides: 5, fateVariant: 2 } : { sides: 3, fateVariant: 1 }
    case 'custom': {
      const customFaces = marker
        .slice(2, -1)
        .split(',')
        .map(face => face.trim())
      return { sides: customFaces.length, customFaces }
    }
    case 'draw':
      return { sides: Number(marker.slice(2)) }
    default:
      return { sides: Number(marker.slice(1)) }
  }
}

/**
 * Build a pool's modifier options from its lexed tokens. Each token is parsed by
 * the schema whose pattern matched it. Tokens owned by the same schema are joined
 * first, so repeats combine the way the schema defines (`+2+3` is plus 5, `LH`
 * drops both ends). `ms{N}` is `-N`, and the `!i` / `!r` sugar resolves against
 * the pool's sides.
 */
function modifiersFromTokens(tokens: readonly LexToken[], sides: number): ModifierOptions {
  const textBySchema = new Map<(typeof MODIFIER_SPECS)[number]['schema'], string>()
  for (const token of tokens) {
    const spec = SPECS_BY_KEY.get(token.key)
    if (spec === undefined) continue
    const text = token.key === 'ms{..}' ? `-${token.text.slice(3, -1)}` : token.text
    textBySchema.set(spec.schema, (textBySchema.get(spec.schema) ?? '') + text)
  }
  const modifiers: ModifierOptions = {}
  for (const [schema, text] of textBySchema) Object.assign(modifiers, schema.parse(text))

  if (tokens.some(t => /^!i$/i.test(t.text))) {
    // Every standard die above this one (a non-standard die snaps up).
    modifiers.explodeSequence = TTRPG_STANDARD_DIE_SET.filter(s => s > sides)
  } else if (tokens.some(t => /^!r$/i.test(t.text))) {
    // Every standard die below this one, descending (a non-standard die snaps down).
    modifiers.explodeSequence = TTRPG_STANDARD_DIE_SET.filter(s => s < sides).reverse()
  }
  return modifiers
}

/**
 * Turn one parsed pool into options. Special dice keep their face semantics via
 * `dieType` / `fateVariant` / `customFaces`, and every pool carries its modifiers
 * (RDN: die-core *modifier), so `4dF+1`, `d%+5` and `3DD6L` roll like `4d6L`.
 */
export function poolToOptions(node: PoolNode): ParsedNotationOptions {
  const quantityDigits = /^\d*/.exec(node.body)?.[0] ?? ''
  const head = readHead(node.kind, node.body.slice(quantityDigits.length))
  const options: ParsedNotationOptions = {
    quantity: quantityDigits === '' ? 1 : Number(quantityDigits),
    arithmetic: node.sign === '-' ? 'subtract' : 'add',
    sides: head.sides
  }
  if (node.kind !== 'standard') options.dieType = node.kind
  if (head.fateVariant !== undefined) options.fateVariant = head.fateVariant
  if (head.customFaces !== undefined) options.customFaces = head.customFaces
  if (node.label !== undefined) options.label = node.label
  if (node.modifiers.length > 0) options.modifiers = modifiersFromTokens(node.modifiers, head.sides)
  return options
}
