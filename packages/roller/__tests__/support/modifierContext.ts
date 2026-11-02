import type { ModifierContext } from '../../src/modifiers/schema'

/**
 * A complete ModifierContext for calling a modifier directly, as the pipeline
 * always supplies one. Override only what the test cares about.
 */
export function contextOf(overrides: Partial<ModifierContext> = {}): ModifierContext {
  return {
    rollOne: () => 1,
    parameters: { sides: 6, quantity: 1 },
    randomFn: () => 0,
    ...overrides
  }
}
