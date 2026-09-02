/**
 * The shared Components V2 renderer — every command's output is built here.
 *
 * Under embeds each command assembled its own title, colour, fields and footer,
 * which is how the bot ended up with fourteen colour literals across eight
 * files, six mutually incompatible title shapes and seven different names for
 * "the dice that were rolled". One renderer means those are decided once.
 *
 * The layout it produces, top to bottom:
 *
 *   ## ◆ Full Success — you do it.      <- headline: the outcome, in the game's words
 *   Position: Risky · Effect: Standard  <- consequence: what it means mechanically
 *   ────────────────────────────────    <- separator
 *   Rolled  6 3 2 1                     <- the trace, one line per modifier step
 *   Keep highest  ~~3~~ ~~2~~ ~~1~~ 6      (with an optional Reroll button beside it)
 *   -# 4d6 keep highest → 6 · rolled …  <- derivation: the audit line
 *
 * Note what is absent: an embed field grid. Components V2 has no `inline`
 * fields, so the three-across row is gone. Facts that used to be inline fields
 * are joined into one ` · ` separated line by `renderFacts`, which reads better
 * on a phone than three truncated columns did anyway.
 */
import { traceRoll, formatAsMath } from '@randsum/roller/trace'
import type { TraceableRollRecord } from '@randsum/roller/trace'
import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} from '../../utils/builders.js'
import { FOOTER_ATTRIBUTION } from '../../utils/constants.js'
import { CUSTOM_ID_LIMIT } from './reroll.js'

/**
 * A single Text Display caps at 4000 characters, and `setContent` throws rather
 * than truncating — so an over-long body reaches the user as the dispatcher's
 * "Something went wrong" instead of a roll.
 *
 * Reachable from `/roll` without crafting: the roller allows 1000 dice per pool,
 * and a pool of four-digit faces renders past 4000 well before that. Clamping
 * here rather than at the call site means every future renderer inherits it.
 */
const TEXT_DISPLAY_LIMIT = 4000

function clampContent(content: string): string {
  if (content.length <= TEXT_DISPLAY_LIMIT) return content
  const notice = '\n-# …truncated'
  return content.slice(0, TEXT_DISPLAY_LIMIT - notice.length) + notice
}

/** A label/value pair — the replacement for an inline embed field. */
export interface ViewFact {
  readonly label: string
  readonly value: string
}

export interface RollContainerOptions {
  /** Accent bar colour. Drives outcome tier, never a per-command constant. */
  readonly accent: number
  /** The outcome, in the game's own vocabulary. Rendered as an `##` header. */
  readonly headline: string
  /** What the outcome means mechanically. One or two sentences. */
  readonly consequence?: string
  /** Pre-rendered body lines — usually `renderTrace`, sometimes a plain list. */
  readonly body?: readonly string[]
  /** Label/value pairs shown as one ` · ` separated line above the body. */
  readonly facts?: readonly ViewFact[]
  /** The audit line: how the total was arrived at. Rendered as `-#` subtext. */
  readonly derivation?: string
  /** Encoded reroll state. Omitted — with the button — when over the id limit. */
  readonly rerollId?: string
}

/** Joins label/value pairs into the single line that replaces the field grid. */
export function renderFacts(facts: readonly ViewFact[]): string {
  return facts.map(fact => `**${fact.label}** ${fact.value}`).join('  ·  ')
}

/**
 * Renders one roll record as trace lines: what was rolled, what each modifier
 * removed and added, and the final arithmetic.
 *
 * This is `@randsum/roller/trace` reaching Discord for the first time. The
 * engine has always produced this step model — `packages/dice-ui` renders it on
 * the website — while the bot hand-rolled `.join(', ')` and showed two parallel
 * plain lists for the reader to diff by eye.
 *
 * Removed dice are struck through, added dice bold, unchanged dice plain, which
 * is exactly the `DieBadge` variant scheme the web component uses.
 */
export function renderTrace(record: TraceableRollRecord): readonly string[] {
  return traceRoll(record).flatMap(step => {
    switch (step.kind) {
      case 'rolls': {
        const dice = [
          ...step.removed.map(value => `~~${value}~~`),
          ...step.added.map(value => `**${value}**`),
          ...step.unchanged.map(value => String(value))
        ]
        return dice.length > 0 ? [`**${step.label}**  ${dice.join(' ')}`] : []
      }
      case 'arithmetic':
        return [`**${step.label}**  ${step.display}`]
      case 'finalRolls':
        return [`**Total**  ${formatAsMath(step.rolls, step.arithmeticDelta)}`]
      case 'divider':
        return []
    }
  })
}

/**
 * Builds one container. Commands describe *what* to say; this decides how.
 *
 * The reroll button is attached as a `Section` accessory rather than an action
 * row, so it sits beside the dice instead of stranded beneath them — the one
 * layout embeds cannot express at all.
 */
export function rollContainer(options: RollContainerOptions): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(options.accent)

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${options.headline}`))

  if (options.consequence !== undefined && options.consequence.length > 0) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(options.consequence))
  }

  if (options.facts !== undefined && options.facts.length > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(renderFacts(options.facts))
    )
  }

  const body = options.body ?? []
  if (body.length > 0) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )

    const text = new TextDisplayBuilder().setContent(clampContent(body.join('\n')))
    const rerollable = options.rerollId !== undefined && options.rerollId.length <= CUSTOM_ID_LIMIT

    if (rerollable) {
      container.addSectionComponents(
        new SectionBuilder().addTextDisplayComponents(text).setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(options.rerollId ?? '')
            .setLabel('Reroll')
            .setStyle(ButtonStyle.Secondary)
        )
      )
    } else {
      container.addTextDisplayComponents(text)
    }
  }

  const derivation =
    options.derivation !== undefined && options.derivation.length > 0
      ? `${options.derivation} · ${FOOTER_ATTRIBUTION}`
      : FOOTER_ATTRIBUTION

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${derivation}`))

  return container
}
