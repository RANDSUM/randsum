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
import { buildNotationView, NOTATION_SELECT_ID } from '../commands/lib/notationView.js'
import type { Command, RollView } from '../types.js'

/**
 * Suppress every mention in every response this bot sends.
 *
 * Components V2 `TextDisplay` content is mention-parsed exactly like message
 * content, and with `allowed_mentions` absent Discord's default parses
 * everything. `/roll` puts the user's annotation verbatim into a public line —
 * `/roll 1d20[@everyone]` renders `-# 1d20[@everyone] · rolled with …` — so any
 * user in any server could make the bot ping a role.
 *
 * There is no response in this bot where a real mention is wanted, so it is set
 * once here rather than per call site, where the next new response type would
 * silently miss it.
 */
const NO_MENTIONS = { parse: [] as const }

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
  DeferredChannelMessageWithSource: 5,
  /** Acknowledges a component without showing a loading state. */
  DeferredMessageUpdate: 6,
  /** Replaces the message the component is attached to, in place. */
  UpdateMessage: 7,
  AutocompleteResult: 8,
  Modal: 9
} as const

/** The subset of an interaction payload this dispatcher reads. */
export interface InteractionPayload {
  readonly type: number
  readonly data?: {
    readonly name?: string
    readonly options?: readonly { readonly name: string; readonly value?: unknown }[]
    /** Present on component interactions — identifies which control was used. */
    readonly custom_id?: string
    /** A select menu's chosen options. This is where its state arrives. */
    readonly values?: readonly string[]
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

/**
 * Wrap a rendered view in a Components V2 interaction response.
 *
 * `IsComponentsV2` is what switches Discord from the embed layout to the
 * component tree; without it the `components` array is read as legacy action
 * rows and a container is rejected. It composes with `Ephemeral` as a normal
 * bit flag — 32768 | 64 — so the `hidden` option keeps working unchanged.
 */
export function viewResponse(view: RollView, hidden: boolean): unknown {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.IsComponentsV2 | (hidden ? MessageFlags.Ephemeral : 0),
      allowed_mentions: NO_MENTIONS,
      components: view.map(container => container.toJSON())
    }
  }
}

function errorResponse(message: string): unknown {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [{ title: 'Error', description: message, color: 0xff0000 }],
      allowed_mentions: NO_MENTIONS,
      flags: MessageFlags.Ephemeral
    }
  }
}

/**
 * Handle a message-component interaction.
 *
 * Where a gateway bot keeps a collector alive on an open socket, each click
 * here arrives as an independent POST with no memory of the original command.
 * That is fine for `/notation` because it uses a select menu, and Discord sends
 * the chosen option back in `data.values` — the selection carries its own state.
 * A *button* carrying a page index would genuinely need that index encoded into
 * its `custom_id`, since nothing else would survive the round trip.
 *
 * Responds with UpdateMessage (7), which edits the existing message in place,
 * matching the gateway path's `.update()` rather than posting a new reply.
 */
function dispatchComponent(payload: InteractionPayload): unknown {
  if (payload.data?.custom_id !== NOTATION_SELECT_ID) return undefined

  const view = buildNotationView(payload.data.values?.[0])
  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      allowed_mentions: NO_MENTIONS,
      embeds: [view.embed.toJSON()],
      components: [view.row.toJSON()]
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

  if (payload.type === InteractionType.MessageComponent) {
    return dispatchComponent(payload)
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

  if (command.buildView === undefined && command.buildEmbed === undefined) {
    return errorResponse(`\`/${name}\` is not available on this deployment yet.`)
  }

  const options = optionsFromPayload(payload.data?.options)

  try {
    const context = { options, userDisplayName: resolveDisplayName(payload) }
    const hidden = options.getBoolean('hidden') ?? false

    // Components V2 first. A command that defines `buildView` never touches the
    // embed path, and the two are mutually exclusive per message — the V2 flag
    // forbids `embeds` outright, so there is no blending them.
    if (command.buildView !== undefined) {
      return viewResponse(command.buildView(context), hidden)
    }

    // Legacy embed path. Deleted once every command defines `buildView`.
    if (command.buildEmbed === undefined) {
      return errorResponse(`\`/${name}\` is not available on this deployment yet.`)
    }

    const embed = command.buildEmbed(context)
    const components = command.buildComponents?.(context)

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        allowed_mentions: NO_MENTIONS,
        embeds: [embed.toJSON()],
        ...(components !== undefined && components.length > 0 ? { components } : {}),
        ...(hidden ? { flags: MessageFlags.Ephemeral } : {})
      }
    }
  } catch (error) {
    return errorResponse(defaultErrorMessage(error))
  }
}
