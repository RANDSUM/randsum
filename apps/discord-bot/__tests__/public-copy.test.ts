/**
 * Holds the bot's public pages to the command barrel.
 *
 * `/fate` shipped and was registered, but neither the bot's landing page nor
 * its docs page listed it. Every page also kept selling "embeds" after the bot moved
 * to Components V2, which forbids them. Nothing failed, because nothing read the
 * pages against the code. This does: every registered command must appear on
 * each page, and the pages may not promise embeds.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { commands } from '../src/commands/index.js'

const appDir = resolve(import.meta.dirname, '..')
const siteDir = resolve(appDir, '../site/src')

const pages: Readonly<Record<string, string>> = {
  'site: tools/discord-bot.mdx': resolve(siteDir, 'content/docs/tools/discord-bot.mdx'),
  'LISTING.md': resolve(appDir, 'LISTING.md'),
  'README.md': resolve(appDir, 'README.md')
}

// README.md is contributor documentation and names the Discord "Embed Links"
// permission, so only the user-facing pages are held to the no-embeds rule.
const userFacing = ['site: tools/discord-bot.mdx', 'LISTING.md']

const names = commands.map(command => command.data.name)

// `/root` must not be satisfied by a URL such as `/games/root-rpg/`.
function mentions(text: string, name: string): boolean {
  return new RegExp(`(?<![\\w/])/${name}(?![\\w/-])`).test(text)
}

describe('bot public pages', () => {
  test('the barrel is not empty', () => {
    expect(names.length).toBeGreaterThan(0)
  })

  for (const [page, path] of Object.entries(pages)) {
    const text = readFileSync(path, 'utf8')

    test(`${page} lists every registered command`, () => {
      const missing = names.filter(name => !mentions(text, name))
      expect(missing).toEqual([])
    })

    if (userFacing.includes(page)) {
      test(`${page} does not promise embeds`, () => {
        expect(text).not.toMatch(/embed/i)
      })
    }
  }
})
