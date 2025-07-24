import type { ModifierConfig, ModifierLog } from '../../../types'

export function createArithmeticLog(
  modifier: string,
  options: ModifierConfig | undefined
): ModifierLog {
  return {
    modifier,
    options,
    added: [],
    removed: []
  }
}
