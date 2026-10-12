import { describe, expect, test } from 'bun:test'
import worker, { notationRedirectTarget } from '../worker/notation-redirect'

function target(path: string): string {
  return notationRedirectTarget(new URL(`https://notation.randsum.dev${path}`))
}

describe('notation.randsum.dev redirect', () => {
  test('spec pages move under /spec', () => {
    expect(target('/')).toBe('https://randsum.dev/spec/')
    expect(target('/v/0.9.0/')).toBe('https://randsum.dev/spec/v/0.9.0/')
    expect(target('/llms.txt')).toBe('https://randsum.dev/spec/llms.txt')
    expect(target('/llms-full.txt')).toBe('https://randsum.dev/spec/llms-full.txt')
  })

  test('conformance files keep the path their $id names', () => {
    expect(target('/conformance/v0.9.0.json')).toBe('https://randsum.dev/conformance/v0.9.0.json')
  })

  test('root files go to the site root, not a /spec 404', () => {
    expect(target('/robots.txt')).toBe('https://randsum.dev/robots.txt')
    expect(target('/favicon.ico')).toBe('https://randsum.dev/favicon.ico')
    expect(target('/sitemap-index.xml')).toBe('https://randsum.dev/sitemap-index.xml')
  })

  test('the query string survives', () => {
    expect(target('/v/0.9.0/?q=1#x')).toBe('https://randsum.dev/spec/v/0.9.0/?q=1')
  })

  test('the Worker answers every method with a 301', () => {
    const response = worker.fetch(
      new Request('https://notation.randsum.dev/v/0.9.0/', { method: 'POST' })
    )
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://randsum.dev/spec/v/0.9.0/')
  })
})
