import { bench, group, run } from 'mitata'
import { roll, validateNotation } from '../src'

const cases: readonly { readonly name: string; readonly fn: () => unknown }[] = [
  { name: 'roll(20)', fn: () => roll(20) },
  { name: 'roll("1d20")', fn: () => roll('1d20') },
  { name: 'roll({ sides: 20 })', fn: () => roll({ sides: 20 }) },
  { name: 'roll("4d6L")', fn: () => roll('4d6L') },
  { name: 'roll("2d20H")', fn: () => roll('2d20H') },
  { name: 'roll("4d6R{1}")', fn: () => roll('4d6R{1}') },
  { name: 'roll("10d6!")', fn: () => roll('10d6!') },
  // Large-pool cases exercise the linearized reroll/unique accumulators (X3).
  // Note: a unique pool requires quantity <= sides, so the audit's illustrative
  // "10000d20U" is invalid (would throw); we use a valid large unique pool.
  { name: 'roll("1000d6")', fn: () => roll('1000d6') },
  { name: 'roll("100d6R{<3}")', fn: () => roll('100d6R{<3}') },
  { name: 'roll("5000d10000U")', fn: () => roll('5000d10000U') },
  { name: 'validateNotation("2d6")', fn: () => validateNotation('2d6') },
  { name: 'validateNotation("4d6L+2d8H!+5")', fn: () => validateNotation('4d6L+2d8H!+5') }
]

const isCI = process.argv.includes('--json')

if (isCI) {
  // CI path — emit pure JSON in github-action-benchmark customSmallerIsBetter format.
  // Avoid mitata in JSON mode because its output format has drifted across versions and
  // its console chart is unconditional.
  const ITERATIONS = 50_000
  const WARMUP = 5_000

  const benchmarks = cases.map(({ name, fn }) => {
    // Benchmark hot path: counter loops avoid the array allocation that
    // Array.from would introduce inside the timed region. Lint exception only.
    // biome-ignore lint/plugin: hot-path counter loop; avoids Array.from allocation in the timed region
    for (let i = 0; i < WARMUP; i += 1) fn()
    const start = process.hrtime.bigint()
    // biome-ignore lint/plugin: hot-path counter loop; avoids Array.from allocation in the timed region
    for (let i = 0; i < ITERATIONS; i += 1) fn()
    const end = process.hrtime.bigint()
    const nsPerOp = Number(end - start) / ITERATIONS
    return { name, unit: 'ns', value: nsPerOp }
  })

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(benchmarks, null, 2))
} else {
  group('roll() - basic', () => {
    bench('roll(20)', () => roll(20))
    bench('roll("1d20")', () => roll('1d20'))
    bench('roll({ sides: 20 })', () => roll({ sides: 20 }))
  })

  group('roll() - with modifiers', () => {
    bench('roll("4d6L")', () => roll('4d6L'))
    bench('roll("2d20H")', () => roll('2d20H'))
    bench('roll("4d6R{1}")', () => roll('4d6R{1}'))
    bench('roll("10d6!")', () => roll('10d6!'))
  })

  group('roll() - large pools', () => {
    bench('roll("1000d6")', () => roll('1000d6'))
    bench('roll("100d6R{<3}")', () => roll('100d6R{<3}'))
    bench('roll("5000d10000U")', () => roll('5000d10000U'))
  })

  group('validateNotation()', () => {
    bench('simple notation', () => validateNotation('2d6'))
    bench('complex notation', () => validateNotation('4d6L+2d8H!+5'))
  })

  await run()
}
