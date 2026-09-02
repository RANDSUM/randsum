import {
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder
} from '../utils/builders.js'
import { FOOTER_ATTRIBUTION } from '../utils/constants.js'
import { createGameCommand } from './lib/index.js'
import { commandRegistry } from './lib/registry.js'
import { BRAND } from '../utils/palette.js'
import type { Command } from '../types.js'

/**
 * `/help` reads the registry rather than `client.commands`, which is what makes
 * it work without a gateway — a Worker has no client to read a registry off.
 * The barrel publishes the list; see `lib/registry.ts` for why it is pushed
 * rather than imported.
 *
 * The embed version stacked nine full-width fields, one per command, which is a
 * tall wall of text with no usage information: it could tell you `/pbta` exists
 * but not that it requires a `stat`. Each line now carries the command's
 * required options, which is the part a reader actually needs.
 */
function requiredOptionHint(command: Command): string {
  const options = command.data.options
    .map(option => option.toJSON())
    .filter(option => option.required === true)
    .map(option => `<${option.name}>`)

  return options.length > 0 ? ` ${options.join(' ')}` : ''
}

export const helpCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available RANDSUM commands')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: () => {
    const lines = commandRegistry()
      .filter(command => command.data.name !== 'help')
      .map(
        command =>
          `**/${command.data.name}${requiredOptionHint(command)}**\n-# ${command.data.description}`
      )

    return [
      new ContainerBuilder()
        .setAccentColor(BRAND)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## RANDSUM Commands'),
          new TextDisplayBuilder().setContent(
            'Roll dice for a specific system, or use `/roll` with any RANDSUM notation. `/notation` is the full reference.'
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        // A TextDisplay rejects empty content, and the registry is populated by
        // the barrel at import time — so an empty list is a real (if unlikely)
        // crash rather than a blank section.
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            lines.length > 0 ? lines.join('\n') : '-# No commands are registered.'
          )
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${FOOTER_ATTRIBUTION}`))
    ]
  }
})
