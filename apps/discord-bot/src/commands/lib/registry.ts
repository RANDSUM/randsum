/**
 * The command list, published by the barrel and read by `/help`.
 *
 * `/help` is the one command whose content depends on the *other* commands, so
 * it needs the registry. It used to read `client.commands`, which works only on
 * the gateway — a Worker has no client.
 *
 * Importing the barrel directly would be circular, since the barrel contains
 * `/help`. Inverting it removes the cycle entirely: the barrel *pushes* the list
 * here once, and `/help` pulls it. Nothing imports the barrel except the
 * transports.
 *
 * Deliberately synchronous and eager. A lazy async variant works too, but it
 * races: the first `/help` before the import settles renders an empty list, and
 * that is precisely the kind of bug that only appears under a cold start.
 */
import type { Command } from '../../types.js'

const state: { commands: readonly Command[] } = { commands: [] }

export function setCommandRegistry(commands: readonly Command[]): void {
  state.commands = commands
}

export function commandRegistry(): readonly Command[] {
  return state.commands
}
