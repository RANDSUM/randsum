// The steps of a roll worth showing, shared by the elements and the native
// components. Not a public entry.
import type { RollRecord } from '@randsum/roller'
import { tokenize } from '@randsum/roller/tokenize'
import type { Token } from '@randsum/roller/tokenize'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'
import { MODIFIER_INKS, tokenModifier } from './ink'
import type { StepInk } from './ink'

export type { StepInk } from './ink'

export type ShownStep = Exclude<RollTraceStep, { readonly kind: 'divider' | 'finalRolls' }>

function shown(step: RollTraceStep): step is ShownStep {
  return step.kind !== 'divider' && step.kind !== 'finalRolls'
}

/** The heading of a pool's first step, the dice as they were first rolled. */
const INITIAL_ROLLS_LABEL = 'Initial Rolls'

/** What was rolled, what changed and what was added; no dividers or final rolls. */
export function visibleSteps(record: RollRecord): readonly ShownStep[] {
  return traceRoll(record)
    .filter(shown)
    .map((step, i) =>
      i === 0 && step.kind === 'rolls' ? { ...step, label: INITIAL_ROLLS_LABEL } : step
    )
}

/** A pool's name in a multi-pool roll. */
export interface PoolName {
  readonly text: string
  /** Whether `text` is notation (shown as code) rather than a label */
  readonly notation: boolean
}

/**
 * What a pool is called in a multi-pool roll: its label when it has one (a
 * game's "Hope" and "Fear" dice, or `[fire]` in notation), else its notation.
 */
export function poolName(record: RollRecord): PoolName {
  return record.label === undefined || record.label === ''
    ? { text: record.notation, notation: true }
    : { text: record.label, notation: false }
}

/** A row of the timeline: the initial roll, then one per modifier step. */
export interface TimelineRow {
  /**
   * The notation that made the row, which is what a row shows: `5d6` for
   * the initial roll, `R{1}`, `!`, `L` or `+2` for a step
   */
  readonly notation: string
  /** What the row did in words, for a hover or a key: `Reroll Exactly 1` */
  readonly label: string
  readonly ink: StepInk
  /** The modifier behind a step, such as `drop`; undefined on the initial roll */
  readonly modifier: string | undefined
  /** An arithmetic step's term, such as `+3`; it changes no die */
  readonly math?: string
}

/**
 * Where a die shows on a row: `rolled` on the initial row, `changed` when a
 * step gave it a new value, `trigger` when it set off an explosion, `born` when
 * a step added it, `removed` when a step took it away (its lane ends there).
 */
export interface LaneNode {
  readonly row: number
  readonly value: number
  readonly kind: 'rolled' | 'changed' | 'trigger' | 'born' | 'removed'
  /** What it was before a `changed` node */
  readonly was?: number
  /** A compounding explosion's dice: the die that set it off, then each roll */
  readonly chain?: readonly number[]
  /** The dice its explosion rolled, on a `trigger` node */
  readonly exploded?: readonly number[]
}

/** One die's journey: the rows where something happened to it. */
export interface Lane {
  readonly nodes: readonly LaneNode[]
  /** Its value in the result, or undefined when a step removed it */
  readonly final: number | undefined
  /** Rolled by the explosion of the lane to its left, so an arrow joins them */
  readonly chained: boolean
}

export interface Timeline {
  readonly rows: readonly TimelineRow[]
  readonly lanes: readonly Lane[]
  /**
   * Whether any step changed the dice or added a term such as `+5`, so a
   * Result row is worth showing
   */
  readonly changed: boolean
  /** The pool's total, shown as `= 18` on the Result row */
  readonly total: number
}

interface Building {
  nodes: LaneNode[]
  value: number
  alive: boolean
  chained: boolean
}

/** Takes one of each of `values` out of `pool`, where it has one. */
function without(pool: readonly number[], values: readonly number[]): number[] {
  const left = [...pool]
  for (const value of values) {
    const at = left.indexOf(value)
    if (at !== -1) left.splice(at, 1)
  }
  return left
}

/** The pool's notation in tokens, or none when it does not tokenize. */
function tokensOf(record: RollRecord): readonly Token[] {
  try {
    return tokenize(record.notation)
  } catch {
    return []
  }
}

/**
 * The notation behind each row: the core roll for the initial row, then the
 * token (or tokens, when one step applies several) behind each step. Steps
 * run in the roller's order, not the order they were typed, so tokens are
 * matched by the modifier they apply; drop's two ends by which end.
 */
