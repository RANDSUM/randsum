// <Roller size="mini" | "compact" | "max">: <randsum-roller> for Vue, with
// v-model on the notation and a `footer` slot.
import { defineComponent, h } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import type { RollResult } from '../check'
import type { PresetsLayout } from '../internal/parts/preset-list'
import { renderElement } from '../internal/vue'
import type { Key } from '../keys'
import type { Preset } from '../presets'
import type { RollerSize } from '../roller'
import '../roller'

export type { RollResult } from '../check'
export type { PresetsLayout } from '../internal/parts/preset-list'
export type { Key } from '../keys'
export type { Preset } from '../presets'
export type { RollerSize } from '../roller'

export interface RollerProps {
  /** 'mini', 'compact' (the default) or 'max'. */
  readonly size?: RollerSize
  /** The notation; `v-model` keeps it in step. */
  readonly modelValue?: string
  readonly keys?: readonly Key[]
  readonly presets?: readonly Preset[]
  readonly presetsLabel?: string
  readonly presetsLayout?: PresetsLayout
  readonly placeholder?: string
  readonly appLink?: string
  readonly history?: boolean
  readonly storageKey?: string
  readonly historyLimit?: number
}

export type RollerEmits = {
  'update:modelValue': (notation: string) => true
  change: (notation: string) => true
  roll: (result: RollResult) => true
}

const EMITS: RollerEmits = {
  'update:modelValue': () => true,
  change: () => true,
  roll: () => true
}

const PROPS = [
  'size',
  'modelValue',
  'keys',
  'presets',
  'presetsLabel',
  'presetsLayout',
  'placeholder',
  'appLink',
  'history',
  'storageKey',
  'historyLimit'
] as const

export const Roller: DefineSetupFnComponent<RollerProps, RollerEmits> = defineComponent<
  RollerProps,
  RollerEmits
>(
  (props: RollerProps, { emit, slots }) =>
    () => {
      const { modelValue, size, ...rest } = props
      return renderElement(
        'randsum-roller',
        { ...rest, notation: modelValue },
        {
          size: size ?? 'compact',
          onRandsumChange: (event: CustomEvent<{ readonly notation: string }>) => {
            emit('update:modelValue', event.detail.notation)
            emit('change', event.detail.notation)
          },
          onRandsumRoll: (event: CustomEvent<RollResult>) => {
            emit('roll', event.detail)
          }
        },
        slots['footer'] === undefined ? [] : [h('div', { slot: 'footer' }, slots['footer']())]
      )
    },
  {
    name: 'RandsumRoller',
    props: [...PROPS],
    emits: EMITS
  }
)
