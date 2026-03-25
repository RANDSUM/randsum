import React, { useState } from 'react'
import sdk from '@stackblitz/sdk'
import type { ProjectTemplate } from '@stackblitz/sdk'
import { useTheme } from '@randsum/dice-ui'
import { buildStackBlitzProject } from '../helpers/stackblitz'
import { buildNotationUrl, getCopyButtonLabel } from '../helpers/url'

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

function toggleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme')
  const next = current === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem('pg-theme', next)
  } catch {
    // localStorage unavailable
  }
}

export function PlaygroundHeader({ notation }: PlaygroundHeaderProps): React.ReactElement {
  const isEmpty = notation.trim() === ''
  const theme = useTheme()
  const [isCopied, setIsCopied] = useState(false)

  function handleCopyLink(): void {
    const url = window.location.origin + buildNotationUrl(notation)
    void navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    })
  }

  return (
    <header
      className="pg-header"
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
        <span style={{ whiteSpace: 'nowrap' }}>RANDSUM Dice Notation Playground</span>
      </a>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--pg-space-md)',
          flexShrink: 0
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
          onClick={handleCopyLink}
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
          {getCopyButtonLabel(isCopied)}
        </button>

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

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            cursor: 'pointer',
            padding: 'var(--pg-space-xs)',
            backgroundColor: 'transparent',
            color: 'var(--pg-color-text-muted)',
            border: '1px solid var(--pg-color-border)',
            borderRadius: 'var(--pg-radius-sm)',
            fontSize: '1rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            transition: 'color 0.15s ease, border-color 0.15s ease'
          }}
        >
          {theme === 'dark' ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  )
}
