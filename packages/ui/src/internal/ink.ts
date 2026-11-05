// Which colour each modifier is drawn in, shared by a roll's steps and the
// notation input so the two colour a modifier alike. Kept apart from the
// steps so the input does not pull in the roll trace. Not a public entry.
import type { Token } from '@randsum/roller/tokenize'

/**
 * The ink a step is drawn in: its modifier's spec category. Dice stay plain;
 * only a step's label, its pip and the lane segments into the dice it changed
 * take the ink. `filter` and `subtract` are red, which means removal.
 */
export type StepInk = 'plain' | 'clamp' | 'substitute' | 'generate' | 'filter' | 'add' | 'subtract'

export const MODIFIER_INKS: Readonly<Record<string, StepInk>> = {
  cap: 'clamp',
  replace: 'substitute',
  reroll: 'substitute',
  unique: 'substitute',
  explode: 'generate',
  explodeSequence: 'generate',
  compound: 'generate',
  penetrate: 'generate',
  wildDie: 'generate',
  drop: 'filter',
  keep: 'filter',
  plus: 'add',
  minus: 'subtract'
}

/** The modifier each notation token applies, keyed by the token's docs key. */
const TOKEN_MODIFIERS: Readonly<Record<string, string>> = {
  'C{..}': 'cap',
  'V{..}': 'replace',
  'R{..}': 'reroll',
  '!': 'explode',
  '!!': 'compound',
  '!p': 'penetrate',
  '!s{..}': 'explodeSequence',
  '!i': 'explodeSequence',
  '!r': 'explodeSequence',
  W: 'wildDie',
  U: 'unique',
  L: 'drop',
  H: 'drop',
  'D{..}': 'drop',
  K: 'keep',
  '#{..}': 'count',
  'S{..}': 'count',
  'F{..}': 'count',
  'ms{..}': 'minus',
  '*': 'multiply',
  '+': 'plus',
  '-': 'minus',
  '//': 'integerDivide',
  '%': 'modulo',
  sort: 'sort',
  '**': 'multiplyTotal'
}

export function tokenModifier(token: Token): string | undefined {
  return token.key === 'K' && token.text.startsWith('KM') ? 'drop' : TOKEN_MODIFIERS[token.key]
}

/**
 * The ink a notation token is drawn in, the one its step's row takes, so the
 * input and the roll's steps colour the same modifier alike. Undefined for a
 * token no step row shows, such as the core roll or a count.
 */
export function tokenInk(token: Token): StepInk | undefined {
  return MODIFIER_INKS[tokenModifier(token) ?? '']
}
