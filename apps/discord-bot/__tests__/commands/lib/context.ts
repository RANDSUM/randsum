/**
 * Test-only helper: build a `CommandContext` the way the Worker does.
 *
 * The command tests used to drive a hand-rolled mock interaction — `deferReply`,
 * `editReply`, and an `options` object of `mock()` getters — and read the embed
 * back out of `editReply.mock.calls`. That shape existed to satisfy the gateway
 * `execute`, which is gone.
 *
 * Deliberately routes through the REAL `optionsFromPayload` rather than stubbing
 * the accessors. A stub would answer whatever the test wanted; this answers what
 * Discord's own payload shape produces, so an option a command reads with the
 * wrong name or the wrong type fails here exactly as it would in production.
 */
import { optionsFromPayload } from '../../../src/commands/lib/context.js'
import type { CommandContext } from '../../../src/commands/lib/context.js'

export type RawOption = { readonly name: string; readonly value?: unknown }

export function makeContext(
  options: readonly RawOption[] = [],
  userDisplayName = 'Tester'
): CommandContext {
  return { options: optionsFromPayload(options), userDisplayName }
}
