import { Fragment, useSyncExternalStore } from 'react'

export function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
  return () => {
    observer.disconnect()
  }
}

export function useTheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as const)
}

export function DiceUIThemeProvider({
  children
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return <Fragment>{children}</Fragment>
}
