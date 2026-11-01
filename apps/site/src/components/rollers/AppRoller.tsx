// The installable Roller at app.randsum.dev: the max Roller, with history kept in
// the same localStorage key the app has always used.
import { Roller } from '@randsum/ui/react/roller'
import './rollers.css'

export function AppRoller(): React.JSX.Element {
  return (
    <Roller
      size="max"
      className="app-roller"
      defaultNotation="1d20"
      storageKey="randsum-app-history"
      onRoll={() => {
        navigator.vibrate?.(12)
      }}
    />
  )
}
