// The native components under bun:test. React Native's own views need a
// device, so `react-native` is replaced with DOM stand-ins that keep the
// props the components rely on: text, accessibility, presses, and colours.
import { afterEach, beforeAll, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import type React from 'react'
import { Children, createElement, isValidElement, useState } from 'react'
import type { RollResult } from '../src/check'

type Props = Readonly<Record<string, unknown>> & { readonly children?: React.ReactNode }

const scheme = { current: 'light' as 'light' | 'dark' }
const opened: string[] = []

// Merges a style prop (objects, arrays, falsy) into what the DOM can show
function colours(style: unknown): React.CSSProperties {
  const merged: Record<string, unknown> = {}
  const add = (s: unknown): void => {
    if (Array.isArray(s)) for (const item of s) add(item)
    else if (typeof s === 'object' && s !== null) Object.assign(merged, s)
  }
  add(style)
  const out: React.CSSProperties = {}
  if (typeof merged['color'] === 'string') out.color = merged['color']
  if (typeof merged['backgroundColor'] === 'string') out.backgroundColor = merged['backgroundColor']
  if (typeof merged['opacity'] === 'number') out.opacity = merged['opacity']
  return out
}

function a11y(props: Props): Record<string, unknown> {
  const state = props['accessibilityState']
  const s: Record<string, unknown> = typeof state === 'object' && state !== null ? { ...state } : {}
  return {
    'aria-label': props['accessibilityLabel'],
    'aria-description': props['accessibilityHint'],
    role: props['accessibilityRole'],
    'aria-selected': s['selected'] === undefined ? undefined : String(s['selected']),
    'aria-expanded': s['expanded'] === undefined ? undefined : String(s['expanded'])
  }
}

function textOf(children: React.ReactNode): string {
  return Children.toArray(children)
    .map(child =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<Props>(child)
          ? textOf(child.props.children)
          : ''
    )
    .join('')
}

function View(props: Props): React.JSX.Element {
  return createElement('div', { ...a11y(props), style: colours(props['style']) }, props.children)
}

function Text(props: Props): React.JSX.Element {
  return createElement('span', { ...a11y(props), style: colours(props['style']) }, props.children)
}

function ScrollView(props: Props): React.JSX.Element {
  return createElement('div', null, props.children)
}

function Modal(props: Props): React.JSX.Element | null {
  return props['visible'] === true ? createElement('div', { role: 'dialog' }, props.children) : null
}

// The value is the text of the input's children, as React Native shows it
function TextInput(props: Props): React.JSX.Element {
  const onChangeText = props['onChangeText']
  const onSubmit = props['onSubmitEditing']
  return createElement(
    'label',
    null,
    createElement('input', {
      'aria-label': props['accessibilityLabel'],
      placeholder: props['placeholder'],
      value: textOf(props.children),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        if (typeof onChangeText === 'function') onChangeText(event.target.value)
      },
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && typeof onSubmit === 'function') onSubmit()
      }
    }),
    createElement('span', { 'data-tokens': '' }, props.children)
  )
}

function Pressable(props: Props): React.JSX.Element {
  const style = props['style']
  const onPress = props['onPress']
  return createElement(
    'button',
    {
      ...a11y(props),
      type: 'button',
      disabled: props['disabled'] === true,
      style: colours(typeof style === 'function' ? style({ pressed: false }) : style),
      onClick: () => {
        if (typeof onPress === 'function') onPress()
      }
    },
    props.children
  )
}

mock.module('react-native', () => ({
  View,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  StyleSheet: { create: <T,>(styles: T): T => styles },
  Platform: {
    OS: 'ios',
    select: (options: Readonly<Record<string, unknown>>) => options['default']
  },
  Linking: {
    openURL: (url: string) => {
      opened.push(url)
      return Promise.resolve()
    }
  },
  useColorScheme: () => scheme.current
}))

// Imported after the mock, so they see the stand-ins
const { Roller } = await import('../src/native/roller')
const { NotationField } = await import('../src/native/notation-field')
const { RollButton } = await import('../src/native/roll-button')
const { Readout } = await import('../src/native/readout')
const { useRoller } = await import('../src/native/use-roller')
const { RollerThemeProvider, darkTheme, lightTheme } = await import('../src/native/theme')
const { NOTATION_DOCS } = await import('@randsum/roller/docs')

beforeAll(() => {
  scheme.current = 'light'
})

afterEach(() => {
  cleanup()
  scheme.current = 'light'
})

