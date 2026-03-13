#!/usr/bin/env bun
import { chmodSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { build } from 'bunup'
import { format, resolveConfig } from 'prettier'

import { generateCode, resolveExternalRefs, validateSpec } from './src/lib'
import type { RandSumSpec } from './src/lib/types'

const packageDir = import.meta.dirname
const srcDir = join(packageDir, 'src')

async function writeFormatted(code: string, filepath: string): Promise<void> {
  const config = await resolveConfig(filepath)
  const formatted = await format(code, { ...(config ?? {}), parser: 'typescript' })
  writeFileSync(filepath, formatted, 'utf-8')
}

async function main(): Promise<void> {
  const specFiles = readdirSync(packageDir).filter(f => f.endsWith('.randsum.json'))

  if (specFiles.length === 0) {
    console.error('No .randsum.json files found in package root.')
    process.exit(1)
  }

  const entries: string[] = []

  for (const specFile of specFiles) {
    const absPath = join(packageDir, specFile)
    const raw: unknown = JSON.parse(readFileSync(absPath, 'utf-8'))
    const spec = await resolveExternalRefs(raw as RandSumSpec)

    const validation = validateSpec(spec)
    if (!validation.valid) {
      console.error(`FAIL  ${specFile}`)
      for (const err of validation.errors) {
        console.error(`      ${err.path}: ${err.message}`)
      }
      process.exit(1)
    }

    const entryFilename = `${spec.shortcode}.generated.ts`
    const entryFilepath = join(srcDir, entryFilename)

    const code = await generateCode(spec)
    await writeFormatted(code, entryFilepath)
    entries.push(`src/${entryFilename}`)
    console.log(`  codegen: ${specFile} → src/${entryFilename}`)
  }

  if (process.argv.includes('--codegen-only')) {
    console.log('Codegen complete (--codegen-only).')
    return
  }

  await build(
    {
      entry: [...entries, 'src/index.ts'],
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

  // Build schema barrel — uses packages:"bundle" so that ./lib/* deps
  // (including ajv from devDependencies) are bundled inline rather than
  // treated as external.
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

  // Build bin tools
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
