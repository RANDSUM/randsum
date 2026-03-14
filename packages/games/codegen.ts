#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { format, resolveConfig } from 'prettier'

import { generateCode, resolveExternalRefs, validateSpec } from './src/lib'
import type { RandSumSpec } from './src/lib'

const packageDir = import.meta.dirname
const srcDir = join(packageDir, 'src')
const fixturesDir = join(packageDir, '__fixtures__')
const checkMode = process.argv.includes('--check')

async function formatCode(code: string, filepath: string): Promise<string> {
  const config = await resolveConfig(filepath)
  return format(code, { ...(config ?? {}), parser: 'typescript' })
}

function fixturePathFor(shortcode: string): string {
  return join(fixturesDir, `${shortcode}-tables.json`)
}

function getRemoteUrl(spec: RandSumSpec): string | undefined {
  const roll = spec.roll as Record<string, unknown> | undefined
  const resolve = roll?.resolve as Record<string, unknown> | undefined
  const rtl = resolve?.remoteTableLookup as Record<string, unknown> | undefined
  return typeof rtl?.url === 'string' ? rtl.url : undefined
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

    const remoteUrl = getRemoteUrl(spec)
    const remoteDataCache = new Map<string, readonly unknown[]>()

    if (remoteUrl && !checkMode) {
      const response = await fetch(remoteUrl)
      if (!response.ok) {
        console.error(`FAIL  fetch ${remoteUrl}: HTTP ${String(response.status)}`)
        process.exit(1)
      }
      const data = (await response.json()) as readonly unknown[]
      remoteDataCache.set(remoteUrl, data)

      mkdirSync(fixturesDir, { recursive: true })
      writeFileSync(fixturePathFor(spec.shortcode), JSON.stringify(data, null, 2) + '\n', 'utf-8')
      console.log(`  fixture: __fixtures__/${spec.shortcode}-tables.json`)
    } else if (remoteUrl && checkMode) {
      const fixturePath = fixturePathFor(spec.shortcode)
      if (!existsSync(fixturePath)) {
        console.error(
          `FAIL  missing fixture ${fixturePath}. Run \`bun run codegen\` to generate it.`
        )
        process.exit(1)
      }
      const data = JSON.parse(readFileSync(fixturePath, 'utf-8')) as readonly unknown[]
      remoteDataCache.set(remoteUrl, data)
    }

    const entryFilename = `${spec.shortcode}.generated.ts`
    const entryFilepath = join(srcDir, entryFilename)

    const code = await generateCode(spec, { remoteDataCache })
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
