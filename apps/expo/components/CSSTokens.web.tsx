import { useEffect } from 'react'

const CSS_TOKENS = `
:root {
  /* Typography */
  --dui-font-body: ui-sans-serif, system-ui, sans-serif;
  --dui-font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Scale — dark mode defaults (zinc) */
  --dui-color-bg: #09090b;
  --dui-color-surface: #18181b;
  --dui-color-surface-alt: #27272a;
  --dui-color-border: #52525b;
  --dui-color-text: #fafafa;
  --dui-color-text-muted: #a1a1aa;
  --dui-color-text-dim: #71717a;

  /* Accent */
  --dui-color-accent: #a855f7;
  --dui-color-accent-high: #d8b4fe;
  --dui-color-accent-low: #2e1065;

  /* Semantic */
  --dui-color-error: #ef4444;
  --dui-color-success: #10b981;
  --dui-color-removed: #ef4444;
  --dui-color-added: #a855f7;
  --dui-color-total: #d8b4fe;

  /* Spacing */
  --dui-space-xs: 0.25rem;
  --dui-space-sm: 0.5rem;
  --dui-space-md: 1rem;
  --dui-space-lg: 1.5rem;
  --dui-space-xl: 2rem;

  /* Radii */
  --dui-radius-sm: 5px;
  --dui-radius-md: 5px;
}

@media (prefers-color-scheme: light) {
  :root {
    --dui-color-bg: #ffffff;
    --dui-color-surface: #f4f4f5;
    --dui-color-surface-alt: #e4e4e7;
    --dui-color-border: #a1a1aa;
    --dui-color-text: #18181b;
    --dui-color-text-muted: #3f3f46;
    --dui-color-text-dim: #71717a;
    --dui-color-accent: #9333ea;
    --dui-color-accent-high: #6b21a8;
    --dui-color-accent-low: #f3e8ff;
    --dui-color-error: #dc2626;
    --dui-color-success: #059669;
    --dui-color-removed: #dc2626;
    --dui-color-added: #9333ea;
    --dui-color-total: #6b21a8;
  }
}

[data-theme='light'] {
  --dui-color-bg: #ffffff;
  --dui-color-surface: #f4f4f5;
  --dui-color-surface-alt: #e4e4e7;
  --dui-color-border: #a1a1aa;
  --dui-color-text: #18181b;
  --dui-color-text-muted: #3f3f46;
  --dui-color-text-dim: #71717a;
  --dui-color-accent: #9333ea;
  --dui-color-accent-high: #6b21a8;
  --dui-color-accent-low: #f3e8ff;
  --dui-color-error: #dc2626;
  --dui-color-success: #059669;
  --dui-color-removed: #dc2626;
  --dui-color-added: #9333ea;
  --dui-color-total: #6b21a8;
}
`

export function CSSTokens(): null {
  useEffect(() => {
    const existing = document.getElementById('dui-css-tokens')
    if (existing !== null) {
      return
    }
    const style = document.createElement('style')
    style.id = 'dui-css-tokens'
    style.textContent = CSS_TOKENS
    document.head.appendChild(style)
  }, [])

  return null
}
