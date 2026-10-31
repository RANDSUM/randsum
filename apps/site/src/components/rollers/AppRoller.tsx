// The installable Roller at app.randsum.dev: RollerMax, with history kept in
// the same localStorage key the app has always used.
import { RollerMax } from '@randsum/ui/roller-max'
import '@randsum/ui/styles.css'
import './rollers.css'

export function AppRoller(): React.JSX.Element {
  return (
    <RollerMax
      className="app-roller"
      defaultNotation="1d20"
      storageKey="randsum-app-history"
      onRoll={() => {
        navigator.vibrate?.(12)
      }}
    />
  )
}
