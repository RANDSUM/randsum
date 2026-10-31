import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PIPS, PRODUCT_LABELS, PRODUCTS } from '../src/utils/product'

// The family reads tech first, then the apps, the plugin and the paperwork.
// Every list of products follows this order, so none drifts from the rest.
const FAMILY = ['roller', 'games', 'ui', 'api', 'app', 'discord', 'plugin', 'spec'] as const

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file: string): string => fs.readFileSync(path.join(siteDir, file), 'utf-8')

describe('family order', () => {
  test('PRODUCTS', () => {
    expect(PRODUCTS.map(product => product.id)).toEqual([...FAMILY])
  })

  test('PRODUCT_LABELS and PIPS', () => {
    expect(Object.keys(PRODUCT_LABELS)).toEqual([...FAMILY])
    expect(Object.keys(PIPS)).toEqual([...FAMILY])
  })

  test('the --product-* tokens in theme.css', () => {
    const tokens = [...read('src/styles/theme.css').matchAll(/--product-([a-z]+):/g)].map(
      ([, id]) => id
    )
    expect(tokens).toEqual([...FAMILY])
  })

  test('the product sidebar topics in astro.config.mjs', () => {
    const topics = [...read('astro.config.mjs').matchAll(/^ {12}label: '([^']+)',$/gm)].map(
      ([, label]) => label
    )
    expect(topics).toEqual(['Start', 'Roller', 'Games', 'UI', 'API', 'Tools', 'Notation'])
  })

  test('every product has a social card', () => {
    const missing = FAMILY.filter(id => !fs.existsSync(path.join(siteDir, `public/og/${id}.png`)))
    expect(missing).toEqual([])
  })
})
