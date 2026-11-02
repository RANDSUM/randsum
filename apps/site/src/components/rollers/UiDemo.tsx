// The UI docs' React demo: a roller built from the React parts, sharing one
// useRoller state. The sizes are server-rendered by ServerRoller.astro.
import { NotationField } from '@randsum/ui/react/notation-field'
import { Readout } from '@randsum/ui/react/readout'
import { RollButton } from '@randsum/ui/react/roll-button'
import { useRoller } from '@randsum/ui/react/use-roller'
import { ErrorBoundary } from '../ErrorBoundary'
import './rollers.css'

function PartsRoller(): React.JSX.Element {
  const roller = useRoller({ defaultNotation: '2d6+1' })
  return (
    <div className="site-rsui ui-demo-parts">
      <div className="ui-demo-row">
        <NotationField roller={roller} className="ui-demo-grow" />
        <RollButton roller={roller} />
      </div>
      <Readout roller={roller} />
    </div>
  )
}

export function UiDemo(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <div className="not-content ui-demo">
        <PartsRoller />
      </div>
    </ErrorBoundary>
  )
}
