/**
 * Turn a Discord interaction payload into a response payload.
 *
 * Pure: no network, no client, no side effects. That is what makes it testable
 * without a gateway and without a Worker runtime, and it is the half of the bot
 * worth protecting — the transport around it is replaceable, this is not.
 *
 * Deliberately does NOT defer. The gateway bot defers every command because
 * that is discord.js's idiom, but the actual work here is a dice roll: sub-
 * millisecond, no external calls. Discord's deadline is 3 seconds. Responding
 * directly is simpler (no follow-up webhook, no interaction token to keep
 * alive, no second failure mode) and visibly faster — the user never sees a
 * "thinking…" state for work that was already done.
 */
import { MessageFlags } from '../utils/builders.js'
import { optionsFromPayload } from '../commands/lib/context.js'
import { defaultErrorMessage } from '../commands/lib/index.js'
import type { Command } from '../types.js'

/** Discord's interaction type numbers. */
export const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  MessageComponent: 3,
  Autocomplete: 4,
  ModalSubmit: 5
} as const

/** Discord's interaction *response* type numbers. */
export const InteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4,
  AutocompleteResult: 8
} as const

/** The subset of an interaction payload this dispatcher reads. */
export interface InteractionPayload {
  readonly type: number
  readonly data?: {
    readonly name?: string
    readonly options?: readonly { readonly name: string; readonly value?: unknown }[]
  }
  readonly member?: {
    readonly user?: { readonly global_name?: string; readonly username?: string }
  }
  readonly user?: { readonly global_name?: string; readonly username?: string }
}

/**
 * Resolve the invoking user's display name.
 *
 * Discord puts the user under `member` in a guild and at the top level in a DM,
 * and `global_name` is null for accounts that never set a display name. Getting
 * this wrong renders "undefined" into a public message, so it falls back
 * explicitly rather than optionally.
 */
function resolveDisplayName(payload: InteractionPayload): string {
  const user = payload.member?.user ?? payload.user
  return user?.global_name ?? user?.username ?? 'Adventurer'
}

function errorResponse(message: string): unknown {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [{ title: 'Error', description: message, color: 0xff0000 }],
      flags: MessageFlags.Ephemeral
    }
  }
}

/**
 * Build the response for one interaction.
 *
 * Returns `undefined` for interaction types this dispatcher does not handle, so
 * the caller can decide the HTTP status rather than having one invented here.
 */
export function dispatchInteraction(
  payload: InteractionPayload,
  commands: ReadonlyMap<string, Command>
): unknown {
  if (payload.type === InteractionType.Ping) {
    return { type: InteractionResponseType.Pong }
  }

  if (payload.type !== InteractionType.ApplicationCommand) return undefined

  const name = payload.data?.name
  if (name === undefined) return errorResponse('Malformed interaction: no command name.')

  const command = commands.get(name)
  if (command === undefined) {
    // Mirrors the gateway bot's unknown-command behaviour: answer, do not time
    // out. A stale registry entry should say so, not hang.
    return errorResponse(`Unknown command: \`/${name}\`. It may have been removed.`)
  }

  if (command.buildEmbed === undefined) {
    return errorResponse(`\`/${name}\` is not available on this deployment yet.`)
  }

  const options = optionsFromPayload(payload.data?.options)

  try {
    const embed = command.buildEmbed({
      options,
      userDisplayName: resolveDisplayName(payload)
    })
    const hidden = options.getBoolean('hidden') ?? false

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [embed.toJSON()],
        ...(hidden ? { flags: MessageFlags.Ephemeral } : {})
      }
    }
  } catch (error) {
    return errorResponse(defaultErrorMessage(error))
  }
}
