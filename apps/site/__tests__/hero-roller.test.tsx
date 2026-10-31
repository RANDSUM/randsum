import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HeroRoller } from '../src/components/HeroRoller/HeroRoller'

afterEach(() => {
  cleanup()
})

describe('HeroRoller', () => {
  test('opens on a rolled result for the first preset', () => {
    render(<HeroRoller />)
    expect(screen.getByLabelText<HTMLInputElement>('Dice notation').value).toBe('4d6L')
    expect(document.querySelector('.hr-total-value')?.textContent).toMatch(/^\d+$/)
    expect(document.querySelectorAll('.hr-die--removed')).toHaveLength(1)
  })

  test('explains each token of the notation', () => {
    render(<HeroRoller />)
    const tokens = [...document.querySelectorAll('.hr-token-text')].map(el => el.textContent)
    expect(tokens).toEqual(['4d6', 'L'])
  })

  test('a preset fills the field, marks itself pressed and rolls', () => {
    render(<HeroRoller />)
    const advantage = screen.getByRole('button', { name: 'Advantage' })
    fireEvent.click(advantage)
    expect(screen.getByLabelText<HTMLInputElement>('Dice notation').value).toBe('2d20H')
    expect(advantage.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('.hr-total-notation')?.textContent).toBe('2d20H')
  })

  test('typing marks the last result stale until the new notation is rolled', () => {
    render(<HeroRoller />)
    const input = screen.getByLabelText('Dice notation')
    fireEvent.change(input, { target: { value: '2d6+3' } })
    expect(document.querySelector('.hr-result--stale')).not.toBeNull()
    act(() => {
      fireEvent.submit(input)
    })
    expect(document.querySelector('.hr-result--stale')).toBeNull()
    expect(document.querySelector('.hr-total-notation')?.textContent).toBe('2d6+3')
  })

  test('invalid notation disables Roll and says so', () => {
    render(<HeroRoller />)
    fireEvent.change(screen.getByLabelText('Dice notation'), { target: { value: '4d6Q' } })
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Roll' }).disabled).toBe(true)
    expect(screen.getByText('That is not valid notation yet')).toBeDefined()
  })

  test('each pool of a multi-pool roll gets its own row', () => {
    render(<HeroRoller />)
    fireEvent.click(screen.getByRole('button', { name: 'Escalating' }))
    const labels = [...document.querySelectorAll('.hr-step-label')].map(el => el.textContent)
    expect(labels).toEqual(['1d4', '1d6', '1d8', '1d10', '1d12', '1d20'])
  })

  test('a capped die shows as old value to new value', () => {
    render(<HeroRoller />)
    const input = screen.getByLabelText('Dice notation')
    // Every d8 is under 9, so the floor lifts all four
    fireEvent.change(input, { target: { value: '4d8C{<9}' } })
    act(() => {
      fireEvent.submit(input)
    })
    const capStep = [...document.querySelectorAll('.hr-step')].find(el =>
      el.textContent?.startsWith('Cap')
    )
    expect(capStep?.querySelectorAll('.hr-swap')).toHaveLength(4)
    expect(capStep?.querySelectorAll('.hr-dice > .hr-die--removed')).toHaveLength(0)
  })
})
