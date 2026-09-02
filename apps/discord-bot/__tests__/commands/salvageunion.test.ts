import { describe, expect, test } from 'bun:test'
import { salvageUnionCommand } from '../../src/commands/salvageunion.js'
import { makeContext } from './lib/context.js'
import { textOf } from '../lib/view.js'

const view = salvageUnionCommand.buildView!(makeContext([]))

/** Link buttons carry a `url` and no `custom_id`, so they need no round trip. */
function linkButtons(): { label: string | undefined; url: string | undefined }[] {
  return view.flatMap(container =>
    container.toJSON().components.flatMap(component =>
      component.type === 1
        ? component.components.map(button => ({
            label: 'label' in button ? button.label : undefined,
            url: 'url' in button ? button.url : undefined
          }))
        : []
    )
  )
}

describe('salvageUnionCommand', () => {
  test('points at the SURef bot instead of rolling', () => {
    const text = textOf(view)
    expect(text).toContain('Salvage Union has moved')
    expect(text).toContain('SURef')
  })

  test('the call to action is a pair of link buttons, not links in a field', () => {
    // This is the one command whose whole purpose is a call to action, and it
    // spent it on markdown links buried in embed fields. A button is a tap
    // target, which is what matters on the phone where most invites happen.
    const buttons = linkButtons()
    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.url).toContain('discord.com/oauth2/authorize')
    expect(buttons[1]?.url).toBe('https://salvageunion.io/discord')
  })

  test('link buttons carry no custom_id, so they need no dispatcher branch', () => {
    for (const container of view) {
      for (const component of container.toJSON().components) {
        if (component.type !== 1) continue
        for (const button of component.components) {
          expect('custom_id' in button).toBe(false)
        }
      }
    }
  })
})
