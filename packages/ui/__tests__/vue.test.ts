import { describe, expect, test } from 'bun:test'
import { createApp, h, nextTick, ref } from 'vue'
import type { RollResult } from '../src/check'
import type { RandsumRoller } from '../src/roller'
import { Roller } from '../src/vue/roller'

describe('Vue <Roller>', () => {
  test('v-model and roll events', async () => {
    const notation = ref('1d6')
    const rolls: RollResult[] = []
    const root = document.createElement('div')
    document.body.append(root)
    createApp({
      render: () =>
        h(Roller, {
          size: 'max',
          modelValue: notation.value,
          'onUpdate:modelValue': (next: string) => {
            notation.value = next
          },
          onRoll: (result: RollResult) => {
            rolls.push(result)
          }
        })
    }).mount(root)
    const el = root.querySelector('randsum-roller')
    if (el === null) throw new Error('no roller')
    const roller: RandsumRoller = el
    await roller.updateComplete
    expect(roller.getAttribute('size')).toBe('max')
    expect(roller.state.notation).toBe('1d6')

    roller.state.edit('3d8')
    await nextTick()
    expect(notation.value).toBe('3d8')

    roller.roll()
    expect(rolls.map(r => r.notation)).toEqual(['3d8'])

    notation.value = '1d20'
    await nextTick()
    expect(roller.state.notation).toBe('1d20')
  })
})
