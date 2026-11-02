// The React half of ModifierRoller.astro: the compact Roller with that
// modifier's canonical keys, and its documented examples behind a switch.
import { useState } from 'react'
import { Roller } from '@randsum/ui/react/roller'
import { modifierKeys } from '@randsum/ui/keys'
import type { ModifierName } from '@randsum/ui/keys'
import { modifierPresets } from '@randsum/ui/presets'
import { ErrorBoundary } from '../ErrorBoundary'
import { APP_URL } from './links'
import { StackBlitzAction } from './StackBlitzAction'
import './rollers.css'

export function ModifierRollerIsland({
  modifier,
  defaultNotation
}: {
  readonly modifier: ModifierName
  readonly defaultNotation: string
}): React.JSX.Element {
  const [notation, setNotation] = useState(defaultNotation)
  return (
    <ErrorBoundary>
      <Roller
        size="compact"
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
