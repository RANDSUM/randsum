import type { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js'
// Deliberately the portable builder, not discord.js's. discord.js does not
// re-export @discordjs/builders verbatim — it *subclasses* EmbedBuilder, adding
// `.length` and accepting hex-string colours. The two are therefore distinct
// types, and a command that returns one cannot satisfy a signature demanding
// the other. Since command renderers must run on workerd, the portable one wins.
import type { EmbedBuilder } from './utils/builders.js'
import type { CommandContext } from './commands/lib/context.js'

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  /**
   * The transport-agnostic renderer — the whole of a command.
   *
   * There used to be an `execute(interaction)` beside this: the discord.js
   * entry point, which took a live gateway interaction and replied through it.
   * The Worker is the only transport now, and it has no interaction to reply
   * through — it returns a response body — so `buildEmbed` is what runs.
   *
   * Still optional, and the Worker still checks: a command added without one
   * must say "not available on this deployment" rather than have the dispatcher
   * guess. Every command in the barrel currently has one, and
   * `__tests__/worker/dispatch.test.ts` holds that line.
   */
  buildEmbed?: (context: CommandContext) => EmbedBuilder
  /**
   * Interactive components to attach alongside the embed, as raw API JSON.
   *
   * Only `/notation` uses this. Kept separate from `buildEmbed` rather than
   * folded into a single "build the view" hook because nine of ten commands
   * have no components at all, and widening their signature to carry an always-
   * empty array is the kind of shared abstraction that gets filled in wrongly
   * later.
   */
  buildComponents?: (context: CommandContext) => readonly unknown[]
}
