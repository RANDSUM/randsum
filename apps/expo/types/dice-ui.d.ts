// Ambient type declarations for @randsum/dice-ui native API.
// Reflects the native (.native.tsx) component signatures used by the Expo app.
// The Metro bundler resolves .native.tsx at runtime; this file gives TypeScript
// the correct types without requiring dice-ui to ship pre-built declarations.

import type { RollRecord } from '@randsum/roller'

declare module '@randsum/dice-ui' {
  export interface RollResult {
    readonly total: number
    readonly records: readonly RollRecord[]
    readonly notation: string
  }

  export interface NotationRollerProps {
    readonly defaultNotation?: string
    readonly notation?: string
    readonly onChange?: (notation: string) => void
    readonly resetToken?: number
    readonly onRoll?: (result: RollResult) => void
    readonly showRollButton?: boolean
  }

  export function NotationRoller(props?: NotationRollerProps): React.JSX.Element

  export interface QuickReferenceGridProps {
    readonly onAdd: (fragment: string) => void
    readonly notation?: string
    readonly inverted?: boolean
    readonly suppressModal?: boolean
    readonly selectedEntry?: string | null
    readonly onSelect?: (entryKey: string) => void
  }

  export interface DocModalProps {
    readonly doc: import('@randsum/roller/docs').NotationDoc
    readonly accentColor: string
    readonly notation: string
    readonly onClose: () => void
    readonly onAdd: (fragment: string) => void
  }

  export function DocModal(props: DocModalProps): React.JSX.Element

  export function QuickReferenceGrid(props: QuickReferenceGridProps): React.JSX.Element

  export function DiceUIThemeProvider(props: {
    readonly theme: 'light' | 'dark'
    readonly children: React.ReactNode
  }): React.JSX.Element

  export function useTheme(): 'light' | 'dark'
  export function getTheme(): 'light' | 'dark'
  export function subscribeTheme(callback: () => void): () => void

  export function tokenColor(doc: unknown, theme: 'light' | 'dark'): string | undefined

  export interface RollResultPanelProps {
    readonly total: number
    readonly records: readonly RollRecord[]
    readonly notation: string
    readonly onClose?: () => void
    readonly className?: string
  }

  export function RollResultPanel(props: RollResultPanelProps): React.JSX.Element
  export function RollResultDisplay(props: {
    readonly records: readonly RollRecord[]
    readonly total?: number
    readonly notation?: string
  }): React.JSX.Element
}
