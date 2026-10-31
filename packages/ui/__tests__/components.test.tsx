import type React from 'react'
import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RollerCompact } from '../src/roller-compact'
import { RollerMax } from '../src/roller-max'
import { RollerMini } from '../src/roller-mini'
import { modifierKeys } from '../src/keys'
import { modifierPresets } from '../src/presets'
import { NotationField } from '../src/notation-field'
import { Readout } from '../src/readout'
import { RollButton } from '../src/roll-button'
import { useRoller } from '../src/use-roller'
import type { RollResult } from '../src/check'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const input = (): HTMLInputElement => screen.getByLabelText<HTMLInputElement>('Dice notation')
const rollButton = (): HTMLButtonElement =>
  screen.getByRole<HTMLButtonElement>('button', { name: 'Roll' })

describe('shared anatomy', () => {
  for (const [name, Roller] of [
    ['RollerMini', RollerMini],
    ['RollerCompact', RollerCompact],
    ['RollerMax', RollerMax]
  ] as const) {
    test(`${name}: empty, then valid, then invalid, then rolled`, () => {
      const rolls: RollResult[] = []
      render(
        <Roller
          onRoll={result => {
            rolls.push(result)
          }}
        />
      )
      expect(rollButton().disabled).toBe(true)

      fireEvent.change(input(), { target: { value: '4d6Lq' } })
      expect(rollButton().disabled).toBe(true)
      expect(screen.getByText('Can’t read “q” at character 5.')).toBeDefined()
      expect(document.querySelector('.rsui-tok--bad')?.textContent).toBe('q')

      fireEvent.change(input(), { target: { value: '4d6L' } })
      expect(rollButton().disabled).toBe(false)

      fireEvent.click(rollButton())
      expect(rolls).toHaveLength(1)
      expect(rolls[0]?.notation).toBe('4d6L')
      const total = String(rolls[0]?.total)
      expect(screen.getAllByLabelText(`Total ${total}`).length).toBeGreaterThan(0)
    })

    test(`${name}: Enter rolls`, () => {
      const rolls: RollResult[] = []
      render(<Roller defaultNotation="1d20" onRoll={r => rolls.push(r)} />)
      fireEvent.keyDown(input(), { key: 'Enter' })
      expect(rolls).toHaveLength(1)
    })

    test(`${name}: a new rollSignal rolls the current notation`, () => {
      const rolls: RollResult[] = []
      const { rerender } = render(
        <Roller notation="2d6" rollSignal={1} onRoll={r => rolls.push(r)} />
      )
      expect(rolls).toHaveLength(1)
      rerender(<Roller notation="3d6" rollSignal={1} onRoll={r => rolls.push(r)} />)
      expect(rolls).toHaveLength(1)
      rerender(<Roller notation="3d6" rollSignal={2} onRoll={r => rolls.push(r)} />)
      expect(rolls.map(r => r.notation)).toEqual(['2d6', '3d6'])
    })
  }
})

describe('RollerCompact', () => {
  test('shows only the dice keys when it has no presets', () => {
    render(<RollerCompact />)
    expect(screen.queryByRole('tablist')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'd20' }))
    fireEvent.click(screen.getByRole('button', { name: 'd20' }))
    fireEvent.click(screen.getByRole('button', { name: 'Drop low' }))
    expect(input().value).toBe('2d20L')
  })

  test('puts presets behind a switch, keys first, and a preset rolls', () => {
    const rolls: RollResult[] = []
    render(
      <RollerCompact
        presets={[{ label: 'Advantage', notation: '2d20H' }]}
        onRoll={r => rolls.push(r)}
      />
    )
    const [keysTab, presetsTab] = screen.getAllByRole('tab')
    expect(keysTab?.getAttribute('aria-selected')).toBe('true')
    expect(screen.queryByRole('button', { name: 'Advantage' })).toBeNull()
    if (presetsTab) fireEvent.click(presetsTab)
    fireEvent.click(screen.getByRole('button', { name: 'Advantage' }))
    expect(input().value).toBe('2d20H')
    expect(rolls.map(r => r.notation)).toEqual(['2d20H'])
  })

  test("takes a modifier's canonical keys and presets", () => {
    render(
      <RollerCompact
        defaultNotation="3d6"
        keys={modifierKeys('explode')}
        presets={modifierPresets('explode')}
        presetsLabel="Examples"
        presetsLayout="list"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Explode' }))
    expect(input().value).toBe('3d6!')
    fireEvent.click(screen.getByRole('tab', { name: 'Examples' }))
    expect(screen.getByText('Roll 3d10; explode on 8 or higher')).toBeDefined()
  })

  test('renders the app link and footer only when given', () => {
    const { rerender } = render(<RollerCompact />)
    expect(document.querySelector('.rsui-compact-footer')).toBeNull()
    rerender(<RollerCompact appLink="https://app.randsum.dev/" footer={<span>extra</span>} />)
    expect(screen.getByRole('link', { name: 'Open the full app →' }).getAttribute('href')).toBe(
      'https://app.randsum.dev/'
    )
    expect(screen.getByText('extra')).toBeDefined()
  })

  test('carries its orientation for the stylesheet', () => {
    render(<RollerCompact orientation="portrait" />)
    expect(document.querySelector('.rsui-compact')?.getAttribute('data-orientation')).toBe(
      'portrait'
    )
  })
})

