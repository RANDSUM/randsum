/**
 * The Lanes layout of `<randsum-roll-steps>`, drawn as text for Discord.
 *
 * On the site each die gets its own column, and a vertical line carries it
 * from the initial roll, through every step that touched it, down to a Result
 * row. Discord has no canvas, so this draws the same picture in a code block,
 * where a monospace grid keeps the columns straight:
 *
 *   5d6   1  2  3  1  1
 *   R{1}  4  ╎  │  3  6
 *   !     │  ╎  │  │  6→ 6→ 5
 *   L     │  2  │  │  │  │  │
 *   +2    │     │  │  │  │  │  +2
 *   ─────────────────────────────
 *   = 29  4     3  3  6  6  5  +2
 *   -# `R{1}` Reroll Exactly 1 · `!` Explode · `L` Drop Lowest 1 · `+2` Add
 *
 * The model is `timeline()` from `@randsum/ui/timeline`, the one the site draws,
 * so the two can never disagree about which die went where or what a row is
 * called: each row is labelled by the notation that made it, and the key
 * holds the words the site shows on hover.
 *
 * No colour: a code block has none that works everywhere, and colour on a
 * roll result means removal anyway. Structure carries the meaning instead. A
 * removed die's line is dashed (`╎`) down to the step that took it and it is
 * missing from Result; an explosion's dice are joined by plain arrows.
 */
import type { RollRecord } from '@randsum/roller'
import { timeline } from '@randsum/ui/timeline'
import type { Lane } from '@randsum/ui/timeline'

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
  const result = changed ? line(lastRow, lane => lane.final?.toString()) : undefined
  // Each row is labelled as on the site: by the notation that made it (`4d6`,
  // `R{1}`, `L`, `+2`), and the Result row by its total (`= 23`). The words
  // for each step, the site's hover, go in a key under the block.
  const labels = [...shown.map(r => r.notation), ...(changed ? [`= ${total}`] : [])]
  const gutterWidth = Math.max(...labels.map(l => l.length)) + GAP.length
  const mark = (text: string): string => text.padEnd(gutterWidth)
  const lines = [...grid, ...(result === undefined ? [] : [result])].map((text, row) =>
    `${mark(labels[row] ?? '')}${text}`.trimEnd()
  )
  // Every character of the widest line counts, gutter included: past the
  // limit a phone wraps the block and every column breaks.
  const blockWidth = Math.max(...lines.map(l => l.length))
  if (blockWidth > LANES_MAX_WIDTH) return undefined

  const key = (changed ? rows.slice(1) : []).map(r => `\`${r.notation}\` ${r.label}`).join('  ·  ')
  const body =
    result === undefined
      ? lines
      : [...lines.slice(0, -1), RULE.repeat(blockWidth), ...lines.slice(-1)]
  return ['```', ...body, '```', ...(key.length > 0 ? [`-# ${key}`] : [])]
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
