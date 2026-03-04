const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const

interface DiceToolbarProps {
  readonly onDiceClick: (sides: number) => void
}

export function DiceToolbar({ onDiceClick }: DiceToolbarProps): React.JSX.Element {
  return (
    <div className="playground-dice-toolbar">
      {DICE_SIDES.map(sides => (
        <button
          key={sides}
          onClick={() => {
            onDiceClick(sides)
          }}
          className="playground-dice-btn"
          type="button"
          title={`Add d${sides}`}
        >
          d{sides}
        </button>
      ))}
    </div>
  )
}
