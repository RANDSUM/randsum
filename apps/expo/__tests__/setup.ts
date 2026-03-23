import { mock } from 'bun:test'

mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (_key: string): Promise<string | null> => null,
    setItem: async (_key: string, _value: string): Promise<void> => undefined,
    removeItem: async (_key: string): Promise<void> => undefined,
    mergeItem: async (_key: string, _value: string): Promise<void> => undefined,
    clear: async (): Promise<void> => undefined,
    getAllKeys: async (): Promise<readonly string[]> => [],
    multiGet: async (_keys: readonly string[]): Promise<readonly [string, string | null][]> => [],
    multiSet: async (_keyValuePairs: readonly [string, string][]): Promise<void> => undefined,
    multiRemove: async (_keys: readonly string[]): Promise<void> => undefined
  }
}))

mock.module('react-native', () => ({
  useColorScheme: () => 'dark',
  StyleSheet: {
    create: <T extends Record<string, object>>(styles: T): T => styles
  },
  Share: {
    share: async (_opts: { message: string; url?: string }): Promise<{ action: string }> => ({
      action: 'sharedAction'
    })
  }
}))
