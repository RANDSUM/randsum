import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, render } from '@testing-library/react'
import { createApp, h } from 'vue'
import { DEFAULT_KEYS } from '../src/keys'
import { KeyPad } from '../src/react/key-pad'
import { NotationField } from '../src/react/notation-field'
import { PresetList } from '../src/react/preset-list'
import { Readout } from '../src/react/readout'
import { RollButton } from '../src/react/roll-button'
import { RollSteps } from '../src/react/roll-steps'
import { StatusLine } from '../src/react/status-line'
import { useRoller as useReactRoller } from '../src/react/use-roller'
import { KeyPad as VueKeyPad } from '../src/vue/key-pad'
import { NotationField as VueNotationField } from '../src/vue/notation-field'
import { PresetList as VuePresetList } from '../src/vue/preset-list'
import { Readout as VueReadout } from '../src/vue/readout'
import { RollButton as VueRollButton } from '../src/vue/roll-button'
import { RollSteps as VueRollSteps } from '../src/vue/roll-steps'
import { StatusLine as VueStatusLine } from '../src/vue/status-line'
import { useRoller as vueRoller } from '../src/vue/use-roller'

afterEach(cleanup)

const TAGS = [
  'randsum-notation-field',
  'randsum-roll-button',
  'randsum-status-line',
  'randsum-key-pad',
  'randsum-preset-list',
  'randsum-readout',
  'randsum-roll-steps'
] as const

const PRESETS = [{ label: 'Adv', notation: '2d20H' }]

async function settleAll(root: ParentNode): Promise<void> {
  for (const tag of TAGS) {
    const el = root.querySelector(tag)
    if (el !== null && 'updateComplete' in el) await el.updateComplete
  }
}

function AllReactParts(): React.JSX.Element {
  const roller = useReactRoller({ defaultNotation: '1d6' })
  return (
    <div>
      <NotationField roller={roller} placeholder="2d6" />
      <RollButton roller={roller} tip />
      <StatusLine roller={roller} hint="Type" />
      <KeyPad roller={roller} keys={DEFAULT_KEYS} />
      <PresetList roller={roller} presets={PRESETS} layout="list" />
      <Readout roller={roller} />
      <RollSteps roller={roller} />
    </div>
  )
}

describe('every part', () => {
  test('React: one state drives all seven', async () => {
    const { container } = render(<AllReactParts />)
    await act(async () => {
      await settleAll(container)
    })
    const preset = container
      .querySelector('randsum-preset-list')
      ?.shadowRoot?.querySelector<HTMLButtonElement>('.rsui-preset')
    await act(async () => {
      preset?.click()
      await settleAll(container)
    })
    const field = container.querySelector('randsum-notation-field')
    expect(field?.shadowRoot?.querySelector('input')?.value).toBe('2d20H')
    expect(
      container.querySelector('randsum-roll-steps')?.shadowRoot?.querySelector('.rsui-steps')
    ).not.toBeNull()
    expect(
      container.querySelector('randsum-key-pad')?.shadowRoot?.querySelectorAll('.rsui-key').length
    ).toBe(DEFAULT_KEYS.length)
  })

  test('Vue: one state drives all seven', async () => {
    const root = document.createElement('div')
    document.body.append(root)
    const app = createApp({
      setup() {
        const { roller, snapshot } = vueRoller('1d6')
        return () =>
          h('div', { 'data-total': snapshot.value.result?.total ?? '' }, [
            h(VueNotationField, { roller }),
            h(VueRollButton, { roller }),
            h(VueStatusLine, { roller }),
            h(VueKeyPad, { roller }),
            h(VuePresetList, { roller, presets: PRESETS }),
            h(VueReadout, { roller }),
            h(VueRollSteps, { roller })
          ])
      }
    })
    app.mount(root)
    await settleAll(root)
    root
      .querySelector('randsum-roll-button')
      ?.shadowRoot?.querySelector<HTMLButtonElement>('button')
      ?.click()
    await settleAll(root)
    await Promise.resolve()
    expect(
      root.querySelector('randsum-readout')?.shadowRoot?.querySelector('.rsui-total')
    ).not.toBeNull()
    expect(root.querySelector('[data-total]')?.getAttribute('data-total')).toMatch(/^\d+$/)
    app.unmount()
  })
})
