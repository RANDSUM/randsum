export type { CommandContext } from './context.js'
export type { ViewFact } from './view.js'
export {
  TEXT_DISPLAY_LIMIT,
  clampContent,
  measureContainer,
  renderTrace,
  rollContainer
} from './view.js'
export { decodeReroll, encodeReroll, isRerollId } from './reroll.js'
export { specRange, withSpecChoices, withSpecRange } from './specInputs.js'

/** Default message for the shared catch block: the error text, or a generic fallback. */
export function defaultErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

/** Formats a modifier with an explicit sign: positive values gain a leading `+`. */
export function formatSignedModifier(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

/** Extracts the first roll record's pre-modifier dice, or an empty list. */
export function getInitialRolls(result: {
  readonly rolls: readonly { readonly initialRolls: readonly number[] }[]
}): readonly number[] {
  return result.rolls[0]?.initialRolls ?? []
}

/**
 * Extracts the first roll record's post-modifier dice — the ones the engine
 * actually kept — or an empty list.
 *
 * The counterpart to `getInitialRolls`, and the one a renderer should trust
 * when it wants to say which die decided the roll. Recomputing that from the
 * initial dice means re-deriving the modifier the engine already applied, and
 * getting it wrong the moment a game keeps the lowest rather than the highest.
 */
export function getKeptRolls(result: {
  readonly rolls: readonly { readonly rolls: readonly number[] }[]
}): readonly number[] {
  return result.rolls[0]?.rolls ?? []
}

/**
 * Renders each initial die with the kept die(s) bold and the dropped die(s)
 * struck through.
 *
 * Kept values are matched against the roller's post-modifier dice and consumed
 * one-by-one, so a tie — where two dice show the same face but only one was
 * kept — still renders exactly one bold and one struck die rather than bolding
 * both.
 */
export function markKeptRolls(
  initialRolls: readonly number[],
  keptRolls: readonly number[]
): string {
  const remaining = [...keptRolls]
  return initialRolls
    .map(value => {
      const index = remaining.indexOf(value)
      if (index !== -1) {
        remaining.splice(index, 1)
        return `**${value}**`
      }
      return `~~${value}~~`
    })
    .join(', ')
}
