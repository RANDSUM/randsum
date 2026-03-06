/**
 * Type-level regression test against the BUILD ARTIFACT (dist/index.d.ts).
 *
 * Unlike roll.types.test.ts (which imports from src), this file imports from
 * the compiled dist. If the dist is stale or DiceNotation reverts to a branded
 * type, this file will fail `tsc --noEmit`, catching regressions before publish.
 *
 * Run `bun run build` first, then `bun run typecheck`.
 */
import { roll } from '../../dist/index.js'

// Plain string literals must be accepted directly — no isDiceNotation() guard needed
roll('1d6')
roll('4d6L')
roll('2d20H')
roll('1d8+3')
roll('10d6!')
roll('3d6R{<3}')
roll('1d20', '2d6')
// Uppercase D must also be accepted
roll('4D6')
roll('2D20')
