import { LEVELS, idsForLevel } from './levels'
import type { ConformanceFile, ConformanceVector } from './types'

/**
 * What the runner sends an implementation for one vector: the notation and the die
 * values to replay in place of its random number generator, in the order they are
 * consumed (`seedRolls`, then `rerollRolls`, `explodeRolls`, `compoundRolls`,
 * `penetrateRolls`, then `sequenceRolls`, each on its own sequence die).
 */
export interface VectorRequest {
  readonly id: number
  readonly notation: string
  readonly seedRolls?: readonly number[]
  readonly rerollRolls?: readonly number[]
  readonly explodeRolls?: readonly number[]
  readonly compoundRolls?: readonly number[]
  readonly penetrateRolls?: readonly number[]
  readonly sequenceRolls?: readonly number[]
}

/**
 * What an implementation answers. Either `error` (it rejected the notation), or the
 * final `pool` and `total`. Set `seeded: false` when it could not replay the request's
 * rolls (custom faces, draw dice) and rolled at random instead.
 */
export interface AdapterResponse {
  readonly id?: number
  readonly pool?: readonly (number | string)[]
  readonly total?: number | null
  readonly error?: string
  readonly seeded?: boolean
}

/** Evaluates one vector. The CLI's version talks to an adapter process over stdio. */
export type Evaluate = (request: VectorRequest) => Promise<AdapterResponse> | AdapterResponse

export interface VectorOutcome {
  readonly id: number
  readonly notation: string
  readonly passed: boolean
  /** True when the vector passed on the `unseeded` checks, not an exact replay. */
  readonly unseeded?: boolean
  readonly reason?: string
}

export interface LevelOutcome {
  readonly level: number
  readonly name: string
  readonly required: number
  readonly failing: readonly number[]
  readonly passed: boolean
}

export interface ConformanceReport {
  readonly specVersion: string
  readonly outcomes: readonly VectorOutcome[]
  readonly levels: readonly LevelOutcome[]
  /** The highest level whose every vector, and every error vector, passed. 0 for none. */
  readonly highestLevel: number
}

const ROLL_FIELDS = [
  'seedRolls',
  'rerollRolls',
  'explodeRolls',
  'compoundRolls',
  'penetrateRolls',
  'sequenceRolls'
] as const

/** The request for a vector: its id, notation and rolls, and nothing it expects. */
export function requestFor(vector: ConformanceVector): VectorRequest {
  const rolls = Object.fromEntries(
    ROLL_FIELDS.flatMap(field => {
      const values = vector[field]
      return values === undefined ? [] : [[field, values]]
    })
  )
  return { id: vector.id, notation: vector.notation, ...rolls }
}

const show = (value: unknown): string => JSON.stringify(value) ?? 'nothing'

