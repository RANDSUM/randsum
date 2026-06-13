import { MessageFlags } from '../utils/discord.js'
import type { Client, Collection, Interaction } from '../utils/discord.js'
import type { Command } from '../types.js'
import { logger } from '../utils/logger.js'
import { recordError, recordInvocation } from '../utils/metrics.js'
import { captureException } from '../utils/errorTracker.js'

export async function interactionCreateHandler(interaction: Interaction): Promise<void> {
  const client = interaction.client as Client & { commands: Collection<string, Command> }

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName)
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction)
      } catch (error) {
        captureException(error, {
          command: interaction.commandName,
          interactionId: interaction.id,
          phase: 'autocomplete'
        })
      }
    }
    return
  }

  if (!interaction.isChatInputCommand()) {
    return
  }

  const command = client.commands.get(interaction.commandName)

  if (!command) {
    logger.warn('command.not_found', {
      command: interaction.commandName,
      interactionId: interaction.id
    })
    return
  }

  recordInvocation(interaction.commandName)

  try {
    await command.execute(interaction)
  } catch (error) {
    recordError(interaction.commandName)
    captureException(error, {
      command: interaction.commandName,
      interactionId: interaction.id,
      userId: interaction.user.id,
      guildId: interaction.guildId ?? undefined,
      phase: 'execute'
    })
    const reply = {
      content: 'There was an error while executing this command!',
      flags: [MessageFlags.Ephemeral] as const
    }
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply)
      } else {
        await interaction.reply(reply)
      }
    } catch (replyError) {
      captureException(replyError, {
        command: interaction.commandName,
        interactionId: interaction.id,
        phase: 'error-reply'
      })
    }
  }
}
