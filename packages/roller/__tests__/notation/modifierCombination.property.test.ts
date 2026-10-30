import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'

import { scan } from '../../src/notation/lexer/scan'
import { MODIFIER_SPECS } from '../../src/notation/lexer/specs'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import type { ModifierOptions } from '../../src/notation/types'

// One sample per modifier token form. Every pair of these (a token repeated, or
// two tokens from one schema or from two schemas) must keep each token's
// contribution: the bug class where `4d6!L!` lost its explode, and `5d6KmL`
// lost its keep-middle, because one token's result overwrote another's.
const SAMPLES: readonly string[] = [
  'C{>5}',
  'V{1=2}',
  'R{1}',
  '!',
  '!{>5}',
  '!!',
  '!p',
  '!s{4,6}',
  '!i',
  'W',
  'U',
  'L',
  'H',
  'D{1}',
  'K',
  'kl',
  'Km',
  '#{>3}',
  'S{5}',
  'F{2}',
  'ms{3}',
  '*2',
  '+2',
  '-1',
  '//2',
  '%3',
  'sa',
  '**2'
]

const SCHEMA_BY_KEY = new Map(MODIFIER_SPECS.map(spec => [spec.key, spec.schema]))

function modifiersOf(notation: string): ModifierOptions {
  return notationToOptions(notation)[0]?.modifiers ?? {}
}

/** The modifier tokens `4d6<suffix>` lexes to, or undefined when it is not valid notation. */
function modifierTokens(suffix: string): readonly { text: string; key: string }[] | undefined {
  const notation = `4d6${suffix}`
  if (!isDiceNotation(notation)) return undefined
  return scan(notation).filter(t => t.role === 'modifier')
}

/** Samples whose concatenation lexes back to exactly those tokens. */
function lexesApart(samples: readonly string[]): boolean {
  const tokens = modifierTokens(samples.join(''))
  return tokens?.map(t => t.text).join('|') === samples.join('|')
}

function schemaOf(sample: string): unknown {
  return SCHEMA_BY_KEY.get(modifierTokens(sample)?.[0]?.key ?? '')
}

const PAIRS = SAMPLES.flatMap(a => SAMPLES.map(b => [a, b] as const)).filter(pair =>
  lexesApart(pair)
)

// Two tokens of one schema with another token between them: `!` and `!` fuse
// into `!!` when adjacent, so the explode case only shows up separated (`4d6!L!`).
const SEPARATED = SAMPLES.flatMap(a =>
  ['L', 'U', 'V{1=2}'].map(separator => [a, separator, a] as const)
).filter(triple => lexesApart(triple))

describe('modifier token combinations', () => {
  test('the corpus covers repeats of one token and pairs across schemas', () => {
    expect(PAIRS.some(([a, b]) => a === b)).toBe(true)
    expect(PAIRS).toContainEqual(['Km', 'L'])
    expect(PAIRS.length).toBeGreaterThan(400)
    expect(SEPARATED).toContainEqual(['!', 'L', '!'])
    expect(SEPARATED).toContainEqual(['!', 'V{1=2}', '!'])
  })

  test.each(PAIRS)('4d6%s%s keeps every key each token sets alone', (a, b) => {
    const combined = Object.keys(modifiersOf(`4d6${a}${b}`))
    for (const key of Object.keys({ ...modifiersOf(`4d6${a}`), ...modifiersOf(`4d6${b}`) })) {
      expect(combined).toContain(key)
    }
  })

  test.each(SEPARATED)('4d6%s%s%s keeps every key its tokens set alone', (a, separator, b) => {
    const combined = Object.keys(modifiersOf(`4d6${a}${separator}${b}`))
    for (const key of Object.keys({
      ...modifiersOf(`4d6${a}`),
      ...modifiersOf(`4d6${separator}`),
      ...modifiersOf(`4d6${b}`)
    })) {
      expect(combined).toContain(key)
    }
  })

  test.each(PAIRS.filter(([a, b]) => schemaOf(a) !== schemaOf(b)))(
    'tokens of different schemas give the same options in either order: %s %s',
    (a, b) => {
      if (!lexesApart([b, a])) return
      expect(modifiersOf(`4d6${a}${b}`)).toEqual(modifiersOf(`4d6${b}${a}`))
    }
  )

  test('a sequence of tokens from distinct schemas is order-independent', () => {
    const distinct = SAMPLES.filter(
      (sample, i) => SAMPLES.findIndex(other => schemaOf(other) === schemaOf(sample)) === i
    )
    fc.assert(
      fc.property(
        fc.shuffledSubarray([...distinct], { minLength: 2, maxLength: 5 }),
        fc.func(fc.integer()),
        (picked, rank) => {
          const shuffled = [...picked].sort((x, y) => rank(x) - rank(y))
          fc.pre(lexesApart(picked) && lexesApart(shuffled))
          expect(modifiersOf(`4d6${picked.join('')}`)).toEqual(
            modifiersOf(`4d6${shuffled.join('')}`)
          )
        }
      )
    )
  })
})
