#!/usr/bin/env bun
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { build } from 'bunup'
import { format, resolveConfig } from 'prettier'

import { generateCode, resolveExternalRefs, validateSpec } from '@randsum/gameSchema'
import type { RandSumSpec } from '@randsum/gameSchema'

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
      entry: entries,
      format: ['esm', 'cjs'],
      dts: true,
      external: ['@randsum/roller'],
      minify: true,
      sourcemap: 'external',
      clean: true
    },
    packageDir
  )
}

main().catch((e: unknown) => {
  console.error(String(e))
  process.exit(1)
})
