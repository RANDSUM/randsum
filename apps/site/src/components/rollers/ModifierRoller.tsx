// The roller on each modifier's section of the docs: RollerCompact with that
// modifier's canonical keys, and its documented examples behind a switch.
import { useState } from 'react'
import { RollerCompact } from '@randsum/ui/roller-compact'
import { modifierKeys } from '@randsum/ui/keys'
import type { ModifierName } from '@randsum/ui/keys'
import { modifierPresets } from '@randsum/ui/presets'
import { ErrorBoundary } from '../ErrorBoundary'
import { APP_URL } from './links'
import { StackBlitzAction } from './StackBlitzAction'
import '@randsum/ui/styles.css'
import './rollers.css'

export function ModifierRoller({
  modifier,
  defaultNotation
}: {
  readonly modifier: ModifierName
  readonly defaultNotation: string
}): React.JSX.Element {
  const [notation, setNotation] = useState(defaultNotation)
  return (
    <ErrorBoundary>
      <RollerCompact
        className="not-content"
        defaultNotation={defaultNotation}
        onChange={setNotation}
        keys={modifierKeys(modifier)}
        presets={modifierPresets(modifier)}
        presetsLabel="Examples"
        presetsLayout="list"
        appLink={APP_URL}
        footer={<StackBlitzAction notation={notation} />}
      />
    </ErrorBoundary>
  )
}
