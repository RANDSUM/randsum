#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { generateCode } from './codegen'
import { validateSpec } from './validator'
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

const [arg] = process.argv.slice(2)
const specPath = arg ?? findSpecFile(process.cwd())

const absSpecPath = resolve(process.cwd(), specPath)
const specDir = dirname(absSpecPath)
const raw: unknown = JSON.parse(readFileSync(absSpecPath, 'utf-8'))

const validation = validateSpec(raw)
if (!validation.valid) {
  console.error(`FAIL  ${specPath}`)
  for (const err of validation.errors) {
    console.error(`      ${err.path}: ${err.message}`)
  }
  process.exit(1)
}

const spec = raw as RandSumSpec
generateCode(spec, specDir)
const entryFilename = `${spec.shortcode}.ts`

const result = spawnSync(
  'bun',
  [
    'x',
    'bunup',
    entryFilename,
    '--format',
    'esm,cjs',
    '--dts',
    '--external',
    '@randsum/gameSchema',
    '--minify',
    '--target',
    'node',
    '--sourcemap',
    'external',
    '--clean'
  ],
  { stdio: 'inherit', cwd: specDir }
)

process.exit(result.status ?? 1)
