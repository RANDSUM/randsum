import type { Key } from '../keys'
import type { Preset } from '../presets'
import type { RollerOptions } from '../use-roller'

export type { RollResult } from '../check'

/** Props every roller size takes. */
export interface RollerBaseProps extends RollerOptions {
  /** The keys to show. Defaults to DEFAULT_KEYS from `@randsum/ui/keys`. */
  readonly keys?: readonly Key[]
  /** Optional named rolls. The keys stay first; presets sit behind a switch. */
  readonly presets?: readonly Preset[]
  /** What the presets are called on screen. Defaults to "Presets". */
  readonly presetsLabel?: string
  readonly placeholder?: string
  readonly className?: string
}
