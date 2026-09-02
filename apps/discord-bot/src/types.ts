import type { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js'
// Deliberately the portable builders, not discord.js's. discord.js does not
// re-export @discordjs/builders verbatim — it subclasses some of them — so the
// two are distinct types, and a command returning one cannot satisfy a
// signature demanding the other. Since command renderers must run on workerd,
// the portable ones win.
import type { ContainerBuilder } from './utils/builders.js'
import type { CommandContext } from './commands/lib/context.js'

/**
 * A rendered command response: one Components V2 container per dice pool.
 *
 * An array rather than a single container because a multi-pool roll
 * (`2d6 1d8`) and a repeat (`4d6Lx6`) genuinely produce several results, and
 * the embed renderer's habit of showing only `rolls[0]` while reporting the
 * combined total was a bug, not a simplification.
 *
 * Narrowed to `ContainerBuilder` rather than the wider top-level component
 * union because every command wants an accent bar, and a select menu can nest
 * inside a container — so the dispatcher never has to branch on component kind.
 */
export type RollView = readonly ContainerBuilder[]

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  /**
   * The renderer — the whole of a command.
   *
   * There used to be a `buildEmbed` beside this, and before that an
   * `execute(interaction)`. Both are gone: the Worker is the only transport and
   * Components V2 is the only output shape, so a command builds containers and
   * the dispatcher wraps them.
   *
   * Still optional, and the dispatcher still checks: a command added without
   * one must say "not available on this deployment" rather than have the
   * dispatcher guess. Every command in the barrel has one, and
   * `__tests__/worker/dispatch.test.ts` holds that line.
   *
   * `buildComponents` went with `buildEmbed`. It existed because an embed and
   * its action row were separate fields on the response; under Components V2
   * they are the same tree, and `/notation` — its only user — nests its select
   * menu inside its container.
   */
  buildView?: (context: CommandContext) => RollView
}
