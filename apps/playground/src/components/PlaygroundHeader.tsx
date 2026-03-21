import sdk from '@stackblitz/sdk'
import type { ProjectTemplate } from '@stackblitz/sdk'
import { buildStackBlitzProject } from '../helpers/stackblitz'

interface PlaygroundHeaderProps {
  readonly notation: string
}

function handleOpenStackBlitz(notation: string): void {
  const project = buildStackBlitzProject(notation)
  sdk.openProject({
    ...project,
    template: project.template as ProjectTemplate,
    files: project.files as Record<string, string>
  })
}

export function PlaygroundHeader({ notation }: PlaygroundHeaderProps): React.ReactElement {
  const isEmpty = notation.trim() === ''

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--pg-space-md) var(--pg-space-lg)',
        backgroundColor: 'var(--pg-color-surface)',
        borderBottom: '1px solid var(--pg-color-border)'
      }}
    >
      <a
        href="https://randsum.dev"
        style={{
          color: 'var(--pg-color-text)',
          textDecoration: 'none',
          fontFamily: 'var(--pg-font-mono)',
          fontWeight: 'bold',
          fontSize: '1.25rem'
        }}
      >
        RANDSUM
      </a>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--pg-space-md)'
        }}
      >
        <a
          href="https://randsum.dev"
          style={{
            color: 'var(--pg-color-text-muted)',
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}
        >
          docs
        </a>

        <a
          href="https://notation.randsum.dev"
          style={{
            color: 'var(--pg-color-text-muted)',
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}
        >
          spec
        </a>

        <button
          type="button"
          disabled={isEmpty}
          onClick={() => {
            handleOpenStackBlitz(notation)
          }}
          style={{
            cursor: isEmpty ? 'not-allowed' : 'pointer',
            padding: 'var(--pg-space-xs) var(--pg-space-sm)',
            backgroundColor: isEmpty ? 'var(--pg-color-surface-alt)' : 'var(--pg-color-accent)',
            color: isEmpty ? 'var(--pg-color-text-muted)' : 'var(--pg-color-text)',
            border: '1px solid var(--pg-color-border)',
            borderRadius: 'var(--pg-radius-sm)',
            fontFamily: 'var(--pg-font-mono)',
            fontSize: '0.875rem'
          }}
        >
          Open in StackBlitz
        </button>
      </nav>
    </header>
  )
}
