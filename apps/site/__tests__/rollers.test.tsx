import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, render } from '@testing-library/react'
import type { RandsumRoller } from '@randsum/ui/roller'
import { HeroRoller, LANDING_PRESETS } from '../src/components/rollers/HeroRoller'
import { ModifierRollerIsland } from '../src/components/rollers/ModifierRollerIsland'

afterEach(() => {
  cleanup()
})

// The rollers are <randsum-roller> elements: their markup is in a shadow root
async function mounted(container: HTMLElement): Promise<{
  readonly el: RandsumRoller
  readonly root: ShadowRoot
}> {
  const el = container.querySelector('randsum-roller')
  if (el === null) throw new Error('no <randsum-roller>')
  await act(async () => {
    await el.updateComplete
  })
  if (el.shadowRoot === null) throw new Error('no shadow root')
  return { el, root: el.shadowRoot }
}

function byText<E extends HTMLElement>(root: ParentNode, selector: string, text: string): E {
  const found = [...root.querySelectorAll<E>(selector)].find(e => e.textContent?.trim() === text)
  if (found === undefined) throw new Error(`no ${selector} reading ${text}`)
  return found
}

async function click(el: RandsumRoller, target: HTMLElement): Promise<void> {
  await act(async () => {
    target.click()
    await el.updateComplete
  })
}

const inputOf = (root: ShadowRoot): HTMLInputElement | null => root.querySelector('input')

describe('HeroRoller', () => {
  test('opens on a rolled result for the first preset, with the dice keys showing', async () => {
    const { root } = await mounted(render(<HeroRoller />).container)
    expect(inputOf(root)?.value).toBe('4d6L')
    expect(root.querySelector('.rsui-total')?.textContent?.trim()).toMatch(/^\d+$/)
    expect(root.querySelectorAll('.rsui-die[data-variant="removed"]')).toHaveLength(1)
    expect(byText(root, '[role="tab"]', 'Dice keys').getAttribute('aria-selected')).toBe('true')
    expect(byText(root, '.rsui-key', 'd20')).toBeDefined()
  })

  test('the landing presets sit behind the Presets switch, and each one rolls', async () => {
    const { el, root } = await mounted(render(<HeroRoller />).container)
    await click(el, byText(root, '[role="tab"]', 'Presets'))
    await click(el, byText(root, '.rsui-preset', 'Escalating'))
    expect(inputOf(root)?.value).toBe(LANDING_PRESETS[7]?.notation ?? '')
    const labels = [...root.querySelectorAll('.rsui-step-label')].map(e => e.textContent)
    expect(labels).toEqual(['1d4', '1d6', '1d8', '1d10', '1d12', '1d20'])
  })

  test('every landing preset is notation the roller accepts', async () => {
    const { el } = await mounted(render(<HeroRoller />).container)
    for (const preset of LANDING_PRESETS) {
      el.state.edit(preset.notation)
      expect(el.state.check.kind).toBe('valid')
    }
  })

  test('links to the app, with the StackBlitz action in the footer', async () => {
    const { container } = render(<HeroRoller />)
    const { root } = await mounted(container)
    expect(root.querySelector('.rsui-app-link')?.getAttribute('href')).toBe(
      'https://app.randsum.dev/'
    )
    expect(container.querySelector('[slot="footer"] .site-roller-action')).not.toBeNull()
  })
})

describe('ModifierRollerIsland', () => {
  test("shows the modifier's own keys, and its documented examples as Examples", async () => {
    const { el, root } = await mounted(
      render(<ModifierRollerIsland modifier="drop" defaultNotation="4d6" />).container
    )
    await click(el, byText(root, '.rsui-key', 'Drop high'))
    expect(inputOf(root)?.value).toBe('4d6H')
    await click(el, byText(root, '[role="tab"]', 'Examples'))
    expect(root.textContent).toContain('Roll 4d6, drop lowest (ability scores)')
  })
})
