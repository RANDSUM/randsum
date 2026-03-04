import { useValidation } from './hooks/useValidation'

interface NotationInputProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onSubmit: () => void
}

export function NotationInput({
  value,
  onChange,
  onSubmit
}: NotationInputProps): React.JSX.Element {
  const { validationError } = useValidation(value)
  const hasInput = value.trim() !== ''
  const isValid = hasInput && !validationError

  const borderColor = !hasInput
    ? 'var(--sl-color-gray-4)'
    : isValid
      ? 'var(--sl-color-accent)'
      : '#ef4444'

  return (
    <div className="playground-notation-input">
      <div className="playground-input-wrapper">
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && isValid) {
              onSubmit()
            }
          }}
          placeholder="Enter dice notation (e.g. 4d6L, 2d20H+5)"
          style={{ borderColor }}
          className="playground-input"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={onSubmit}
          disabled={!isValid}
          className="playground-roll-btn"
          type="button"
        >
          Roll
        </button>
      </div>
      {validationError && <p className="playground-validation-error">{validationError}</p>}
    </div>
  )
}
