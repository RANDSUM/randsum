// Svelte needs no wrapper: Svelte 5 sets a custom element's properties and
// listens for its events directly. This entry adds the elements' types to
// Svelte's markup. Import it once for types, and each element for its tag:
//
//   <script>
//     import '@randsum/ui/roller'
//     import type {} from '@randsum/ui/svelte'
//   </script>
//   <randsum-roller size="mini" notation="4d6L" onrandsum-roll={e => …} />
import type { HTMLAttributes } from 'svelte/elements'
import type { RandsumChangeEvent, RandsumRollEvent } from './internal/element'
import type { PresetsLayout } from './internal/parts/preset-list'
import type { Key } from './keys'
import type { Preset } from './presets'
import type { RollerSize } from './roller'
import type { RollerState } from './roller-state'

export type { RandsumChangeEvent, RandsumRollEvent } from './internal/element'

interface RandsumEvents {
  readonly 'onrandsum-change'?: (event: RandsumChangeEvent) => void
  readonly 'onrandsum-roll'?: (event: RandsumRollEvent) => void
}

interface PartAttributes extends HTMLAttributes<HTMLElement> {
  readonly roller?: RollerState
}

export interface RandsumRollerAttributes extends HTMLAttributes<HTMLElement>, RandsumEvents {
  readonly size?: RollerSize
  readonly notation?: string
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

declare module 'svelte/elements' {
  interface SvelteHTMLElements {
    'randsum-roller': RandsumRollerAttributes
    'randsum-scope': HTMLAttributes<HTMLElement> & RandsumEvents & { readonly notation?: string }
    'randsum-notation-field': PartAttributes & { readonly placeholder?: string }
    'randsum-roll-button': PartAttributes & { readonly tip?: boolean }
    'randsum-status-line': PartAttributes & { readonly hint?: string; readonly showValid?: boolean }
    'randsum-key-pad': PartAttributes & { readonly keys?: readonly Key[]; readonly label?: string }
    'randsum-preset-list': PartAttributes & {
      readonly presets?: readonly Preset[]
      readonly label?: string
      readonly layout?: PresetsLayout
    }
    'randsum-readout': PartAttributes
    'randsum-roll-steps': PartAttributes
  }
}
