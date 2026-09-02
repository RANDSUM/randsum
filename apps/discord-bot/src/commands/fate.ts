import { roll } from '@randsum/games/fate'
import type { FateRollResult } from '@randsum/games/fate'
import { SlashCommandBuilder } from '../utils/builders.js'
import { FATE, GLYPH } from '../utils/palette.js'
import {
  createGameCommand,
  encodeReroll,
  formatSignedModifier,
  getInitialRolls,
  rollContainer
} from './lib/index.js'
import type { CommandContext, ViewFact } from './lib/index.js'
import type { Command, RollView } from '../types.js'

const SKILL_MIN = -2
const SKILL_MAX = 5

// Keyed by the exported FateRollResult union so the ladder map stays
// exhaustive: renaming the result strings surfaces here as a type error rather
// than a silent miss. `label` is the human-readable ladder rung shown to the
// player; the result strings themselves are snake_case.
const ladder: Record<FateRollResult, { readonly color: number; readonly label: string }> = {
  legendary: { color: FATE.legendary, label: 'Legendary' },
  epic: { color: FATE.legendary, label: 'Epic' },
  fantastic: { color: FATE.great, label: 'Fantastic' },
  superb: { color: FATE.great, label: 'Superb' },
  great: { color: FATE.great, label: 'Great' },
  good: { color: FATE.good, label: 'Good' },
  fair: { color: FATE.good, label: 'Fair' },
  average: { color: FATE.average, label: 'Average' },
  mediocre: { color: FATE.average, label: 'Mediocre' },
  poor: { color: FATE.poor, label: 'Poor' },
  terrible: { color: FATE.terrible, label: 'Terrible' }
}

/**
 * Fate dice as monospace tiles.
 *
 * The printed form in the book is `[+] [-] [ ]`, and inline code gives fixed
 * width so a 4dF spread reads as a row rather than drifting. It also replaces
 * `▢` (U+25A2), which has patchy font coverage and rendered as tofu on some
 * Android and Linux configurations.
 *
 * Fate is the one game where boxing beats bold/strikethrough: Discord ignores
 * markdown inside a code span, so tiles and kept/dropped marking are mutually
 * exclusive — and Fate has no drop mechanic to mark.
 */
function fateDieTile(die: number): string {
  if (die > 0) return '`[+]`'
  if (die < 0) return '`[-]`'
  return '`[ ]`'
}

/**
 * Fate's real outcomes are measured in shifts against opposition, not by the
 * ladder rung of the total in isolation. Four bands, per Fate Core.
 */
function shiftOutcome(shifts: number): {
  glyph: string
  name: string
  note: string
  accent: number
} {
  if (shifts >= 3) {
    return {
      glyph: GLYPH.critical,
      name: 'Succeed with Style',
      note: 'Take a boost, or succeed at greater effect.',
      accent: FATE.legendary
    }
  }
  if (shifts > 0) {
    return { glyph: GLYPH.success, name: 'Success', note: 'You do it.', accent: FATE.great }
  }
  if (shifts === 0) {
    return {
      glyph: GLYPH.mixed,
      name: 'Tie',
      note: 'You succeed at a minor cost, or get a lesser result.',
      accent: FATE.average
    }
  }
  return {
    glyph: GLYPH.failure,
    name: 'Fail',
    note: 'Fail, or succeed at serious cost.',
    accent: FATE.terrible
  }
}

function buildFateView(context: CommandContext): RollView {
  const rawSkill = context.options.getInteger('skill') ?? 0
  const skill = Math.max(SKILL_MIN, Math.min(SKILL_MAX, rawSkill))
  const opposition = context.options.getInteger('opposition')

  const result = roll({ modifier: skill })
  const dice = getInitialRolls(result)
  const rung = ladder[result.result]

  const facts: ViewFact[] = []
  if (skill !== 0) facts.push({ label: 'Skill', value: formatSignedModifier(skill) })
  facts.push({ label: 'Total', value: formatSignedModifier(result.total) })

  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('fate', { skill, opposition, hidden })

  const headline = `${rung.label} (${formatSignedModifier(result.total)})`

  if (opposition !== null) {
    const shifts = result.total - opposition
    const outcome = shiftOutcome(shifts)
    const magnitude = Math.abs(shifts)
    const shiftText =
      shifts === 0
        ? 'A tie'
        : `${magnitude} shift${magnitude === 1 ? '' : 's'} ${shifts > 0 ? 'over' : 'under'}`

    return [
      rollContainer({
        // The OUTCOME drives the accent here, not the ladder rung. They are two
        // different axes: a Legendary (+9) against opposition of +10 is a Fail,
        // and painting that gold told the player the opposite of the word beside
        // it. The rung still leads the headline, because it is what the dice
        // said; the colour reports what it got you.
        accent: outcome.accent,
        headline: `${outcome.glyph} ${headline}  ·  ${outcome.name}`,
        consequence: `${shiftText} opposition of ${formatSignedModifier(opposition)}. ${outcome.note}`,
        facts,
        body: [dice.map(fateDieTile).join(' ')],
        derivation: `4dF ${formatSignedModifier(skill)} = ${formatSignedModifier(result.total)} vs ${formatSignedModifier(opposition)}`,
        ...(rerollId !== undefined ? { rerollId } : {})
      })
    ]
  }

  return [
    rollContainer({
      accent: rung.color,
      headline,
      facts,
      body: [dice.map(fateDieTile).join(' ')],
      derivation: `4dF ${formatSignedModifier(skill)} = ${formatSignedModifier(result.total)}`,
      ...(rerollId !== undefined ? { rerollId } : {})
    })
  ]
}

export const fateCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('fate')
    .setDescription('Roll 4dF + skill against the Fate ladder (Fate Core)')
    .addIntegerOption(option =>
      option
        .setName('skill')
        .setDescription('Skill rating (-2 to 5)')
        .setRequired(false)
        .setMinValue(SKILL_MIN)
        .setMaxValue(SKILL_MAX)
    )
    .addIntegerOption(option =>
      option
        .setName('opposition')
        .setDescription('Opposition to beat — resolves shifts into a Fate outcome')
        .setRequired(false)
        .setMinValue(-4)
        .setMaxValue(10)
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: buildFateView
})
