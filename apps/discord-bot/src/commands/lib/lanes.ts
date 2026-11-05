/**
 * The Lanes layout of `<randsum-roll-steps>`, drawn as text for Discord.
 *
 * On the site each die gets its own column, and a vertical line carries it
 * from the initial roll, through every step that touched it, down to a Result
 * row. Discord has no canvas, so this draws the same picture in a code block,
 * where a monospace grid keeps the columns straight:
 *
 *   • 1  2  3  1  1
 *   R 4  ╎  │  3  6
 *   ! │  ╎  │  │  6→ 5
 *   L │  2  │  │  │  │
 *   + │     │  │  │  │  +2
 *   ──────────────────────────────
 *   R 4     3  3  6  5  +2  = 23
 *   -# R Reroll Exactly 1 · ! Explode · L Drop Lowest 1 · + Add
 *
 * The model is `timeline()` from `@randsum/ui/timeline`, the one the site draws,
 * so the two can never disagree about which die went where.
 *
 * No colour: a code block has none that works everywhere, and colour on a
 * roll result means removal anyway. Structure carries the meaning instead. A
 * removed die's line is dashed (`╎`) down to the step that took it and it is
 * missing from Result; an explosion's dice are joined by plain arrows.
 */
import type { RollRecord } from '@randsum/roller'
import { timeline } from '@randsum/ui/timeline'
import type { Lane, TimelineRow } from '@randsum/ui/timeline'

/**
 * The widest grid drawn as lanes. Past it a phone wraps the code block and the
 * columns fall apart, so the caller shows the step-by-step trace instead.
 */
const LANES_MAX_WIDTH = 30

const LINE = '│'
const REMOVED_LINE = '╎'
const RULE = '─'
const GAP = '  '
const ARROW = '→ '
const PIP = '•'
const RESULT_MARK = 'R'

/**
 * The notation each step's modifier is written with, so a step row is marked
 * by what the player typed: `L` for drop lowest, `!` for explode, `+` for add.
 */
const NOTATION_MARKS: Readonly<Record<string, string>> = {
  cap: 'C',
  compound: '!!',
  count: '#',
  explode: '!',
  explodeSequence: '!s',
  integerDivide: '//',
  keep: 'K',
  minus: '-',
  modulo: '%',
  multiply: '*',
  multiplyTotal: '**',
  penetrate: '!p',
  plus: '+',
  replace: 'V',
  reroll: 'R',
  sort: 'S',
  unique: 'U',
  wildDie: 'W'
}

/** A step's mark: its notation, with drop split by which end it takes. */
function stepMark(row: TimelineRow): string {
  if (row.modifier === 'drop') return row.label.includes('Highest') ? 'H' : 'L'
  if (row.modifier === 'keep' && row.label.includes('Lowest')) return 'KL'
  return NOTATION_MARKS[row.modifier ?? ''] ?? PIP
}

/** What a lane shows on one row: a die, a line, or nothing. */
function laneCell(lane: Lane, row: number): string | undefined {
  const node = lane.nodes.find(n => n.row === row)
  if (node !== undefined) return String(node.value)
  const first = lane.nodes[0]
  const last = lane.nodes.at(-1)
  if (first === undefined || last === undefined || row < first.row) return undefined
  if (lane.final !== undefined) return LINE
  return row < last.row ? REMOVED_LINE : undefined
}

/** Whether an arrow joins this lane to the one on its left on this row. */
function arrives(lane: Lane, row: number): boolean {
  return lane.chained && lane.nodes[0]?.row === row
}

/**
 * The lanes for one pool, as the lines of a code block (fences included), or
 * `undefined` when the grid is too wide to stay straight on a phone.
 */
export function renderLanes(record: RollRecord): readonly string[] | undefined {
  const { rows, lanes, changed, total } = timeline(record)
  if (lanes.length === 0 && rows.every(r => r.math === undefined)) return undefined

  const width = Math.max(1, ...lanes.flatMap(l => l.nodes.map(n => String(n.value).length)))
  const terms = rows.flatMap((r, row) => (r.math === undefined ? [] : [{ row, math: r.math }]))
  const lastRow = rows.length

  // A static term such as `+5` is its own lane: shown on its step, carried
  // down by a line, and repeated in the Result row.
  const termCell = (term: { row: number; math: string }, row: number): string =>
    row === term.row || row === lastRow ? term.math : row > term.row ? LINE : ''

  const line = (row: number, cell: (lane: Lane) => string | undefined): string => {
    const dice = lanes
      .map((lane, i) => {
        const text = (cell(lane) ?? '').padStart(width)
        if (i === 0) return text
        return (arrives(lane, row) ? ARROW : GAP) + text
      })
      .join('')
    const extra = terms.map(t => termCell(t, row).padStart(t.math.length)).join(GAP)
    return dice.length > 0 && extra.length > 0 ? `${dice}  ${extra}` : dice + extra
  }

  // A roll nothing changed is just its dice: rows of bare lines say nothing.
  const shown = changed ? rows : rows.slice(0, 1)
  const grid = shown.map((_, row) => line(row, lane => laneCell(lane, row)))
  const result = changed ? [line(lastRow, lane => lane.final?.toString())] : []
  const gridWidth = Math.max(...[...grid, ...result].map(l => l.length))
  // Every character of the widest line counts: the gutter, and the `= 23`
  // that ends the Result row.
  const steps = changed ? rows.slice(1) : []
  const marks = [PIP, ...steps.map(stepMark), ...(changed ? [RESULT_MARK] : [])]
  const gutterWidth = Math.max(...marks.map(m => m.length)) + 1
  const totalText = changed ? `  = ${total}` : ''
  const blockWidth = gutterWidth + gridWidth + totalText.length
  if (blockWidth > LANES_MAX_WIDTH) return undefined

  // Step names would make each line too long for a phone, where a wrapped
  // line breaks every column, so each step row is marked in the gutter with
  // its notation (`L`, `!`, `+`) and the names go in a key under the block.
  // The Result row is `R`, under a rule as wide as the whole block.
  const mark = (text: string): string => text.padEnd(gutterWidth)
  const key = steps.map(r => `\`${stepMark(r)}\` ${r.label}`).join('  ·  ')

  return [
    '```',
    ...grid.map((text, row) => `${mark(marks[row] ?? PIP)}${text}`.trimEnd()),
    ...(changed
      ? [
          RULE.repeat(blockWidth),
          ...result.map(text => `${mark(RESULT_MARK)}${text.padEnd(gridWidth)}${totalText}`)
        ]
      : []),
    '```',
    ...(key.length > 0 ? [`-# ${key}`] : [])
  ]
}

/**
 * A game roll's dice as lanes, or `fallback` when lanes add nothing: a game
 * that rolls several pools (Daggerheart's Hope and Fear) names each pool
 * itself, a roll no step changed reads better as the game's own line
 * (`**1d20**  14`), and a grid too wide for a phone keeps that line too.
 */
export function lanesOr(
  result: { readonly rolls: readonly RollRecord[] },
  fallback: readonly string[]
): readonly string[] {
  const [only, ...rest] = result.rolls
  if (only === undefined || rest.length > 0 || !timeline(only).changed) return fallback
  return renderLanes(only) ?? fallback
}
