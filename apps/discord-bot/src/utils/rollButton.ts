import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export function createRollButton(
  command: string,
  params: string,
  disabled = false
): ActionRowBuilder<ButtonBuilder> {
  const customId = `reroll:${command}:${params}`
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel('Roll Again')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}
