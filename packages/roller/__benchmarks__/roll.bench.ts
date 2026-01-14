import { bench, group, run } from 'mitata'
import { roll, validateNotation } from '../src'

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

group('validateNotation()', () => {
  bench('simple notation', () => validateNotation('2d6'))
  bench('complex notation', () => validateNotation('4d6L+2d8H!+5'))
})

const isCI = process.argv.includes('--json')

if (isCI) {
  const results = await run({ silent: true, json: true })
  const benchmarks = results.benchmarks.map((b: { name: string; time: number }) => ({
    name: b.name,
    unit: 'ns',
    value: b.time
  }))
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(benchmarks, null, 2))
} else {
  await run()
}