function sameValues(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

/** Why a response fails its vector, or undefined when it passes. */
function failure(vector: ConformanceVector, response: AdapterResponse): string | undefined {
  if (vector.expectedError) {
    return typeof response.error === 'string'
      ? undefined
      : `expected an error, got pool ${show(response.pool)} total ${show(response.total)}`
  }
  if (typeof response.error === 'string') return `expected a result, got error: ${response.error}`
  if (!Array.isArray(response.pool)) return `expected a pool array, got ${show(response.pool)}`
  const pool: readonly unknown[] = response.pool
  const total = response.total ?? null
  const expectedPool = vector.expectedPool ?? null
  const expectedTotal = vector.expectedTotal ?? null

  if (response.seeded === false && vector.unseeded !== undefined) {
    const { faces, distinct } = vector.unseeded
    if (expectedPool !== null && pool.length !== expectedPool.length) {
      return `expected ${expectedPool.length} dice, got ${show(pool)}`
    }
    const stray = pool.find(value => !faces.includes(value as number | string))
    if (stray !== undefined) return `${show(stray)} is not one of the faces ${show(faces)}`
    if (distinct === true && new Set(pool).size !== pool.length) {
      return `expected distinct values, got ${show(pool)}`
    }
    if (typeof expectedTotal === 'number') {
      const sum = pool.reduce<number>((acc, value) => acc + Number(value), 0)
      if (total !== sum) return `expected the total to be the pool's sum ${sum}, got ${show(total)}`
    }
    return undefined
  }

  if (expectedPool !== null && !sameValues(pool, expectedPool)) {
    return `expected pool ${show(expectedPool)}, got ${show(pool)}`
  }
  if (total !== expectedTotal) return `expected total ${show(expectedTotal)}, got ${show(total)}`
  return undefined
}

/** Check one response against its vector. */
export function judge(vector: ConformanceVector, response: AdapterResponse): VectorOutcome {
  const reason = failure(vector, response)
  const unseeded =
    reason === undefined && response.seeded === false && vector.unseeded !== undefined
  return {
    id: vector.id,
    notation: vector.notation,
    passed: reason === undefined,
    ...(unseeded ? { unseeded: true } : {}),
    ...(reason === undefined ? {} : { reason })
  }
}

/** Score vector outcomes against the file's levels (Section 11.4). */
export function score(
  file: ConformanceFile,
  outcomes: readonly VectorOutcome[]
): ConformanceReport {
  const failed = new Set(outcomes.filter(o => !o.passed).map(o => o.id))
  const ran = new Set(outcomes.map(o => o.id))
  const errorIds = file.conformanceLevels.errorCases
  const levels = LEVELS.map(({ level, name }) => {
    const ids = [...idsForLevel(file.conformanceLevels, level), ...errorIds]
    const failing = ids.filter(id => failed.has(id) || !ran.has(id))
    return { level, name, required: ids.length, failing, passed: failing.length === 0 }
  })
  const highestLevel = levels.reduce(
    (highest, l) => (l.passed && highest === l.level - 1 ? l.level : highest),
    0
  )
  return { specVersion: file.specVersion, outcomes, levels, highestLevel }
}

/** Run every vector in `file` through `evaluate`, one at a time, and score the results. */
export async function runConformance(
  file: ConformanceFile,
  evaluate: Evaluate
): Promise<ConformanceReport> {
  const outcomes: VectorOutcome[] = []
  for (const vector of file.vectors) {
    const response = await Promise.resolve()
      .then(() => evaluate(requestFor(vector)))
      .catch(
        (error: unknown): AdapterResponse => ({
          error: `adapter failed: ${error instanceof Error ? error.message : String(error)}`
        })
      )
    const outcome =
      vector.expectedError && response.error?.startsWith('adapter failed:') === true
        ? { id: vector.id, notation: vector.notation, passed: false, reason: response.error }
        : judge(vector, response)
    outcomes.push(outcome)
  }
  return score(file, outcomes)
}

/** The Markdown badge for a level, as `/spec/conformance/` gives it. */
export function badgeMarkdown(specVersion: string, level: number): string {
  const name = LEVELS[level - 1]?.name
  if (name === undefined) throw new RangeError(`There is no conformance level ${level}`)
  const src = `https://randsum.dev/spec/badges/v${specVersion}/level-${level}.svg`
  const alt = `RDN ${specVersion} Level ${level}: ${name}`
  return `[![${alt}](${src})](https://randsum.dev/spec/#10-conformance-levels)`
}

/** A plain-text summary of a report. */
export function formatReport(report: ConformanceReport): string {
  const passedCount = report.outcomes.filter(o => o.passed).length
  const lines = [
    `RDN ${report.specVersion} conformance: ${passedCount}/${report.outcomes.length} vectors pass`,
    '',
    ...report.levels.map(l => {
      const label = `Level ${l.level} (${l.name})`.padEnd(24)
      return l.passed
        ? `  ${label} pass   ${l.required} vectors`
        : `  ${label} FAIL   ${l.failing.length} of ${l.required} failing`
    }),
    ''
  ]
  const top = LEVELS[report.highestLevel - 1]
  if (top === undefined) {
    lines.push('No level reached: Level 1 needs every Core vector and every error vector.')
  } else {
    lines.push(
      `RDN ${report.specVersion} Level ${top.level} (${top.name}) conformant.`,
      '',
      'Badge:',
      `  ${badgeMarkdown(report.specVersion, top.level)}`
    )
  }
  const failures = report.outcomes.filter(o => !o.passed)
  if (failures.length > 0) {
    lines.push('', 'Failing vectors:')
    for (const o of failures) lines.push(`  #${o.id} ${o.notation}: ${o.reason ?? 'failed'}`)
  }
  const relaxed = report.outcomes.filter(o => o.unseeded === true).map(o => `#${o.id}`)
  if (relaxed.length > 0) {
    lines.push('', `Passed without replaying the seed (Section 11.3): ${relaxed.join(', ')}`)
  }
  return `${lines.join('\n')}\n`
}
