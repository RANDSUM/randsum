import { describe, expect, test } from 'bun:test'
import { evaluate } from '../examples/randsum-roller/evaluate'
import { LEVELS } from '../src/levels'
import { badgeMarkdown, formatReport, judge, requestFor, runConformance } from '../src/runner'
import type { ConformanceFile, ConformanceVector } from '../src/types'
import file from '../vectors/v0.9.0.json'

const CONFORMANCE_FILE = file as ConformanceFile
const vector = (id: number): ConformanceVector => {
  const found = CONFORMANCE_FILE.vectors.find(v => v.id === id)
  if (found === undefined) throw new Error(`no vector ${id}`)
  return found
}

// The reference implementation must reach Level 4 (spec Section 11.5) through
// the same protocol any other implementation uses.
describe('@randsum/roller through the reference adapter', () => {
  test.each(CONFORMANCE_FILE.vectors.map(v => [v.id, v.notation, v] as const))(
    'vector %i: %s',
    (_, __, v) => {
      const outcome = judge(v, evaluate(requestFor(v)))
      expect(outcome.reason).toBeUndefined()
      expect(outcome.passed).toBe(true)
    }
  )

  test('reaches Level 4 (Full)', async () => {
    const report = await runConformance(CONFORMANCE_FILE, evaluate)
    expect(report.levels.map(l => l.failing)).toEqual([[], [], [], []])
    expect(report.highestLevel).toBe(4)
  })
})

describe('requestFor', () => {
  test('sends the notation and rolls, never the expectations', () => {
    const request = requestFor(vector(56))
    expect(Object.keys(request).sort()).toEqual(['explodeRolls', 'id', 'notation', 'seedRolls'])
  })

  test('an error vector sends only its notation', () => {
    expect(requestFor(vector(28))).toEqual({ id: 28, notation: '4d' })
  })
})

describe('judge', () => {
  test('an error vector passes on any error and fails on a result', () => {
    expect(judge(vector(28), { error: 'nope' }).passed).toBe(true)
    expect(judge(vector(28), { pool: [1], total: 1 }).passed).toBe(false)
  })

  test('a result vector fails on an error, a wrong pool or a wrong total', () => {
    expect(judge(vector(3), { pool: [3, 5, 2], total: 10 }).passed).toBe(true)
    expect(judge(vector(3), { error: 'nope' }).passed).toBe(false)
    expect(judge(vector(3), { pool: [5, 3, 2], total: 10 }).reason).toContain('expected pool')
    expect(judge(vector(3), { pool: [3, 5, 2], total: 11 }).reason).toContain('expected total')
  })

  test('an unseeded result is held to the vector’s unseeded checks', () => {
    expect(judge(vector(33), { pool: [2, 5, 3], total: 10, seeded: false })).toMatchObject({
      passed: true,
      unseeded: true
    })
    expect(judge(vector(33), { pool: [2, 2, 3], total: 7, seeded: false }).reason).toContain(
      'distinct'
    )
    expect(judge(vector(33), { pool: [2, 5, 3], total: 9, seeded: false }).reason).toContain('sum')
    expect(judge(vector(31), { pool: ['ice', 'mud'], seeded: false }).reason).toContain('mud')
  })

  test('seeded: false does not relax a vector without unseeded checks', () => {
    expect(judge(vector(3), { pool: [1, 1, 1], total: 3, seeded: false }).passed).toBe(false)
  })
})

describe('runConformance', () => {
  test('a level needs its own vectors, every lower level and every error case', async () => {
    const report = await runConformance(CONFORMANCE_FILE, () => ({ error: 'unsupported' }))
    expect(report.highestLevel).toBe(0)
    expect(report.levels[0]?.failing).toEqual(CONFORMANCE_FILE.conformanceLevels.level1_core)
  })

  test('a throwing adapter fails the vector, even an error vector', async () => {
    const report = await runConformance(CONFORMANCE_FILE, () => {
      throw new Error('crashed')
    })
    expect(report.outcomes.every(o => !o.passed)).toBe(true)
    expect(report.outcomes[0]?.reason).toContain('crashed')
  })

  test('Level 2 without Level 1 claims nothing', async () => {
    const report = await runConformance(CONFORMANCE_FILE, request =>
      request.id === 1 ? { pool: [0], total: 0 } : evaluate(request)
    )
    expect(report.highestLevel).toBe(0)
    expect(formatReport(report)).toContain('No level reached')
  })
})

describe('badges', () => {
  test('match the badges /spec/conformance/ serves', () => {
    expect(badgeMarkdown('0.9.0', 2)).toBe(
      '[![RDN 0.9.0 Level 2: VTT Baseline](https://randsum.dev/spec/badges/v0.9.0/level-2.svg)](https://randsum.dev/spec/#10-conformance-levels)'
    )
    expect(LEVELS.map(l => l.name)).toEqual(['Core', 'VTT Baseline', 'Extended', 'Full'])
  })
})
