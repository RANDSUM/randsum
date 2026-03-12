#!/usr/bin/env bun
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { build } from 'bunup'
import { format, resolveConfig } from 'prettier'

import { generateCode } from './codegen'
import { resolveExternalRefs } from './externalRefResolver'
import { validateSpec } from './validator'
import { SchemaError } from './errors'
import type { RandSumSpec } from './types'

function findSpecFile(cwd: string): string {
  const matches = readdirSync(cwd).filter(f => f.endsWith('.randsum.json'))
  if (matches.length === 0) {
    console.error(
      'No .randsum.json file found. Pass a path or run from a directory containing one.'
    )
    process.exit(1)
  }
  if (matches.length > 1) {
    console.error(
      `Multiple .randsum.json files found: ${matches.join(', ')}. Pass an explicit path.`
    )
    process.exit(1)
  }
  const [match] = matches
  if (match === undefined) process.exit(1)
  return match
}

const args = process.argv.slice(2)
const outFlagIdx = args.indexOf('--out')
const outDir: string | undefined = outFlagIdx !== -1 ? args[outFlagIdx + 1] : undefined
const positional = args.filter((_, i) => i !== outFlagIdx && i !== outFlagIdx + 1)
const [arg] = positional
const specPath = arg ?? findSpecFile(process.cwd())

async function resolveSpec(raw: RandSumSpec, path: string): Promise<RandSumSpec> {
  try {
    return await resolveExternalRefs(raw)
  } catch (e) {
    if (e instanceof SchemaError) {
      console.error(`FAIL  ${path}`)
      console.error(`      ${e.code}: ${e.message}`)
    } else {
      console.error(`FAIL  ${path}`)
      console.error(`      ${String(e)}`)
    }
    process.exit(1)
  }
}

async function writeFormatted(code: string, filepath: string): Promise<void> {
  const config = await resolveConfig(filepath)
  const formatted = await format(code, { ...(config ?? {}), parser: 'typescript' })
  writeFileSync(filepath, formatted, 'utf-8')
}

async function main(): Promise<void> {
  const absSpecPath = resolve(process.cwd(), specPath)
  const specDir = dirname(absSpecPath)
  const raw: unknown = JSON.parse(readFileSync(absSpecPath, 'utf-8'))

  const spec = await resolveSpec(raw as RandSumSpec, specPath)

  const validation = validateSpec(spec)
  if (!validation.valid) {
    console.error(`FAIL  ${specPath}`)
    for (const err of validation.errors) {
      console.error(`      ${err.path}: ${err.message}`)
    }
    process.exit(1)
  }

  const outputDir = outDir !== undefined ? resolve(process.cwd(), outDir) : specDir
  const entryFilename = `${spec.shortcode}.generated.ts`
  const entryFilepath = join(outputDir, entryFilename)

  mkdirSync(outputDir, { recursive: true })
  const code = await generateCode(spec)
  await writeFormatted(code, entryFilepath)

  if (outDir !== undefined) {
    // When --out is given, only codegen — skip the bunup build step
    return
  }

  await build(
    {
      entry: [entryFilename],
      format: ['esm', 'cjs'],
      dts: true,
      external: ['@randsum/gameSchema'],
      minify: true,
      target: 'node',
      sourcemap: 'external',
      clean: true
    },
    specDir
  )
}

main().catch((e: unknown) => {
  console.error(String(e))
  process.exit(1)
})
