// The inline roller in the docs: one row, for any notation a page teaches.
import { RollerMini } from '@randsum/ui/roller-mini'
import { ErrorBoundary } from '../ErrorBoundary'
import '@randsum/ui/styles.css'
import './rollers.css'

export function NotationRoller({
  defaultNotation
}: {
  readonly defaultNotation: string
}): React.JSX.Element {
  return (
    <ErrorBoundary>
      <RollerMini className="not-content" defaultNotation={defaultNotation} />
    </ErrorBoundary>
  )
}
