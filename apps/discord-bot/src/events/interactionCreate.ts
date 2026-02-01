import { MessageFlags } from 'discord.js'
import type { Client, Collection, Interaction } from 'discord.js'
import type { Command } from '../types.js'

export async function interactionCreateHandler(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return
  }

  const client = interaction.client as Client & { commands: Collection<string, Command> }
  const command = client.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error('Error executing command:', error)
    const reply = {
      content: 'There was an error while executing this command!',
      flags: [MessageFlags.Ephemeral] as const
    }
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply)
    } else {
      await interaction.reply(reply)
    }
  }
}