function input(container: HTMLElement): HTMLInputElement {
  const found = container.querySelector('input')
  if (found === null) throw new Error('no input')
  return found
}

function button(container: HTMLElement, name: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find(
    b => b.getAttribute('aria-label') === name || b.textContent === name
  )
  if (found === undefined) throw new Error(`no button ${name}`)
  return found
}

describe('native <Roller>', () => {
  test('compact: typing, rolling, and a result over the keys that goes away', async () => {
    const rolls: RollResult[] = []
    const changes: string[] = []
    const { container } = render(
      <Roller onRoll={r => rolls.push(r)} onChange={n => changes.push(n)} />
    )
    const total = (): Element | null => container.querySelector('[aria-label^="Total "]')
    expect(total()).toBeNull()
    expect(button(container, 'Roll').disabled).toBe(true)
    await act(async () => {
      fireEvent.change(input(container), { target: { value: '2d6+1' } })
    })
    expect(changes).toEqual(['2d6+1'])
    await act(async () => {
      button(container, 'Roll').click()
    })
    expect(rolls).toHaveLength(1)
    expect(total()?.textContent).toBe(String(rolls[0]?.total))
    // The field and Roll come before everything else, the result included
    const order = input(container).compareDocumentPosition(total() as Node)
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await act(async () => {
      button(container, 'Roll again').click()
    })
    expect(rolls).toHaveLength(2)
    await act(async () => {
      button(container, 'Close result').click()
    })
    expect(total()).toBeNull()
    await act(async () => {
      button(container, 'Roll').click()
    })
    expect(total()).not.toBeNull()
    await act(async () => {
      fireEvent.change(input(container), { target: { value: '2d6+2' } })
    })
    expect(total()).toBeNull()
  })

  test('keys edit the notation and Clear is last', async () => {
    const { container } = render(<Roller defaultNotation="1d6" />)
    const keys = container.querySelectorAll('[aria-label="Dice keys"] button')
    expect(keys[keys.length - 1]?.textContent).toBe('Clear')
    await act(async () => {
      button(container, 'Add a d4').click()
    })
    expect(input(container).value).toBe('1d6+1d4')
    await act(async () => {
      button(container, 'Drop low (L)').click()
    })
    expect(button(container, 'Drop low (L)').getAttribute('aria-selected')).toBe('true')
    await act(async () => {
      button(container, 'Clear the roll').click()
    })
    expect(input(container).value).toBe('')
  })

  test('Enter in the field rolls', async () => {
    const rolls: RollResult[] = []
    const { container } = render(<Roller defaultNotation="1d20" onRoll={r => rolls.push(r)} />)
    await act(async () => {
      fireEvent.keyDown(input(container), { key: 'Enter' })
    })
    expect(rolls.map(r => r.notation)).toEqual(['1d20'])
  })

  test('compact presets sit behind a tab and roll when chosen', async () => {
    const rolls: RollResult[] = []
    const presets = [
      { label: 'Advantage', notation: '2d20H', description: 'Roll twice, keep the higher' }
    ]
    const { container, queryByText } = render(
      <Roller presets={presets} presetsLabel="Rolls" onRoll={r => rolls.push(r)} />
    )
    expect(queryByText('Advantage')).toBeNull()
    await act(async () => {
      button(container, 'Rolls').click()
    })
    await act(async () => {
      button(container, 'Advantage, 2d20H').click()
    })
    expect(rolls.map(r => r.notation)).toEqual(['2d20H'])
    expect(input(container).value).toBe('2d20H')
  })

  test('compact footer and app link', async () => {
    opened.length = 0
    const { container, getByText } = render(
      <Roller appLink="https://app.randsum.dev/" footer={<span>extra</span>} />
    )
    expect(getByText('extra')).toBeDefined()
    await act(async () => {
      button(container, 'Open the full app →').click()
    })
    expect(opened).toEqual(['https://app.randsum.dev/'])
  })

  test('mini: the keys open on a tap, and a roll opens a card that closes', async () => {
    const { container, queryByRole } = render(<Roller size="mini" defaultNotation="3d6" />)
    expect(container.querySelector('[aria-label="Add a d6"]')).toBeNull()
    await act(async () => {
      button(container, 'Dice keys').click()
    })
    expect(container.querySelector('[aria-label="Add a d6"]')).not.toBeNull()
    expect(queryByRole('dialog')).toBeNull()
    await act(async () => {
      button(container, 'Roll').click()
    })
    expect(queryByRole('dialog')).not.toBeNull()
    expect(container.querySelector('[aria-label^="Total "]')?.textContent).toMatch(/^\d+$/)
    const dice = [...container.querySelectorAll('div[aria-label]')].filter(d =>
      /^\d+$/.test(d.getAttribute('aria-label') ?? '')
    )
    expect(dice).toHaveLength(3)
    await act(async () => {
      button(container, 'Close result').click()
    })
    expect(queryByRole('dialog')).toBeNull()
  })

  test('max: recent rolls, the History sheet, and Clear', async () => {
    const saved: (readonly unknown[])[] = []
    const { container, getByText, queryByRole } = render(
      <Roller size="max" defaultNotation="1d6" onHistoryChange={h => saved.push(h)} />
    )
    expect(getByText('Your rolls land here. Tap one to roll it again.')).toBeDefined()
    expect(saved).toHaveLength(0)
    await act(async () => {
      button(container, 'Roll').click()
    })
    await act(async () => {
      button(container, 'Roll again').click()
    })
    expect(saved.at(-1)).toHaveLength(2)
    const again = [...container.querySelectorAll('button')].filter(b =>
      b.getAttribute('aria-label')?.startsWith('Roll 1d6 again')
    )
    expect(again).toHaveLength(2)
    await act(async () => {
      button(container, 'History').click()
    })
    expect(queryByRole('dialog')).not.toBeNull()
    const sheet = queryByRole('dialog')
    if (sheet === null) throw new Error('no sheet')
    await act(async () => {
      button(sheet, 'Clear').click()
    })
    expect(saved.at(-1)).toHaveLength(0)
    await act(async () => {
      button(container, 'Done').click()
    })
    expect(queryByRole('dialog')).toBeNull()
  })

  test('max starts from initialHistory, and history={false} hides it', () => {
    const entry = { id: 1, notation: '2d8', total: 9, description: 'Roll 2 8-sided dice' }
    const first = render(<Roller size="max" initialHistory={[entry]} />)
    expect(first.getByText('2d8')).toBeDefined()
    first.unmount()
    const second = render(<Roller size="max" history={false} />)
    expect(second.queryByText('Recent')).toBeNull()
  })

  test('a new rollSignal rolls the new notation', async () => {
    signalRolls.length = 0
    const rolls = signalRolls
    const { getByText } = render(<Host />)
    expect(rolls.map(r => r.notation)).toEqual(['1d4'])
    await act(async () => {
      getByText('next').click()
    })
    expect(rolls.map(r => r.notation)).toEqual(['1d4', '2d6'])
  })
})

