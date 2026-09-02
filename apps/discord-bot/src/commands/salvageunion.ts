import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder
} from '../utils/builders.js'
import { FOOTER_ATTRIBUTION } from '../utils/constants.js'
import { createGameCommand } from './lib/index.js'
import type { Command } from '../types.js'

/**
 * Salvage Union support has moved to the SURef bot from salvageunion.io, which
 * rolls every table *and* looks up chassis, systems, modules, and equipment.
 * This command replaces the old `/su` roller: it no longer rolls, it points.
 * The rename also frees `/su` in servers running both bots — SURef owns that
 * name now.
 *
 * Rust orange is kept from the embed version: it was already the right colour
 * for a post-apocalyptic mech-salvage game, and it is the one accent in the bot
 * that never needed retuning.
 */

/** SURef's application id — public by design, it appears in every invite URL. */
const SUREF_CLIENT_ID = '1442878052823470172'
const SUREF_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${SUREF_CLIENT_ID}&scope=bot%20applications.commands&permissions=0`
const SUREF_INFO_URL = 'https://salvageunion.io/discord'

const RUST = 0xb7410e

export const salvageUnionCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('salvageunion')
    .setDescription('Salvage Union rolls have moved to the SURef bot from salvageunion.io')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  // Static content, so it takes no context at all.
  //
  // This is the one command whose whole purpose is a call to action, and it
  // spent it on two markdown links buried in embed fields. Link buttons need no
  // custom_id and no interaction round trip — they work on a stateless Worker
  // unchanged — and they are a tap target rather than a text link, which is
  // what matters on the phone where most "add this bot" taps happen.
  buildView: () => [
    new ContainerBuilder()
      .setAccentColor(RUST)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## Salvage Union has moved'),
        new TextDisplayBuilder().setContent(
          'RANDSUM no longer rolls Salvage Union tables. **SURef**, the official bot from salvageunion.io, does it better — every table, plus lookups for any chassis, system, module, or piece of equipment, linked back to the full SRD entry.'
        )
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Add SURef to your server')
            .setStyle(ButtonStyle.Link)
            .setURL(SUREF_INVITE_URL),
          new ButtonBuilder()
            .setLabel('Learn more')
            .setStyle(ButtonStyle.Link)
            .setURL(SUREF_INFO_URL)
        )
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${FOOTER_ATTRIBUTION}`))
  ]
})
