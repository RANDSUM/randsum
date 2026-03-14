#!/usr/bin/env bun
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { format, resolveConfig } from 'prettier'

import { generateCode, resolveExternalRefs, validateSpec } from './src/lib'
import type { RandSumSpec } from './src/lib'

const packageDir = import.meta.dirname
const srcDir = join(packageDir, 'src')
const checkMode = process.argv.includes('--check')

async function formatCode(code: string, filepath: string): Promise<string> {
  const config = await resolveConfig(filepath)
  return format(code, { ...(config ?? {}), parser: 'typescript' })
}

async function main(): Promise<void> {
  const specFiles = readdirSync(packageDir).filter(f => f.endsWith('.randsum.json'))

  if (specFiles.length === 0) {
    console.error('No .randsum.json files found in package root.')
    process.exit(1)
  }

  const stale: string[] = []

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
    const formatted = await formatCode(code, entryFilepath)

    if (checkMode) {
      const existing = existsSync(entryFilepath) ? readFileSync(entryFilepath, 'utf-8') : ''
      if (formatted !== existing) {
        stale.push(entryFilename)
        console.error(`  STALE: ${specFile} → src/${entryFilename}`)
      } else {
        console.log(`  OK: src/${entryFilename}`)
      }
    } else {
      writeFileSync(entryFilepath, formatted, 'utf-8')
      console.log(`  codegen: ${specFile} → src/${entryFilename}`)
    }
  }

  if (checkMode && stale.length > 0) {
    console.error(
      `\n${stale.length} generated file(s) are out of date. Run \`bun run codegen\` to update.`
    )
    process.exit(1)
  }
}

main().catch((e: unknown) => {
  console.error(String(e))
  process.exit(1)
})
