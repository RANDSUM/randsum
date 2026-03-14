#!/usr/bin/env bun
import { chmodSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { build } from 'bunup'

const packageDir = import.meta.dirname

async function main(): Promise<void> {
  const generatedEntries = readdirSync(join(packageDir, 'src'))
    .filter(f => f.endsWith('.generated.ts'))
    .map(f => `src/${f}`)

  await build(
    {
      entry: [...generatedEntries, 'src/index.ts'],
      format: ['esm', 'cjs'],
      dts: true,
      external: ['@randsum/roller'],
      splitting: false,
      minify: true,
      sourcemap: 'external',
      clean: true
    },
    packageDir
  )

  await build(
    {
      entry: ['src/schema.ts'],
      format: ['esm', 'cjs'],
      dts: true,
      external: ['@randsum/roller'],
      packages: 'bundle',
      minify: true,
      sourcemap: 'external',
      target: 'node',
      clean: false
    },
    packageDir
  )

  await build(
    {
      entry: ['src/lib/bin.ts'],
      format: ['esm', 'cjs'],
      dts: false,
      external: ['@randsum/roller'],
      minify: true,
      target: 'node',
      clean: false
    },
    packageDir
  )

  await build(
    {
      entry: ['src/lib/bin-build.ts'],
      format: ['esm', 'cjs'],
      dts: false,
      external: ['@randsum/roller', 'bunup', 'prettier'],
      minify: true,
      target: 'node',
      clean: false
    },
    packageDir
  )

  chmodSync(join(packageDir, 'dist/bin.cjs'), 0o755)
  chmodSync(join(packageDir, 'dist/bin-build.js'), 0o755)
}

main().catch((e: unknown) => {
  console.error(String(e))
  process.exit(1)
})
