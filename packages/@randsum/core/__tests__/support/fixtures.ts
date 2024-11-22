import type { RollConfig } from '../../src/types'

export function createRollConfig(
  override: Partial<RollConfig> = {}
): RollConfig {
  return {
    quantity: 1,
    sides: 6,
    ...override
  }
}
