import type { SlashCommandIntegerOption, SlashCommandStringOption } from '../../utils/builders.js'

/**
 * Applies spec input metadata (the `inputs` each `@randsum/games` subpath
 * exports) to Discord option builders, so the bounds and choices Discord offers
 * come from the `.randsum.json` spec rather than a hand-kept copy that drifts.
 *
 * Option names, descriptions and `required` stay with the command: those are
 * Discord copy and UX decisions (`/blades dice` is required, the spec defaults
 * it), not game rules.
 */

interface IntegerInput {
  readonly minimum: number
  readonly maximum: number
}

interface EnumInput {
  readonly enum: readonly string[]
}

/** Sets an integer option's min and max from the spec input. */
export function withSpecRange(
  option: SlashCommandIntegerOption,
  input: IntegerInput
): SlashCommandIntegerOption {
  return option.setMinValue(input.minimum).setMaxValue(input.maximum)
}

/** Renders a spec input's range for an option description, e.g. `-3 to 5`. */
export function specRange(input: IntegerInput): string {
  return `${String(input.minimum)} to ${String(input.maximum)}`
}

/**
 * Adds one choice per spec enum value. `labels` renames a value for display
 * (PbtA shows `Advantage` as "Best 2 of 3"); the value sent stays the spec's.
 */
export function withSpecChoices(
  option: SlashCommandStringOption,
  input: EnumInput,
  labels: Readonly<Record<string, string>> = {}
): SlashCommandStringOption {
  return option.addChoices(...input.enum.map(value => ({ name: labels[value] ?? value, value })))
}
