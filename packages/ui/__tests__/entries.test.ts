import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pkg from '../package.json'

// Every file directly in src/, src/native/, src/react/ and src/vue/ is a
// public entry, one per element, component, wrapper or helper, the way lodash
// ships one module per function. src/internal/ is not.
const SRC = join(import.meta.dir, '..', 'src')
const entries = ['', 'native/', 'react/', 'vue/']
  .flatMap(dir =>
    readdirSync(join(SRC, dir))
      .filter(file => /\.ts$/.test(file))
      .map(file => `${dir}${file.replace(/\.ts$/, '')}`)
  )
  .sort()

describe('entries', () => {
  test('every src file has its own subpath export', () => {
    const exported = Object.keys(pkg.exports)
      .filter(key => key !== './package.json')
      .map(key => key.slice(2))
      .sort()
    expect(exported).toEqual(entries)
  })

  test('every src file is a build entry', () => {
    const config = readFileSync(join(import.meta.dir, '..', 'bunup.config.ts'), 'utf8')
    const built = [...config.matchAll(/'src\/([\w/-]+)\.ts'/g)].map(([, name]) => name).sort()
    expect(built).toEqual(entries)
  })

  // ssr runs on the server, where bundle size is not what is being guarded
  test('every browser entry has a size limit', () => {
    const limited = pkg['size-limit'].map(({ path }) => path.slice(5, -3)).sort()
    expect(limited).toEqual(entries.filter(entry => entry !== 'ssr'))
  })

  test('there is no root entry', () => {
    expect(Object.keys(pkg.exports)).not.toContain('.')
  })
})
