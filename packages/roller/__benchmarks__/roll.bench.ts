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

// Large-pool cases exercise the linearized reroll/unique accumulators.
// A unique pool requires quantity <= sides, hence 5000d10000U.
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
