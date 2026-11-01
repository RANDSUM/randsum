import type { Lexeme } from '../lexer/scan'
import type { PoolNode } from '../lexer/parse'
import type { PoolKind } from '../lexer/specs'
import { MODIFIER_SPECS } from '../lexer/specs'
import { TTRPG_STANDARD_DIE_SET } from '../constants'
import type { DropOptions, ModifierOptions, ParsedNotationOptions } from '../types'

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

/** Sum two optional counts, keeping `undefined` when neither side has one. */
function sumCounts(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0)
}

/**
 * Combine two drops. Keep-middle (`Km`) is a drop of both ends, so `5d6KmL`
 * drops the lowest twice and the highest once, in either lexeme order.
 */
function mergeDrop(a: DropOptions, b: DropOptions): DropOptions {
  const merged: DropOptions = { ...a, ...b }
  const highest = sumCounts(a.highest, b.highest)
  const lowest = sumCounts(a.lowest, b.lowest)
  if (highest !== undefined) merged.highest = highest
  if (lowest !== undefined) merged.lowest = lowest
  return merged
}

/**
 * Build a pool's modifier options from its lexed lexemes. Each lexeme is parsed by
 * the schema whose pattern matched it. Lexemes owned by the same schema are parsed
 * together, separated by a space, so repeats combine the way the schema defines
 * (`+2+3` is plus 5, `LH` drops both ends) and no two lexemes fuse into a different
 * one (`!` and `!` must not read as `!!`). `ms{N}` is `-N`, and the `!i` / `!r`
 * sugar resolves against the pool's sides.
 *
 * Keep is the one schema that emits another schema's key (`Km` is a `drop`), so
 * same-key results are merged rather than overwritten.
 */
function modifiersFromLexemes(lexemes: readonly Lexeme[], sides: number): ModifierOptions {
  const textsBySchema = new Map<(typeof MODIFIER_SPECS)[number]['schema'], string[]>()
  for (const lexeme of lexemes) {
    const spec = SPECS_BY_KEY.get(lexeme.key)
    if (spec === undefined) continue
    const text = lexeme.key === 'ms{..}' ? `-${lexeme.text.slice(3, -1)}` : lexeme.text
    textsBySchema.set(spec.schema, [...(textsBySchema.get(spec.schema) ?? []), text])
  }
  const modifiers: ModifierOptions = {}
  for (const [schema, texts] of textsBySchema) {
    const { drop, ...rest } = schema.parse(texts.join(' '))
    Object.assign(modifiers, rest)
    if (drop !== undefined) {
      modifiers.drop = modifiers.drop === undefined ? drop : mergeDrop(modifiers.drop, drop)
    }
  }

  if (lexemes.some(t => /^!i$/i.test(t.text))) {
    // Every standard die above this one (a non-standard die snaps up).
    modifiers.explodeSequence = TTRPG_STANDARD_DIE_SET.filter(s => s > sides)
  } else if (lexemes.some(t => /^!r$/i.test(t.text))) {
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
  if (node.modifiers.length > 0)
    options.modifiers = modifiersFromLexemes(node.modifiers, head.sides)
  return options
}
