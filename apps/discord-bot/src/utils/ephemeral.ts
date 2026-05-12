import { MessageFlags } from './discord.js'
import type { ChatInputCommandInteraction } from './discord.js'

/**
 * Defers the reply, honoring an optional boolean `hidden` slash command option.
 * When `hidden: true`, the response is sent ephemerally (visible only to the
 * user who invoked the command — useful for GM-secret rolls).
 */
export async function deferReplyHonoringHidden(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const hidden = interaction.options.getBoolean('hidden') ?? false
  if (hidden) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  } else {
    await interaction.deferReply()
  }
}
