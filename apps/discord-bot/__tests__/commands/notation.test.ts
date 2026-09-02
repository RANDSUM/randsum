import { describe, expect, test } from 'bun:test'
import { notationCommand } from '../../src/commands/notation.js'
import { NOTATION_SELECT_ID, buildNotationView } from '../../src/commands/lib/notationView.js'
import { makeContext } from './lib/context.js'
import { textOf } from '../lib/view.js'
import type { RollView } from '../../src/types.js'

function selectOptions(view: RollView): { label: string; default: boolean | undefined }[] {
  return view.flatMap(container =>
    container.toJSON().components.flatMap(component => {
      if (component.type !== 1) return []
      return component.components.flatMap(control =>
        control.type === 3 && control.custom_id === NOTATION_SELECT_ID
          ? control.options.map(option => ({ label: option.label, default: option.default }))
          : []
      )
    })
  )
}

describe('notationCommand', () => {
  const view = notationCommand.buildView!(makeContext([]))

  test('renders one container, with the selector inside it', () => {
    // Under embeds this was an embed plus a detached action row beneath. The
    // select menu nests inside a container, so the reference is one card.
    expect(view).toHaveLength(1)
    expect(selectOptions(view).length).toBeGreaterThan(1)
  })

  test('the current category is marked selected in the menu', () => {
    const chosen = selectOptions(view).filter(option => option.default === true)
    expect(chosen).toHaveLength(1)
  })

  test('links out to the notation site', () => {
    expect(textOf(view)).toContain('https://notation.randsum.dev')
  })

  test('a page says where it is in the sequence', () => {
    // Twelve categories with no counter and a placeholder reading "Select a
    // category" gave no sense of how much reference there was.
    expect(textOf(view)).toMatch(/Page \d+ of \d+/)
  })

  test("each category uses the notation site's own colour, not one flat gold", () => {
    // `NotationDoc.color` is a per-category identity the site already uses and
    // the embed renderer discarded, painting all twelve pages the same.
    const filter = buildNotationView('Filter')[0]?.toJSON().accent_color
    const scale = buildNotationView('Scale')[0]?.toJSON().accent_color
    expect(filter).toBeDefined()
    expect(filter).not.toBe(scale)
  })

  test('the page describes its own entries rather than calling them all modifiers', () => {
    // Every page used to read "**<category>** modifiers", including Core and
    // Special, which are dice *types*.
    expect(textOf(buildNotationView('Core'))).not.toContain('modifiers')
  })

  test('an unrecognised category falls back rather than rendering empty', () => {
    // A stale menu on an old message must not produce a blank reference page.
    expect(textOf(buildNotationView('NotACategory')).length).toBeGreaterThan(0)
  })

  test('renders the entries for the requested category', () => {
    const text = textOf(buildNotationView('Filter'))
    expect(text).toContain('## Filter')
    expect(text).toContain('Drop Lowest')
  })
})
