import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HeroRoller, LANDING_PRESETS } from '../src/components/rollers/HeroRoller'
import { ModifierRoller } from '../src/components/rollers/ModifierRoller'
import { NotationRoller } from '../src/components/rollers/NotationRoller'

afterEach(() => {
  cleanup()
})

const input = (): HTMLInputElement => screen.getByLabelText<HTMLInputElement>('Dice notation')

describe('HeroRoller', () => {
  test('opens on a rolled result for the first preset, with the dice keys showing', () => {
    render(<HeroRoller />)
    expect(input().value).toBe('4d6L')
    expect(document.querySelector('.rsui-total')?.textContent).toMatch(/^\d+$/)
    expect(document.querySelectorAll('.rsui-die[data-variant="removed"]')).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Dice keys' }).getAttribute('aria-selected')).toBe(
      'true'
    )
    expect(screen.getByRole('button', { name: 'd20' })).toBeDefined()
  })

  test('the landing presets sit behind the Presets switch, and each one rolls', () => {
    render(<HeroRoller />)
    fireEvent.click(screen.getByRole('tab', { name: 'Presets' }))
    expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Escalating' }))
    expect(input().value).toBe(LANDING_PRESETS[7]?.notation ?? '')
    const labels = [...document.querySelectorAll('.rsui-step-label')].map(el => el.textContent)
    expect(labels).toEqual(['1d4', '1d6', '1d8', '1d10', '1d12', '1d20'])
  })

  test('every landing preset is notation the roller accepts', () => {
    render(<HeroRoller />)
    for (const preset of LANDING_PRESETS) {
      fireEvent.change(input(), { target: { value: preset.notation } })
      expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Roll' }).disabled).toBe(false)
    }
  })

  test('links to the app', () => {
    render(<HeroRoller />)
    expect(screen.getByRole('link', { name: 'Open the full app →' }).getAttribute('href')).toBe(
      'https://app.randsum.dev/'
    )
  })
})

describe('ModifierRoller', () => {
  test("shows the modifier's own keys, and its documented examples as Examples", () => {
    render(<ModifierRoller modifier="drop" defaultNotation="4d6" />)
    fireEvent.click(screen.getByRole('button', { name: 'Drop high' }))
    expect(input().value).toBe('4d6H')
    fireEvent.click(screen.getByRole('tab', { name: 'Examples' }))
    expect(screen.getByText('Roll 4d6, drop lowest (ability scores)')).toBeDefined()
  })
})

describe('NotationRoller', () => {
  test('is the one-row Mini roller', () => {
    render(<NotationRoller defaultNotation="2d20H" />)
    expect(document.querySelector('.rsui-mini')).not.toBeNull()
    expect(input().value).toBe('2d20H')
  })
})
