import { describe, expect, test } from 'bun:test'
import '../src/roller'
import '../src/scope'
import '../src/notation-field'
import '../src/roll-button'
import '../src/readout'
import type { RandsumRoller } from '../src/roller'
import type { RollResult } from '../src/check'

async function mount<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Readonly<Record<string, string>> = {}
): Promise<HTMLElementTagNameMap[K]> {
  const el = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  if ('updateComplete' in el) await el.updateComplete
  return el
}

function shadow(el: Element): ShadowRoot {
  if (el.shadowRoot === null) throw new Error('no shadow root')
  return el.shadowRoot
}

function q<E extends Element = HTMLElement>(root: ParentNode, selector: string): E {
  const found = root.querySelector<E>(selector)
  if (found === null) throw new Error(`nothing matches ${selector}`)
  return found
}

describe('<randsum-roller>', () => {
  test('defaults to compact and renders the notation', async () => {
    const el = await mount('randsum-roller', { notation: '4d6L' })
    expect(el.size).toBe('compact')
    expect(q(shadow(el), '.rsui-compact')).toBeDefined()
    expect(q<HTMLInputElement>(shadow(el), 'input').value).toBe('4d6L')
  })

  test('the token overlay holds exactly the notation, so it lines up with the input', async () => {
    const el = await mount('randsum-roller', { notation: '4d6L+2' })
    expect(q(shadow(el), '.rsui-overlay').textContent).toBe('4d6L+2')
  })

  test.each(['mini', 'compact', 'max'] as const)('size=%s renders that layout', async size => {
    const el = await mount('randsum-roller', { size, notation: '1d20' })
    expect(q(shadow(el), `.rsui-${size}`)).toBeDefined()
  })

  test('switching size re-renders in place and keeps the notation', async () => {
    const el = await mount('randsum-roller', { size: 'mini', notation: '2d6' })
    el.size = 'max'
    await el.updateComplete
    expect(q(shadow(el), '.rsui-max')).toBeDefined()
    expect(q<HTMLInputElement>(shadow(el), 'input').value).toBe('2d6')
  })

  test('Roll fires randsum-roll with the result and shows the total', async () => {
    const el: RandsumRoller = await mount('randsum-roller', { notation: '3d6' })
    const results: RollResult[] = []
    el.addEventListener('randsum-roll', event => {
      if (event instanceof CustomEvent) results.push(event.detail)
    })
    q<HTMLButtonElement>(shadow(el), '.rsui-roll').click()
    await el.updateComplete
    expect(results).toHaveLength(1)
    const total = results[0]?.total ?? 0
    expect(total).toBeGreaterThanOrEqual(3)
    expect(q(shadow(el), '.rsui-total').textContent?.trim()).toBe(String(total))
  })

  test('typing fires randsum-change; setting notation does not', async () => {
    const el = await mount('randsum-roller', { notation: '1d6' })
    const changes: string[] = []
    el.addEventListener('randsum-change', event => {
      if (event instanceof CustomEvent) changes.push(event.detail.notation)
    })
    el.notation = '2d8'
    await el.updateComplete
    expect(changes).toEqual([])
    const input = q<HTMLInputElement>(shadow(el), 'input')
    input.value = '2d8+1'
    input.dispatchEvent(new Event('input'))
    await el.updateComplete
    expect(changes).toEqual(['2d8+1'])
  })

  test('a key edits the notation', async () => {
    const el = await mount('randsum-roller', { notation: '' })
    q<HTMLButtonElement>(shadow(el), '.rsui-key[data-kind="die"]').click()
    await el.updateComplete
    expect(el.state.notation).toBe('1d4')
  })

  test('invalid notation disables Roll and says why', async () => {
    const el = await mount('randsum-roller', { notation: '1d20L' })
    expect(q<HTMLButtonElement>(shadow(el), '.rsui-roll').disabled).toBe(true)
    expect(q(shadow(el), '.rsui-status').dataset['state']).toBe('invalid')
  })

  test('presets from a JSON attribute appear behind a tab and roll', async () => {
    const el = await mount('randsum-roller', {
      notation: '1d6',
      presets: JSON.stringify([{ label: 'Advantage', notation: '2d20H' }])
    })
    q<HTMLButtonElement>(shadow(el), '#tab-presets').click()
    await el.updateComplete
    q<HTMLButtonElement>(shadow(el), '.rsui-preset').click()
    await el.updateComplete
    expect(el.state.notation).toBe('2d20H')
    expect(el.state.result?.notation).toBe('2d20H')
  })

  test('max keeps history in storage', async () => {
    localStorage.removeItem('rsui-test')
    const el = await mount('randsum-roller', {
      size: 'max',
      notation: '1d4',
      'storage-key': 'rsui-test'
    })
    el.roll()
    await el.updateComplete
    expect(
      shadow(el).querySelectorAll('.rsui-recent > .rsui-history-list .rsui-history-item')
    ).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('rsui-test') ?? '[]')).toHaveLength(1)
  })

  test('mini opens the key pad and closes it on Escape', async () => {
    const el = await mount('randsum-roller', { size: 'mini' })
    q<HTMLButtonElement>(shadow(el), '.rsui-keys-toggle').click()
    await el.updateComplete
    expect(shadow(el).querySelector('.rsui-pop--keys')).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await el.updateComplete
    expect(shadow(el).querySelector('.rsui-pop--keys')).toBeNull()
  })

  test('the footer shows only with an app link or slotted content', async () => {
    const el = await mount('randsum-roller')
    expect(q(shadow(el), '.rsui-compact-footer').hidden).toBe(true)
    el.appLink = '/app'
    await el.updateComplete
    expect(q(shadow(el), '.rsui-compact-footer').hidden).toBe(false)
  })
})

describe('<randsum-scope>', () => {
  test('parts inside share one state', async () => {
    const scope = document.createElement('randsum-scope')
    scope.setAttribute('notation', '2d6+1')
    scope.innerHTML =
      '<randsum-notation-field></randsum-notation-field><randsum-roll-button></randsum-roll-button><randsum-readout></randsum-readout>'
    document.body.append(scope)
    await scope.updateComplete
    const field = q(scope, 'randsum-notation-field')
    const button = q(scope, 'randsum-roll-button')
    const out = q(scope, 'randsum-readout')
    for (const part of [field, button, out]) if ('updateComplete' in part) await part.updateComplete
    expect(q<HTMLInputElement>(shadow(field), 'input').value).toBe('2d6+1')
    const rolled: RollResult[] = []
    scope.addEventListener('randsum-roll', event => {
      if (event instanceof CustomEvent) rolled.push(event.detail)
    })
    q<HTMLButtonElement>(shadow(button), 'button').click()
    if ('updateComplete' in out) await out.updateComplete
    expect(rolled).toHaveLength(1)
    expect(q(shadow(out), '.rsui-total').textContent?.trim()).toBe(String(rolled[0]?.total))
  })
})
