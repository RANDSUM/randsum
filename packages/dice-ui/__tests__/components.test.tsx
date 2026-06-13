import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { roll } from '@randsum/roller/roll'
import { TokenOverlayInput } from '../src/TokenOverlayInput'
import { NotationRoller } from '../src/NotationRoller'
import { DieBadge, RollSteps } from '../src/RollSteps'
import { getTheme, subscribeTheme, useTheme } from '../src/useTheme'

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-theme')
})

describe('TokenOverlayInput', () => {
  test('renders children even with no tokens (no overlay)', () => {
    render(
      <TokenOverlayInput tokens={[]} hoveredTokenIdx={null}>
        <input aria-label="notation" />
      </TokenOverlayInput>
    )
    expect(screen.getByLabelText('notation')).toBeDefined()
    expect(document.querySelector('.du-notation-overlay')).toBeNull()
  })

  test('renders a colored overlay span per token', () => {
    const tokens = [
      { key: 'xDN', text: '2d6', category: 'Core', description: 'Roll' },
      { key: '+', text: '+3', category: 'Scale', description: 'Add' }
    ]
    render(
      // tokens are structurally compatible with the Token shape the component reads
      <TokenOverlayInput tokens={tokens as never} hoveredTokenIdx={null}>
        <input aria-label="notation" />
      </TokenOverlayInput>
    )
    const overlay = document.querySelector('.du-notation-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay?.querySelectorAll('.du-token')).toHaveLength(2)
  })

  test('marks the hovered token active and dims the rest', () => {
    const tokens = [
      { key: 'xDN', text: '2d6', category: 'Core', description: 'Roll' },
      { key: '+', text: '+3', category: 'Scale', description: 'Add' }
    ]
    render(
      <TokenOverlayInput tokens={tokens as never} hoveredTokenIdx={0}>
        <input aria-label="notation" />
      </TokenOverlayInput>
    )
    const spans = document.querySelectorAll('.du-token')
    expect(spans[0]?.className).toContain('du-token--active')
    expect(spans[1]?.className).toContain('du-token--dim')
  })
})

describe('NotationRoller', () => {
  test('renders with the default notation', () => {
    render(<NotationRoller />)
    expect(screen.getByLabelText('Dice notation')).toHaveProperty('value', '4d6L')
  })

  test('honors a provided defaultNotation', () => {
    render(<NotationRoller defaultNotation="1d20+5" />)
    expect(screen.getByLabelText('Dice notation')).toHaveProperty('value', '1d20+5')
  })

  test('fires onChange and updates the input when typing', () => {
    const seen: string[] = []
    render(<NotationRoller defaultNotation="" onChange={n => seen.push(n)} />)
    const input = screen.getByLabelText('Dice notation')
    fireEvent.change(input, { target: { value: '2d8' } })
    expect(input).toHaveProperty('value', '2d8')
    expect(seen).toContain('2d8')
  })

  test('disables the roll button for invalid notation', () => {
    render(<NotationRoller defaultNotation="not-dice" />)
    const button = screen.getByLabelText('Roll the dice')
    expect(button).toHaveProperty('disabled', true)
  })

  test('enables the roll button for valid notation', () => {
    render(<NotationRoller defaultNotation="2d6" />)
    const button = screen.getByLabelText('Roll the dice')
    expect(button).toHaveProperty('disabled', false)
  })

  test('shows the empty-state hint when notation is cleared', () => {
    render(<NotationRoller defaultNotation="" />)
    expect(screen.getByText('Try: 4d6L, 1d20+5, 2d8!')).toBeDefined()
  })

  test('shows an invalid-notation message for unparseable input', () => {
    render(<NotationRoller defaultNotation="zzz" />)
    expect(screen.getByText('Invalid notation')).toBeDefined()
  })

  test('controlled notation prop drives the input value', () => {
    const { rerender } = render(<NotationRoller notation="1d4" />)
    expect(screen.getByLabelText('Dice notation')).toHaveProperty('value', '1d4')
    rerender(<NotationRoller notation="3d10" />)
    expect(screen.getByLabelText('Dice notation')).toHaveProperty('value', '3d10')
  })

  test('renderActions render prop is invoked with the current notation', () => {
    render(
      <NotationRoller
        defaultNotation="2d6"
        renderActions={n => <span data-testid="actions">{n}</span>}
      />
    )
    expect(screen.getByTestId('actions').textContent).toBe('2d6')
  })
})

describe('RollSteps', () => {
  test('DieBadge renders its value', () => {
    render(<DieBadge value={5} variant="unchanged" />)
    expect(screen.getByText('5')).toBeDefined()
  })

  test('DieBadge applies the removed variant class and strikethrough', () => {
    render(<DieBadge value={2} variant="removed" />)
    const badge = screen.getByText('2')
    expect(badge.className).toContain('du-die-badge--removed')
    expect(badge.style.textDecoration).toBe('line-through')
  })

  test('renders a step row for a simple roll', () => {
    const record = roll('2d6').rolls[0]
    if (record === undefined) throw new Error('expected a roll record')
    render(<RollSteps record={record} />)
    expect(document.querySelector('.du-roll-steps')).not.toBeNull()
    expect(document.querySelectorAll('.du-step-row').length).toBeGreaterThan(0)
  })

  test('renders the pool heading when showHeading is set', () => {
    const record = roll('4d6L').rolls[0]
    if (record === undefined) throw new Error('expected a roll record')
    render(<RollSteps record={record} showHeading />)
    expect(document.querySelector('.du-pool-heading')?.textContent).toContain('4d6')
  })
})

describe('theme subscription', () => {
  test('getTheme defaults to dark and reads the data-theme attribute', () => {
    document.documentElement.removeAttribute('data-theme')
    expect(getTheme()).toBe('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    expect(getTheme()).toBe('light')
  })

  test('subscribeTheme notifies on data-theme mutation and unsubscribes cleanly', async () => {
    const calls: number[] = []
    const unsubscribe = subscribeTheme(() => {
      calls.push(1)
    })
    document.documentElement.setAttribute('data-theme', 'light')
    // MutationObserver callbacks are microtask-scheduled.
    await Promise.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(calls.length).toBeGreaterThan(0)

    const afterSubscribe = calls.length
    unsubscribe()
    document.documentElement.setAttribute('data-theme', 'dark')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(calls.length).toBe(afterSubscribe)
  })

  test('useTheme reflects the current data-theme in a rendered component', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    function Probe(): React.JSX.Element {
      const theme = useTheme()
      return <span data-testid="theme">{theme}</span>
    }
    render(<Probe />)
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })
})
