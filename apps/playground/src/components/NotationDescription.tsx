import type { ValidationResult } from '@randsum/roller'

interface NotationDescriptionProps {
  readonly validationResult: ValidationResult | null
}

function formatDescription(description: string[][]): string {
  return description.map(inner => inner.join(', ')).join(' + ')
}

export function NotationDescription({
  validationResult
}: NotationDescriptionProps): React.ReactElement {
  if (validationResult === null) {
    return (
      <div
        aria-hidden="true"
        style={{
          minHeight: '1.5rem'
        }}
      />
    )
  }

  if (validationResult.valid) {
    return (
      <p
        style={{
          minHeight: '1.5rem',
          margin: 0,
          fontFamily: 'var(--pg-font-mono)',
          fontSize: '0.875rem',
          color: 'var(--pg-color-text-muted)'
        }}
      >
        {formatDescription(validationResult.description)}
      </p>
    )
  }

  return (
    <p
      role="alert"
      style={{
        minHeight: '1.5rem',
        margin: 0,
        fontFamily: 'var(--pg-font-mono)',
        fontSize: '0.875rem',
        color: 'var(--pg-color-error)'
      }}
    >
      {validationResult.error.message}
    </p>
  )
}
