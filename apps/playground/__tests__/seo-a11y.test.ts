/**
 * Tests for SEO meta tags and ARIA accessibility attributes.
 *
 * These tests verify static markup correctness by reading source files directly.
 * bun:test cannot resolve react/jsx-dev-runtime, so React components cannot be
 * rendered. Instead we verify that the required attributes are present in the
 * component source — which is deterministic for static string attributes.
 *
 * For index.astro we verify meta tag content directly in the Astro template source.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

const PLAYGROUND_ROOT = join(import.meta.dir, '..')

function readSource(relativePath: string): string {
  return readFileSync(join(PLAYGROUND_ROOT, relativePath), 'utf-8')
}

describe('SEO meta tags (index.astro)', () => {
  const astro = readSource('src/pages/index.astro')

  test('has meta description', () => {
    expect(astro).toContain(
      'name="description" content="Interactive playground for RANDSUM dice notation. Type notation, roll dice, explore modifiers step-by-step."'
    )
  })

  test('has og:title', () => {
    expect(astro).toContain('property="og:title"')
    expect(astro).toContain('RANDSUM — Dice Notation Playground')
  })

  test('has og:description', () => {
    expect(astro).toContain('property="og:description"')
    expect(astro).toContain(
      'Interactive playground for RANDSUM dice notation. Type notation, roll dice, explore modifiers step-by-step.'
    )
  })

  test('has og:type set to website', () => {
    expect(astro).toContain('property="og:type" content="website"')
  })

  test('has og:url set to https://playground.randsum.dev', () => {
    expect(astro).toContain('property="og:url" content="https://playground.randsum.dev"')
  })

  test('has og:site_name set to RANDSUM', () => {
    expect(astro).toContain('property="og:site_name" content="RANDSUM"')
  })

  test('page title is RANDSUM — Dice Notation Playground', () => {
    expect(astro).toContain('<title>RANDSUM — Dice Notation Playground</title>')
  })
})

describe('ARIA: result overlay (PlaygroundApp.tsx)', () => {
  const app = readSource('src/components/PlaygroundApp.tsx')

  test('qrg-overlay-panel has role="status"', () => {
    expect(app).toContain('role="status"')
  })

  test('qrg-overlay-panel has aria-live="polite"', () => {
    expect(app).toContain('aria-live="polite"')
  })

  test('role and aria-live appear on the same element as qrg-overlay-panel', () => {
    // Both attributes should appear within a few lines of the overlay panel class
    const overlayIdx = app.indexOf('qrg-overlay-panel')
    expect(overlayIdx).toBeGreaterThan(-1)

    // Search within a 200-character window around the overlay panel class
    const window = app.slice(Math.max(0, overlayIdx - 50), overlayIdx + 200)
    expect(window).toContain('role="status"')
    expect(window).toContain('aria-live="polite"')
  })
})

describe('ARIA: header nav (PlaygroundHeader.tsx)', () => {
  const header = readSource('src/components/PlaygroundHeader.tsx')

  test('nav element has aria-label="Playground tools"', () => {
    expect(header).toContain('aria-label="Playground tools"')
  })

  test('aria-label appears on the nav element', () => {
    // Verify the aria-label is on the <nav tag, not some other element
    const navIdx = header.indexOf('<nav')
    expect(navIdx).toBeGreaterThan(-1)

    // The aria-label should appear within the opening nav tag (before the closing >)
    const navTagEnd = header.indexOf('>', navIdx)
    const navTag = header.slice(navIdx, navTagEnd + 1)
    expect(navTag).toContain('aria-label="Playground tools"')
  })
})
