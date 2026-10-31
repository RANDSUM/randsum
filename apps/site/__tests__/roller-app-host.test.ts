import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const site = join(import.meta.dir, '..')
const read = (path: string): string => readFileSync(join(site, path), 'utf8')

interface Manifest {
  id: string
  start_url: string
  scope: string
  icons: { src: string }[]
}

describe('app.randsum.dev', () => {
  test('the manifest claims the whole app host', () => {
    const manifest = JSON.parse(read('app-public/manifest.webmanifest')) as Manifest
    expect(manifest.id).toBe('/')
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/app/')).toBe(false)
      expect(existsSync(join(site, 'app-public', icon.src))).toBe(true)
    }
  })

  test('the shell and its worker name root paths, not /app/', () => {
    const shell = read('src/pages/app-shell/index.astro')
    expect(shell).toContain(".register('/sw.js', { scope: '/' })")
    expect(shell).toContain('href="/manifest.webmanifest"')
    expect(read('app-public/sw.js')).not.toContain("'/app/")
  })

  test('the Worker serves dist-app on app.randsum.dev', () => {
    const config = read('wrangler.app.jsonc')
    expect(config).toContain('"directory": "./dist-app"')
    expect(config).toContain('"pattern": "app.randsum.dev"')
  })
})

describe('randsum.dev/app/', () => {
  test('is no longer installable', () => {
    expect(existsSync(join(site, 'public/app/manifest.webmanifest'))).toBe(false)
  })

  test('retires the worker old installs registered', () => {
    const retire = read('public/app/sw.js')
    expect(retire).toContain('registration.unregister()')
    expect(retire).toContain("key.startsWith('randsum-app-')")
  })
})
