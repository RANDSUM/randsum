import { ComponentType, SlashCommandBuilder } from '../utils/builders.js'
import type { StringSelectMenuInteraction } from '../utils/discord.js'
import { deferReplyHonoringHidden } from '../utils/ephemeral.js'
import { replyWithError } from '../utils/replyWithError.js'
import { captureException } from '../utils/errorTracker.js'
import { buildCategoryMenu, buildNotationView } from './lib/notationView.js'
import type { Command } from '../types.js'

const COLLECTOR_TIMEOUT = 5 * 60 * 1000

export const notationCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('notation')
    .setDescription('RANDSUM Dice Notation Reference')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),

  // The Worker renders the same view; see lib/notationView.ts. Only the initial
  // page — a Worker answers each selection as a fresh interaction rather than
  // holding a collector, so there is no "session" to seed here.
  buildEmbed: () => buildNotationView().embed,
  buildComponents: () => [buildNotationView().row.toJSON()],

  async execute(interaction) {
    await deferReplyHonoringHidden(interaction)

    try {
      const view = buildNotationView()

      const message = await interaction.editReply({
        embeds: [view.embed],
        components: [view.row]
      })

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: COLLECTOR_TIMEOUT
      })

      collector.on('collect', (selectInteraction: StringSelectMenuInteraction) => {
        void (async () => {
          try {
            const selected = selectInteraction.values[0]
            if (selected === undefined) return

            const updated = buildNotationView(selected)
            await selectInteraction.update({
              embeds: [updated.embed],
              components: [updated.row]
            })
          } catch (error) {
            captureException(error, {
              command: 'notation',
              interactionId: selectInteraction.id,
              phase: 'collector.collect'
            })
          }
        })()
      })

      collector.on('end', () => {
        void (async () => {
          try {
            // Grey the menu out once it stops responding, so a click that can no
            // longer work looks disabled rather than broken.
            await message.edit({
              components: [buildCategoryMenu(view.categories, view.category, true)]
            })
          } catch (error) {
            captureException(error, {
              command: 'notation',
              interactionId: interaction.id,
              phase: 'collector.end'
            })
          }
        })()
      })
    } catch (error) {
      await replyWithError(
        interaction,
        'Error',
        error instanceof Error ? error.message : 'An unknown error occurred'
      )
    }
  }
}
