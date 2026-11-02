// <PresetList>: <randsum-preset-list> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'
import type { PresetsLayout } from '../internal/parts/preset-list'
import type { Preset } from '../presets'
import '../preset-list'

export type { RollerState } from '../roller-state'

export interface PresetListProps {
  readonly roller?: RollerState
  readonly presets?: readonly Preset[]
  readonly label?: string
  readonly layout?: PresetsLayout
}

export const PresetList: DefineSetupFnComponent<PresetListProps> = defineComponent(
  (props: PresetListProps) => () => renderElement('randsum-preset-list', { ...props }),
  { name: 'RandsumPresetList', props: ['roller', 'presets', 'label', 'layout'] }
)