const signalRolls: RollResult[] = []

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
  return (
    <>
      <NotationField roller={roller} />
      <RollButton roller={roller} />
      <Readout roller={roller} />
    </>
  )
}

describe('native parts with useRoller', () => {
  test('share one state', async () => {
    const { container } = render(<Parts />)
    await act(async () => {
      button(container, 'Roll').click()
    })
    expect(container.querySelector('[aria-label^="Total "]')?.textContent).toMatch(/^\d+$/)
  })
})

describe('native theme', () => {
  test('tokens follow the device scheme and a provider overrides them', () => {
    const light = render(<Roller defaultNotation="1d6" />)
    expect(button(light.container, 'Roll').style.backgroundColor).toBe(lightTheme.accent)
    light.unmount()

    scheme.current = 'dark'
    const dark = render(
      <RollerThemeProvider theme={{ accent: '#123456' }}>
        <Roller defaultNotation="1d6" />
      </RollerThemeProvider>
    )
    expect(button(dark.container, 'Roll').style.backgroundColor).toBe('#123456')
    const panel = dark.container.firstElementChild
    expect(panel instanceof HTMLElement ? panel.style.backgroundColor : '').toBe(darkTheme.bg)
  })

  test('notation tokens take their modifier colour for the scheme', () => {
    const doc = NOTATION_DOCS['L']
    if (doc === undefined) throw new Error('no L doc')
    const tokenColour = (container: HTMLElement): string => {
      const spans = [...container.querySelectorAll('[data-tokens] span')]
      const drop = spans.find(s => s.textContent === 'L')
      return drop instanceof HTMLElement ? drop.style.color : ''
    }
    const light = render(<Roller defaultNotation="4d6L" />)
    expect(tokenColour(light.container)).toBe(doc.colorLight)
    light.unmount()
    scheme.current = 'dark'
    const dark = render(<Roller defaultNotation="4d6L" />)
    expect(tokenColour(dark.container)).toBe(doc.color)
  })
})
