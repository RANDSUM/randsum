import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pkg from '../package.json'

// Every file directly in src/ is a public entry, one per component or helper,
// the way lodash ships one module per function. src/internal/ is not.
const SRC = join(import.meta.dir, '..', 'src')
const entries = readdirSync(SRC)
  .filter(file => /\.tsx?$/.test(file))
  .map(file => file.replace(/\.tsx?$/, ''))
  .sort()

describe('entries', () => {
  test('every src file has its own subpath export', () => {
    const exported = Object.keys(pkg.exports)
      .filter(key => key !== './styles.css' && key !== './package.json')
      .map(key => key.slice(2))
      .sort()
    expect(exported).toEqual(entries)
  })

  test('every src file is a build entry', () => {
    const config = readFileSync(join(import.meta.dir, '..', 'bunup.config.ts'), 'utf8')
    const built = [...config.matchAll(/'src\/([\w-]+)\.tsx?'/g)].map(([, name]) => name).sort()
    expect(built).toEqual(entries)
  })

  test('every entry has a size limit', () => {
    const limited = pkg['size-limit'].map(({ path }) => path.slice(5, -3)).sort()
    expect(limited).toEqual(entries)
  })

  test('there is no root entry', () => {
    expect(Object.keys(pkg.exports)).not.toContain('.')
  })
})
