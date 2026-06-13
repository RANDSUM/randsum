import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { generateCode } from '../../../src/lib/codegen'
import type { GameRollResult, RandSumSpec } from '../../../src/lib/types'
import type { RollRecord } from '@randsum/roller'

/**
 * Compile a spec the way it actually ships — through codegen — and load the generated roll
 * function(s) for runtime assertions. This is the test counterpart to the old runtime
 * interpreter (loadSpec), which was removed so spec semantics live in exactly one place
 * (the code generator). Each spec feature is therefore verified against the real generated
 * output rather than a parallel interpreter.
 *
 * generateCode emits a module whose relative imports (`./types`, `./lib/errors`,
 * `./lib/lookupByRange`) are resolved from `packages/games/src/`. We rewrite them to absolute
 * paths and write the module to a temp file *inside the package* so `@randsum/roller` still
 * resolves via node_modules, then dynamically import it.
 */

const srcDir = fileURLToPath(new URL('../../../src/', import.meta.url))
const tmpDir = fileURLToPath(new URL('../../../.test-tmp/', import.meta.url))

const counter = { n: 0 }

export type CompiledRoll = (
  input?: unknown
) => GameRollResult<string | number, Readonly<Record<string, unknown>> | undefined, RollRecord>

export type CompiledGame = Readonly<Record<string, CompiledRoll>>

export async function compileSpec(spec: RandSumSpec): Promise<CompiledGame> {
  const generated = await generateCode(spec)
  const code = generated
    .replaceAll("from './types'", `from '${srcDir}types'`)
    .replaceAll("from './lib/errors'", `from '${srcDir}lib/errors'`)
    .replaceAll("from './lib/lookupByRange'", `from '${srcDir}lib/lookupByRange'`)

  mkdirSync(tmpDir, { recursive: true })
  counter.n += 1
  const file = `${tmpDir}spec-${counter.n}.ts`
  writeFileSync(file, code, 'utf-8')

  try {
    const mod = (await import(file)) as Record<string, unknown>
    const game: Record<string, CompiledRoll> = {}
    for (const [key, value] of Object.entries(mod)) {
      if (typeof value === 'function') game[key] = value as CompiledRoll
    }
    return game
  } finally {
    rmSync(file, { force: true })
  }
}
