import type { DiceNotation, RollRecord } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation, validateNotation } from '@randsum/roller/validate'

export type NotationCheck =
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid'; readonly message: string; readonly position?: number }
  | { readonly kind: 'valid'; readonly description: string }

export interface RollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
  readonly description: string
}

/** "Roll 4 6-sided dice, Drop lowest, Add 2": the roller's own lines, one clause each. */
export function describe(lines: readonly (readonly string[])[]): string {
  return lines.map(pool => pool.join(', ')).join(' + ')
}

// A trial roll can fail by chance (a unique pool that runs out of values), so
// notation is invalid only when every try fails the same way.
const TRIALS = 3

/**
 * `validateNotation` rejects notation that parses but cannot roll (`1d20L`
 * drops the only die) and says why. A trial roll remains as a backstop for
 * what only rolling shows, so the field can say why before Roll would fail.
 */
export function checkNotation(notation: string): NotationCheck {
  if (notation.trim().length === 0) return { kind: 'empty' }
  const validated = validateNotation(notation)
  if (!validated.valid) {
    const { position, code } = validated.error
    // It parsed but cannot roll (2d6L3): say why, without the error class preamble.
    if (code !== undefined && code !== 'INVALID_NOTATION') {
      return { kind: 'invalid', message: withoutPreamble(validated.error.message) }
    }
    if (position === undefined) return { kind: 'invalid', message: 'That isn’t dice notation yet.' }
    const char = notation.charAt(position)
    const message =
      char.length === 0
        ? 'The roll ends too soon.'
        : `Can’t read “${char}” at character ${position + 1}.`
    return { kind: 'invalid', message, position }
  }
  const failure = trialRoll(validated.argument)
  if (failure !== null) return { kind: 'invalid', message: failure }
  return { kind: 'valid', description: describe(validated.description) }
}

/** Drops the error class's 'Modifier error for "drop": ' preamble. */
function withoutPreamble(message: string): string {
  return message.replace(/^[^:]*: /, '')
}

function trialRoll(notation: DiceNotation): string | null {
  const messages: string[] = []
  for (const _ of Array.from({ length: TRIALS })) {
    try {
      roll(notation)
      return null
    } catch (error) {
      messages.push(withoutPreamble(error instanceof Error ? error.message : String(error)))
    }
  }
  return messages[0] ?? null
}

/** Rolls notation that has already passed checkNotation. */
export function rollNotation(notation: string): RollResult | null {
  if (!isDiceNotation(notation)) return null
  try {
    const rolled = roll(notation)
    if (rolled.rolls.length === 0) return null
    return {
      total: rolled.total,
      records: rolled.rolls,
      notation,
      description: describe(rolled.rolls.map(r => r.description))
    }
  } catch {
    return null
  }
}
