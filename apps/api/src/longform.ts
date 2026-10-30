import { notationToOptions, optionsToNotation } from '@randsum/roller'
import type { RollOptions } from '@randsum/roller'

/**
 * The long form of a roll: `roll()`'s options object (`sides`, `quantity`,
 * `arithmetic`, `modifiers`) instead of a notation string. It is the same roll
 * spelled out, so `/v1` turns it into short-form notation and takes the one
 * path from there.
 *
 * In a query string the object is flattened into keys, either dotted or
 * bracketed: `modifiers.drop.lowest=1` or `modifiers[drop][lowest]=1`. Each
 * value is read as JSON when it parses (`6`, `true`, `[1,2]`), else as text.
 */
const TOP_LEVEL = new Set(['sides', 'quantity', 'arithmetic', 'modifiers'])

/** Whether the input spells a roll in long form. */
export function isLongform(input: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(input).some(key => TOP_LEVEL.has(pathOf(key)[0] ?? ''))
}

/** `modifiers[drop][lowest]` and `modifiers.drop.lowest` both become one path. */
function pathOf(key: string): readonly string[] {
  return key
    .replace(/\[([^\]]*)\]/g, '.$1')
    .split('.')
    .filter(segment => segment.length > 0)
}

function parseValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Only `sides` is checked here. The roller checks everything else when it
 * builds the notation, and its error is the one worth returning.
 */
function hasSides(value: unknown): value is RollOptions {
  return isRecord(value) && (typeof value['sides'] === 'number' || Array.isArray(value['sides']))
}

/** Sets `value` at `path` inside `target`, returning a new object. */
function setPath(
  target: Readonly<Record<string, unknown>>,
  path: readonly string[],
  value: unknown
): Readonly<Record<string, unknown>> {
  const [head, ...rest] = path
  if (head === undefined) return target
  if (rest.length === 0) return { ...target, [head]: value }
  const child = target[head]
  return { ...target, [head]: setPath(isRecord(child) ? child : {}, rest, value) }
}

/** Rebuilds the options object from flat (query) or nested (JSON) input. */
function optionsOf(input: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  return Object.entries(input)
    .map(([key, value]) => [pathOf(key), parseValue(value)] as const)
    .filter(([path]) => TOP_LEVEL.has(path[0] ?? ''))
    .reduce<Readonly<Record<string, unknown>>>(
      (options, [path, value]) => setPath(options, path, value),
      {}
    )
}

/**
 * Converts long-form input to short-form notation, or explains why it cannot.
 * A modifier the roller does not know would otherwise vanish from the
 * notation silently, so every modifier asked for must survive the round trip.
 */
export function longformToNotation(
  input: Readonly<Record<string, unknown>>
): { readonly notation: string } | { readonly error: string } {
  const options = optionsOf(input)
  if (options['sides'] === undefined) return { error: 'Long form needs "sides".' }
  if (!hasSides(options)) return { error: '"sides" must be a number or an array of faces.' }
  const asked = isRecord(options['modifiers']) ? Object.keys(options['modifiers']) : []

  try {
    const notation = optionsToNotation(options)
    const kept = new Set(
      notationToOptions(notation).flatMap(parsed => Object.keys(parsed.modifiers ?? {}))
    )
    const lost = asked.find(name => !kept.has(name))
    if (lost !== undefined) return { error: `Unknown or unusable modifier "${lost}".` }
    return { notation }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: `Invalid long-form roll: ${message}` }
  }
}
