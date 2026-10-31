// The UI docs' live demos: each roller size as it ships, and one built from parts.
import { RollerCompact } from '@randsum/ui/roller-compact'
import { RollerMax } from '@randsum/ui/roller-max'
import { RollerMini } from '@randsum/ui/roller-mini'
import { NotationField } from '@randsum/ui/notation-field'
import { Readout } from '@randsum/ui/readout'
import { RollButton } from '@randsum/ui/roll-button'
import { useRoller } from '@randsum/ui/use-roller'
import { ErrorBoundary } from '../ErrorBoundary'
import '@randsum/ui/styles.css'
import './rollers.css'

type Size = 'max' | 'compact' | 'mini' | 'parts'

function PartsRoller(): React.JSX.Element {
  const roller = useRoller({ defaultNotation: '2d6+1' })
  return (
    <div className="rsui ui-demo-parts">
      <div className="rsui-row">
        <NotationField roller={roller} />
        <RollButton roller={roller} />
      </div>
      <Readout roller={roller} />
    </div>
  )
}

export function UiDemo({ size }: { readonly size: Size }): React.JSX.Element {
  return (
    <ErrorBoundary>
      <div className="not-content ui-demo">
        {size === 'max' && <RollerMax defaultNotation="4d6L" history={false} />}
        {size === 'compact' && <RollerCompact defaultNotation="2d20H+5" />}
        {size === 'mini' && <RollerMini defaultNotation="4d6L" />}
        {size === 'parts' && <PartsRoller />}
      </div>
    </ErrorBoundary>
  )
}
