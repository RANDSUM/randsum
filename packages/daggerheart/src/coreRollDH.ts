import { roll } from '@randsum/dice'
import type { CoreRollResultDH } from 'packages/daggerheart/src/types'

export function coreRollDH(modifier?: number): CoreRollResultDH {
  const arg = `2D12+${String(modifier)}`
  const {result: [hope, fear], total} = roll(arg)
  if(!hope || !fear) {
    throw new Error('Failed to roll hope and fear')
  }

  return {
    type: hope > fear ? 'hope' : 'fear',
    total,
    rolls: {
      hope,
      fear,
      modifier: modifier ?? 0
    }
  }
}
