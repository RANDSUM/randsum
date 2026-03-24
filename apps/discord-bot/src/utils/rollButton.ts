import { ActionRowBuilder, ButtonBuilder } from './discord.js'

// ButtonStyle.Secondary = 2 (Discord API constant, stable across versions)
// Imported as a literal to avoid Bun mock.module resolution issues in tests
const BUTTON_STYLE_SECONDARY = 2

export function createRollButton(
  command: string,
  params: string,
  disabled = false
): ActionRowBuilder<ButtonBuilder> {
  const customId = `reroll:${command}:${params}`
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel('Roll Again')
    .setStyle(BUTTON_STYLE_SECONDARY)
    .setDisabled(disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}
