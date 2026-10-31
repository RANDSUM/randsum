import type React from 'react'
import type { Key } from './keys'
import type { Roller } from './use-roller'

export type { Key } from './keys'
export type { Roller } from './use-roller'

function isPressed(notation: string, key: Key): boolean | undefined {
  if (key.action.kind !== 'modifier') return undefined
  return notation.includes(key.action.text)
}

export function KeyPad({
  keys,
  roller,
  label = 'Dice keys'
}: {
  readonly keys: readonly Key[]
  readonly roller: Roller
  readonly label?: string
}): React.JSX.Element {
  return (
    <div className="rsui-keys" role="group" aria-label={label}>
      {keys.map(key => (
        <button
          key={`${key.action.kind}-${key.label}`}
          type="button"
          className="rsui-key"
          data-kind={key.action.kind}
          aria-pressed={isPressed(roller.notation, key)}
          title={key.title}
          onClick={() => {
            roller.press(key)
          }}
        >
          {key.label}
        </button>
      ))}
    </div>
  )
}
