// Keys edit the notation string in place, so what a key builds is always what
// the input shows and what rolls. Every roller size takes a `keys` list; these
// are the default set and each modifier's canonical set.
import { addDie, adjustConstant, toggleModifier } from './internal/edits'
import { MODIFIER_TABLE } from './internal/modifiers'
import type { ModifierName } from './internal/modifiers'

export type { ModifierName } from './internal/modifiers'

export type KeyAction =
  | { readonly kind: 'die'; readonly sides: number }
  | { readonly kind: 'constant'; readonly delta: number }
  | { readonly kind: 'modifier'; readonly text: string }
  | { readonly kind: 'clear' }

export interface Key {
  /** What the key shows. */
  readonly label: string
  readonly action: KeyAction
  /** Longer text for the key's tooltip and accessible name. */
  readonly title?: string
}

const die = (sides: number, label = `d${sides}`): Key => ({
  label,
  action: { kind: 'die', sides },
  title: `Add a ${label}`
})

const mod = (text: string, label: string): Key => ({
  label,
  action: { kind: 'modifier', text },
  title: `${label} (${text})`
})

/** d4 through d20 and d%. */
export const DICE_KEYS: readonly Key[] = [
  die(4),
  die(6),
  die(8),
  die(10),
  die(12),
  die(20),
  die(100, 'd%')
]

export const CLEAR_KEY: Key = { label: 'Clear', action: { kind: 'clear' }, title: 'Clear the roll' }

export const CONSTANT_KEYS: readonly Key[] = [
  { label: '−1', action: { kind: 'constant', delta: -1 }, title: 'Subtract one' },
  { label: '+1', action: { kind: 'constant', delta: 1 }, title: 'Add one' }
]

/** The keys every roller shows unless it is given its own. */
export const DEFAULT_KEYS: readonly Key[] = [
  ...DICE_KEYS,
  CLEAR_KEY,
  ...CONSTANT_KEYS,
  mod('L', 'Drop low'),
  mod('H', 'Drop high'),
  mod('!', 'Explode'),
  mod('R{1}', 'Reroll 1s'),
  mod('U', 'Unique')
]

/**
 * The dice keys plus one modifier's canonical keys: the forms its docs page
 * teaches, written out so each one rolls as tapped.
 */
export function modifierKeys(name: ModifierName): readonly Key[] {
  const own = MODIFIER_TABLE[name].keys.map(k =>
    k.text === '+1' ? CONSTANT_KEYS : [mod(k.text, k.label)]
  )
  return [...DICE_KEYS, CLEAR_KEY, ...own.flat()]
}

/** Applies a key to a notation string and returns the new notation. */
export function applyKey(notation: string, key: Key): string {
  const { action } = key
  switch (action.kind) {
    case 'die':
      return addDie(notation, action.sides)
    case 'constant':
      return adjustConstant(notation, action.delta)
    case 'modifier':
      return toggleModifier(notation, action.text)
    case 'clear':
      return ''
  }
}