describe('RollerMini', () => {
  test('the dice-keys button opens a key pad with any presets, and Escape closes it', () => {
    render(<RollerMini presets={[{ label: 'Advantage', notation: '2d20H' }]} />)
    const toggle = screen.getByRole('button', { name: 'Dice keys' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'd6' }))
    expect(input().value).toBe('1d6')
    expect(screen.getByRole('button', { name: 'Advantage' })).toBeDefined()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  test('Roll carries the English description as its tooltip', () => {
    render(<RollerMini defaultNotation="4d6L+2" />)
    const tip = screen.getByRole('tooltip')
    expect(tip.textContent).toBe('Roll 4 6-sided dice, Drop lowest, Add 2')
    expect(rollButton().getAttribute('aria-describedby')).toBe(tip.id)
  })

  test('after a roll the total sits beside Roll with its dice', () => {
    render(<RollerMini defaultNotation="2d6" />)
    fireEvent.click(rollButton())
    const total = document.querySelector('.rsui-mini-total')
    expect(total).not.toBeNull()
    expect(document.querySelectorAll('.rsui-pop--detail .rsui-die').length).toBe(2)
  })
})

describe('RollerMax', () => {
  test('keeps recent rolls, persists them, and rolls one again', () => {
    const rolls: RollResult[] = []
    render(
      <RollerMax defaultNotation="1d20" storageKey="test-history" onRoll={r => rolls.push(r)} />
    )
    fireEvent.click(rollButton())
    fireEvent.change(input(), { target: { value: '2d6' } })
    fireEvent.click(rollButton())
    const stored: unknown = JSON.parse(localStorage.getItem('test-history') ?? '[]')
    expect(Array.isArray(stored) ? stored.length : 0).toBe(2)
    const again = screen.getAllByRole('button', { name: /Roll 1d20 again/ })[0]
    if (again) fireEvent.click(again)
    expect(input().value).toBe('1d20')
    expect(rolls.map(r => r.notation)).toEqual(['1d20', '2d6', '1d20'])
  })

  test('loads stored history and can go without it', () => {
    localStorage.setItem(
      'test-history',
      JSON.stringify([
        { id: 1, notation: '3d6', total: 11, description: 'Roll 3 6-sided dice' },
        { bad: true }
      ])
    )
    const { unmount } = render(<RollerMax storageKey="test-history" />)
    expect(screen.getAllByRole('button', { name: /Roll 3d6 again/ }).length).toBeGreaterThan(0)
    unmount()
    render(<RollerMax history={false} />)
    expect(screen.queryByText('Recent')).toBeNull()
  })
})

function MyRoller(): React.JSX.Element {
  const roller = useRoller({ defaultNotation: '2d6+1' })
  return (
    <div>
      <NotationField roller={roller} />
      <RollButton roller={roller} />
      <Readout roller={roller} />
    </div>
  )
}

describe('standalone parts', () => {
  test('compose a roller from single-component imports', () => {
    render(<MyRoller />)
    fireEvent.click(screen.getByRole('button', { name: 'Roll' }))
    const total = Number(screen.getByLabelText(/^Total /).textContent)
    expect(total).toBeGreaterThanOrEqual(3)
    expect(total).toBeLessThanOrEqual(13)
  })
})
