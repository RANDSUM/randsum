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
import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from '../utils/builders.js'
import { FOOTER_ATTRIBUTION } from '../utils/constants.js'
import { ERROR } from '../utils/palette.js'
import { optionsFromPayload } from '../commands/lib/context.js'
import { decodeReroll, defaultErrorMessage, isRerollId } from '../commands/lib/index.js'
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
function viewResponse(view: RollView, hidden: boolean): unknown {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.IsComponentsV2 | (hidden ? MessageFlags.Ephemeral : 0),
      allowed_mentions: NO_MENTIONS,
      components: view.map(container => container.toJSON())
    }
  }
}

/**
 * The error surface, as a container like everything else.
 *
 * Two things were wrong with the embed version beyond its shape. Its `0xff0000`
 * was byte-identical to the failure accent of `/blades`, `/pbta` and `/root`,
 * so a missed roll and a crash looked the same; it uses a distinct dark red
 * now. And it was the only message in the bot with no footer, because it was a
 * raw object literal that never went near the shared constant.
 *
 * Always ephemeral, regardless of the `hidden` option: an error is for the
 * person who typed the command, not the channel.
 */
function errorResponse(message: string): unknown {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowed_mentions: NO_MENTIONS,
      components: [
        new ContainerBuilder()
          .setAccentColor(ERROR)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## Something went wrong'),
            new TextDisplayBuilder().setContent(message),
            new TextDisplayBuilder().setContent(`-# ${FOOTER_ATTRIBUTION}`)
          )
          .toJSON()
      ]
    }
  }
}

/**
 * Re-run a command from the state encoded in a reroll button's `custom_id`.
 *
 * Answers with a NEW message (type 4) rather than editing the original (type
 * 7). A Worker cannot tell whether the clicker is the person who rolled without
 * spending ~19 of the 100 available characters on their user id, and an edit
 * would let a bystander silently overwrite someone else's result. A new message
 * also leaves the channel readable as a transcript.
 *
 * The reroll runs the same `buildView` the slash command does — there is no
 * second rendering path to keep in step.
 */
function dispatchReroll(
  customId: string,
  payload: InteractionPayload,
  commands: ReadonlyMap<string, Command>
): unknown {
  const target = decodeReroll(customId)
  if (target === undefined) return undefined

  const command = commands.get(target.commandName)
  if (command?.buildView === undefined) {
    // A button from an older deployment whose command has since been removed.
    return errorResponse(`\`/${target.commandName}\` is no longer available.`)
  }

  // Built before the try so the catch can hand it to `describeError`. A reroll
  // carries the original invocation's options in its `custom_id`, so the hook
  // sees the same notation the slash command did and answers identically —
  // there is no second error wording to keep in step.
  const context = {
    options: target.options,
    userDisplayName: resolveDisplayName(payload)
  }

  try {
    return viewResponse(command.buildView(context), target.hidden)
  } catch (error) {
    return errorResponse(command.describeError?.(error, context) ?? defaultErrorMessage(error))
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
function dispatchComponent(
  payload: InteractionPayload,
  commands: ReadonlyMap<string, Command>
): unknown {
  const customId = payload.data?.custom_id
  if (customId === undefined) return undefined

  if (isRerollId(customId)) return dispatchReroll(customId, payload, commands)

  if (customId !== NOTATION_SELECT_ID) return undefined

  const view = buildNotationView(payload.data?.values?.[0])
  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      // The V2 flag is required on an edit exactly as on the original message:
      // it cannot be removed once set, and omitting it here would make Discord
      // read the container as a malformed action row.
      flags: MessageFlags.IsComponentsV2,
      allowed_mentions: NO_MENTIONS,
      components: view.map(container => container.toJSON())
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
    return dispatchComponent(payload, commands)
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

  if (command.buildView === undefined) {
    return errorResponse(`\`/${name}\` is not available on this deployment yet.`)
  }

  const options = optionsFromPayload(payload.data?.options)
  // Outside the try so the catch block can pass it to `describeError`, which
  // needs the invocation's options to say anything specific about what failed.
  const context = { options, userDisplayName: resolveDisplayName(payload) }

  try {
    const hidden = options.getBoolean('hidden') ?? false

    return viewResponse(command.buildView(context), hidden)
  } catch (error) {
    // The command gets first refusal on the wording — `/roll` uses it to
    // suggest a correction — and `defaultErrorMessage` covers everyone else.
    return errorResponse(command.describeError?.(error, context) ?? defaultErrorMessage(error))
  }
}
