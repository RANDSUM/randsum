import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { type ColorScheme, type FontSizes, type ThemeTokens, fontSizes, getTokens } from '../theme'

interface ThemeState {
  readonly colorScheme: ColorScheme
  readonly tokens: ThemeTokens
  readonly fontSizes: FontSizes
  setTheme(scheme: ColorScheme): void
  toggleTheme(): void
}

function resolveInitialScheme(): ColorScheme {
  // useColorScheme cannot be called here (outside a component), so we default to dark.
  // The root layout calls setTheme() after mount if the system scheme differs.
  return 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorScheme: resolveInitialScheme(),
      tokens: getTokens(resolveInitialScheme()),
      fontSizes,
      setTheme(scheme: ColorScheme) {
        set({ colorScheme: scheme, tokens: getTokens(scheme) })
      },
      toggleTheme() {
        const next: ColorScheme = get().colorScheme === 'dark' ? 'light' : 'dark'
        set({ colorScheme: next, tokens: getTokens(next) })
      }
    }),
    {
      name: 'zustand/theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ colorScheme: state.colorScheme }),
      onRehydrateStorage: () => rehydrated => {
        if (rehydrated) {
          useThemeStore.setState({ tokens: getTokens(rehydrated.colorScheme) })
        }
      }
    }
  )
)

/**
 * Call this once at app startup (e.g. in the root layout) to seed the store
 * from the system color scheme when no persisted preference exists.
 * After a user explicitly calls setTheme, the persisted value takes over.
 */
export function initThemeFromSystem(systemScheme: ColorScheme | null): void {
  const store = useThemeStore.getState()
  // Only apply system scheme if store is still at the default dark value
  // (i.e., the user has not explicitly set a preference yet).
  if (systemScheme && systemScheme !== store.colorScheme) {
    store.setTheme(systemScheme)
  }
}
