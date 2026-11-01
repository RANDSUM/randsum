// <PresetList>: <randsum-preset-list> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'
import type { PresetsLayout } from '../internal/parts/preset-list'
import type { Preset } from '../presets'
import '../preset-list'

export type { RollerState } from '../roller-state'

export interface PresetListProps {
  readonly roller?: RollerState
  readonly presets: readonly Preset[]
  readonly label?: string
  /** 'chips' (the default) or 'list'. */
  readonly layout?: PresetsLayout
  readonly className?: string
}

export function PresetList({ className, ...properties }: PresetListProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-preset-list', ref, className)
}
