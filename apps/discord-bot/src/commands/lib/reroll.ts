/**
 * Reroll state, encoded into a button's `custom_id`.
 *
 * A stateless Worker has nowhere to keep "what was rolled" between the original
 * message and a click on its button — no session, no collector, no storage
 * binding. Discord gives exactly one channel for it: `custom_id`, **1 to 100
 * characters**. That is the whole budget, and exceeding it does not truncate,
 * it makes Discord reject the entire message.
 *
 * So the encoding is the command name plus its options, and the decoder rebuilds
 * a `CommandContext` from them and calls the same `buildView` the slash command
 * would. No command needs a second code path for being rerolled.
 *
 * ## Why a reroll posts a NEW message
 *
 * The obvious implementation is `UPDATE_MESSAGE` (type 7), editing the roll in
 * place. It is wrong here. A Worker cannot tell whether the person clicking is
 * the person who rolled without spending ~19 of the 100 characters on their user
 * id — and with type 7, a bystander's click would silently overwrite someone
 * else's result. A new message per reroll sidesteps ownership entirely and
 * leaves the channel readable as a transcript, which is what a table wants from
 * a dice bot anyway.
 */
import type { CommandOptions } from './context.js'

/** Discord's hard limit. A longer id gets the whole message rejected. */
export const CUSTOM_ID_LIMIT = 100

/** Marks a component as a reroll, and namespaces it away from other controls. */
const PREFIX = 'r:'

export interface RerollTarget {
  readonly commandName: string
  readonly options: CommandOptions
  readonly hidden: boolean
}

/**
 * Encode a reroll id, or `undefined` when it will not fit.
 *
 * Returning `undefined` rather than a truncated id is deliberate: a truncated
 * id would decode into a *different roll*, which is worse than no button.
 * Callers pass the result straight to `rollContainer`, which omits the button
 * when it is absent.
 */
export function encodeReroll(
  commandName: string,
  options: Readonly<Record<string, string | number | boolean | null | undefined>>
): string | undefined {
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(options)) {
    // `false` is dropped alongside null and empty: every boolean option in this
    // bot defaults to false, so omitting it decodes identically and buys back
    // characters against the 100-character ceiling. A boolean whose default was
    // true would need encoding explicitly.
    if (value === null || value === undefined || value === '' || value === false) continue
    params.set(name, String(value))
  }

  const encoded = `${PREFIX}${commandName}:${params.toString()}`
  return encoded.length <= CUSTOM_ID_LIMIT ? encoded : undefined
}

/** True when a component id belongs to this module. */
export function isRerollId(customId: string): boolean {
  return customId.startsWith(PREFIX)
}

/**
 * Read options back out of an encoded id.
 *
 * Coerces on read rather than storing types, because the option's declared type
 * already says what it is: `getInteger` is only ever called for an option
 * Discord validated as an integer. An unparseable value yields `null`, which is
 * exactly what an absent option yields — so a corrupted id degrades to
 * "rerolled with defaults" rather than throwing at the user.
 */
export function optionsFromParams(params: URLSearchParams): CommandOptions {
  function getString(name: string, required: true): string
  function getString(name: string, required?: boolean): string | null
  function getString(name: string): string | null {
    return params.get(name)
  }

  function getInteger(name: string, required: true): number
  function getInteger(name: string, required?: boolean): number | null
  function getInteger(name: string): number | null {
    const raw = params.get(name)
    if (raw === null) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  function getBoolean(name: string, required: true): boolean
  function getBoolean(name: string, required?: boolean): boolean | null
  function getBoolean(name: string): boolean | null {
    const raw = params.get(name)
    if (raw === null) return null
    return raw === 'true'
  }

  return { getString, getInteger, getBoolean }
}

/**
 * Decode a reroll id, or `undefined` if it is not one this bot can serve.
 *
 * A malformed id is not an error to surface: the likeliest source is a button
 * on a months-old message from an older deployment, and the honest answer there
 * is the dispatcher's "unknown component" path rather than a stack trace.
 */
export function decodeReroll(customId: string): RerollTarget | undefined {
  if (!isRerollId(customId)) return undefined

  const rest = customId.slice(PREFIX.length)
  const separator = rest.indexOf(':')
  if (separator === -1) return undefined

  const commandName = rest.slice(0, separator)
  if (commandName.length === 0) return undefined

  const params = new URLSearchParams(rest.slice(separator + 1))

  return {
    commandName,
    options: optionsFromParams(params),
    hidden: params.get('hidden') === 'true'
  }
}
