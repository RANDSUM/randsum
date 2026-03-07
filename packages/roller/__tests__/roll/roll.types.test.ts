/**
 * Type-level regression test for roll() accepting plain notation strings.
 *
 * These assignments must compile without TypeScript errors.
 * If DiceNotation reverts to a branded type, this file will fail tsc --noEmit,
 * catching the regression before it ships.
 */
import { roll } from '../../src/roll'

// Plain string literals must be accepted directly — no isDiceNotation() guard needed
roll('1d6')
roll('4d6L')
roll('2d20H')
roll('1d8+3')
roll('10d6!')
roll('3d6R{<3}')
roll('1d20', '2d6')
