import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, render } from '@testing-library/react'
import { useState } from 'react'
import type { RollResult } from '../src/check'
import { NotationField } from '../src/react/notation-field'
import { Readout } from '../src/react/readout'
import { RollButton } from '../src/react/roll-button'
import { Roller } from '../src/react/roller'
import { useRoller } from '../src/react/use-roller'
import type { RandsumRoller } from '../src/roller'

afterEach(cleanup)

const signalRolls: RollResult[] = []
const seen: string[] = []

function Host(): React.JSX.Element {
  const [state, setState] = useState({ notation: '1d4', signal: 0 })
  return (
    <>
      <button type="button" onClick={() => setState({ notation: '2d6', signal: 1 })}>
        next
      </button>
      <Roller
        notation={state.notation}
        rollSignal={state.signal}
        onRoll={r => signalRolls.push(r)}
      />
    </>
  )
}

function Parts(): React.JSX.Element {
  const roller = useRoller({ defaultNotation: '2d6+1' })
  seen.push(roller.result === null ? 'none' : 'rolled')
  return (
    <div>
      <NotationField roller={roller} />
      <RollButton roller={roller} />
      <Readout roller={roller} />
    </div>
  )
}

function rollerIn(container: HTMLElement): RandsumRoller {
  const el = container.querySelector('randsum-roller')
  if (el === null) throw new Error('no roller')
  return el
}

async function settle(el: Element): Promise<void> {
  await act(async () => {
    if ('updateComplete' in el) await el.updateComplete
  })
}

function shadowQuery<E extends Element = HTMLElement>(el: Element, selector: string): E {
  const found = el.shadowRoot?.querySelector<E>(selector)
  if (found === null || found === undefined) throw new Error(`nothing matches ${selector}`)
  return found
}

describe('React <Roller>', () => {
  test('renders the element with its size and sets properties', async () => {
    const presets = [{ label: 'Adv', notation: '2d20H' }]
    const { container } = render(<Roller size="mini" defaultNotation="4d6L" presets={presets} />)
    const el = rollerIn(container)
    await settle(el)
    expect(el.getAttribute('size')).toBe('mini')
    expect(el.presets).toBe(presets)
    expect(el.state.notation).toBe('4d6L')
  })

  test('onRoll and onChange receive the element events', async () => {
    const rolls: RollResult[] = []
    const changes: string[] = []
    const { container } = render(
      <Roller defaultNotation="1d6" onRoll={r => rolls.push(r)} onChange={n => changes.push(n)} />
    )
    const el = rollerIn(container)
    await settle(el)
    await act(async () => {
      shadowQuery<HTMLButtonElement>(el, '.rsui-key[data-kind="die"]').click()
    })
    await act(async () => {
      el.roll()
    })
    expect(changes).toEqual(['1d6+1d4'])
    expect(rolls).toHaveLength(1)
  })

  test('a new rollSignal rolls the new notation', async () => {
    signalRolls.length = 0
    const rolls = signalRolls
    const { container, getByText } = render(<Host />)
    await settle(rollerIn(container))
    expect(rolls.map(r => r.notation)).toEqual(['1d4'])
    await act(async () => {
      getByText('next').click()
    })
    expect(rolls.map(r => r.notation)).toEqual(['1d4', '2d6'])
  })

  test('footer content is slotted', async () => {
    const { container } = render(<Roller footer={<span>extra</span>} />)
    const slotted = container.querySelector('[slot="footer"]')
    expect(slotted?.textContent).toBe('extra')
  })
})

describe('React parts with useRoller', () => {
  test('share one state', async () => {
    seen.length = 0
    const { container } = render(<Parts />)
    const button = container.querySelector('randsum-roll-button')
    const out = container.querySelector('randsum-readout')
    if (button === null || out === null) throw new Error('parts missing')
    await settle(button)
    await settle(out)
    await act(async () => {
      shadowQuery<HTMLButtonElement>(button, 'button').click()
    })
    await settle(out)
    expect(shadowQuery(out, '.rsui-total').textContent?.trim()).toMatch(/^\d+$/)
    expect(seen.at(-1)).toBe('rolled')
  })
})
