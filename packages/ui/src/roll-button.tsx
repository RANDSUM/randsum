import type React from 'react'
import { useId } from 'react'
import type { Roller } from './use-roller'

export type { Roller } from './use-roller'

export function RollButton({
  roller,
  tip = false
}: {
  readonly roller: Roller
  /** Shows the English description on hover and focus (Mini). */
  readonly tip?: boolean
}): React.JSX.Element {
  const { check } = roller
  const tipId = useId()
  const description = check.kind === 'valid' ? check.description : undefined
  const showTip = tip && description !== undefined
  return (
    <span className="rsui-roll-wrap">
      <button
        type="button"
        className="rsui-roll"
        disabled={check.kind !== 'valid'}
        onClick={roller.roll}
        aria-describedby={showTip ? tipId : undefined}
      >
        Roll
      </button>
      {showTip && (
        <span id={tipId} className="rsui-tip" role="tooltip">
          {description}
        </span>
      )}
    </span>
  )
}
