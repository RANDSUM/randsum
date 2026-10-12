import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/modifiers/definitions'

// The site's roller/modifiers "Application order" table is the one published
// copy of modifier execution order (the notation guide links to it). A second
// hand copy drifted in 8 rows, so this one is pinned to the registry.
const page = new URL('../../../../apps/site/src/content/docs/roller/modifiers.mdx', import.meta.url)
  .pathname

describe('site application order table', () => {
  test('lists every registered modifier, in order, with its priority', async () => {
    const text = await Bun.file(page).text()
    const section = text.split('## Application order')[1]?.split('\n## ')[0] ?? ''
    const rows = [...section.matchAll(/^\| (\d+) \|.*\| `(\w+)` \|$/gm)].map(
      ([, priority, name]) => `${priority} ${name}`
    )
    expect(rows).toEqual(RANDSUM_MODIFIERS.map(mod => `${mod.priority} ${mod.name}`))
  })
})