function rowNotations(
  record: RollRecord,
  steps: readonly ShownStep[],
  modifiers: readonly string[]
): readonly (string | undefined)[] {
  const tokens = tokensOf(record)
  const used = new Set<Token>()
  const core = tokens.find(t => t.category === 'Core' || t.category === 'Special')
  return steps.map((step, row) => {
    if (row === 0) return core?.text
    const modifier = modifiers[row - 1]
    const end = step.label.includes('Lowest') ? 'L' : step.label.includes('Highest') ? 'H' : ''
    const mine = tokens.filter(t => !used.has(t) && tokenModifier(t) === modifier)
    const ends = modifier === 'drop' && end !== '' ? mine.filter(t => t.text.startsWith(end)) : []
    const alone = modifiers.filter(m => m === modifier).length === 1
    const picked = ends.length > 0 ? ends.slice(0, 1) : alone ? mine : mine.slice(0, 1)
    for (const t of picked) used.add(t)
    return picked.length > 0 ? picked.map(t => t.text).join('') : undefined
  })
}

/** The modifier behind each step after the initial roll, as traceRoll splits them. */
function stepModifiers(record: RollRecord): readonly string[] {
  return record.modifierLogs.flatMap(log => {
    const options =
      typeof log.options === 'object' && log.options !== null
        ? (log.options as Record<string, unknown>)
        : {}
    const both =
      (log.modifier === 'drop' || log.modifier === 'keep') &&
      typeof options['lowest'] === 'number' &&
      typeof options['highest'] === 'number'
    return both ? [log.modifier, log.modifier] : [log.modifier]
  })
}

/**
 * Follows each die through a roll's steps. The roller logs which values a
 * step removed and added, not which die, so dice pair up by value: two dice
 * showing the same number look the same, whichever one moved.
 */
export function timeline(record: RollRecord): Timeline {
  const steps = visibleSteps(record)
  const modifiers = stepModifiers(record)
  const notations = rowNotations(record, steps, modifiers)
  const coreDescription = tokensOf(record).find(t => t.category === 'Core')?.description
  const lanes: Building[] = []
  const rows: TimelineRow[] = []
  steps.forEach((step, row) => {
    const modifier = modifiers[row - 1]
    const ink = MODIFIER_INKS[modifier ?? ''] ?? 'plain'
    const notation = notations[row] ?? (step.kind === 'arithmetic' ? step.display : step.label)
    // The initial row's words are the core roll's ("Roll 5 6-sided dice")
    const label = row === 0 ? (coreDescription ?? step.label) : step.label
    if (step.kind === 'arithmetic') {
      rows.push({ notation, label, ink, modifier, math: step.display })
      return
    }
    rows.push({ notation, label, ink, modifier })
    if (row === 0) {
      for (const value of step.unchanged) {
        lanes.push({ nodes: [{ row, value, kind: 'rolled' }], value, alive: true, chained: false })
      }
      return
    }
    const used = new Set<Building>()
    const pick = (value: number): Building | undefined => {
      const lane = lanes.find(l => l.alive && l.value === value && !used.has(l))
      if (lane !== undefined) used.add(lane)
      return lane
    }
    const born = (value: number, after: Building | undefined, chained: boolean): Building => {
      const lane: Building = { nodes: [{ row, value, kind: 'born' }], value, alive: true, chained }
      lanes.splice(after === undefined ? lanes.length : lanes.indexOf(after) + 1, 0, lane)
      used.add(lane)
      return lane
    }
    const change = (lane: Building, value: number, chain?: readonly number[]): void => {
      lane.nodes.push({
        row,
        value,
        kind: 'changed',
        was: lane.value,
        ...(chain === undefined ? {} : { chain })
      })
      lane.value = value
    }
    const replacements = step.replacements ?? []
    const chains = step.explosions ?? []
    const removed = without(step.removed, [
      ...replacements.map(r => r.from),
      ...chains.filter(c => c.to !== undefined).map(c => c.from)
    ])
    const added = without(step.added, [
      ...replacements.map(r => r.to),
      ...chains.flatMap(c => (c.to === undefined ? c.rolls : [c.to]))
    ])
    for (const r of replacements) {
      const lane = pick(r.from)
      if (lane === undefined) born(r.to, undefined, false)
      else change(lane, r.to)
    }
    for (const c of chains) {
      const lane = pick(c.from)
      if (c.to !== undefined) {
        if (lane === undefined) born(c.to, undefined, false)
        else change(lane, c.to, [c.from, ...c.rolls])
        continue
      }
      if (lane !== undefined) {
        lane.nodes.push({ row, value: c.from, kind: 'trigger', exploded: c.rolls })
      }
      c.rolls.reduce<Building | undefined>(
        (prev, value) => born(value, prev, prev !== undefined),
        lane
      )
    }
    for (const value of removed) {
      const lane = pick(value)
      if (lane === undefined) continue
      lane.nodes.push({ row, value, kind: 'removed' })
      lane.alive = false
    }
    for (const value of added) born(value, undefined, false)
  })
  return {
    rows,
    lanes: lanes.map(l => ({
      nodes: l.nodes,
      final: l.alive ? l.value : undefined,
      chained: l.chained
    })),
    changed:
      lanes.some(l => l.nodes.length > 1 || !l.alive) ||
      lanes.some(l => l.nodes[0]?.row !== 0) ||
      rows.some(r => r.math !== undefined),
    total: record.total
  }
}
