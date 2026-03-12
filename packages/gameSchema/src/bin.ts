#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { validateSpec } from './validator'

function findSpecFiles(cwd: string): string[] {
  return readdirSync(cwd).filter(f => f.endsWith('.randsum.json'))
}

const args = process.argv.slice(2)
const files = args.length > 0 ? args : findSpecFiles(process.cwd())

if (files.length === 0) {
  console.error('No .randsum.json files found. Pass a path or run from a directory containing one.')
  process.exit(1)
}

const hasErrors = files
  .map(file => {
    try {
      const spec: unknown = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf-8'))
      const result = validateSpec(spec)
      if (result.valid) {
        process.stdout.write(`PASS  ${file}\n`)
        return false
      }
      console.error(`FAIL  ${file}`)
      for (const err of result.errors) {
        console.error(`      ${err.path}: ${err.message}`)
      }
      return true
    } catch (e) {
      console.error(`ERROR ${file}: ${e instanceof Error ? e.message : String(e)}`)
      return true
    }
  })
  .some(Boolean)

process.exit(hasErrors ? 1 : 0)
