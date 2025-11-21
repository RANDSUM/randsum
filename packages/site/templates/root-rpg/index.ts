import { rollRootRpg } from '@randsum/root-rpg'
import type { RootRpgRollResult } from '@randsum/root-rpg'

// Basic roll with modifier
const result: RootRpgRollResult = rollRootRpg(2)
console.log('Roll result:', result)
console.log('Outcome:', result.outcome) // 'Strong Hit' | 'Weak Hit' | 'Miss'
console.log('Roll total:', result.roll)

// Type-safe result handling
switch (result.outcome) {
  case 'Strong Hit':
    console.log('Strong Hit! (10 or higher)')
    break
  case 'Weak Hit':
    console.log('Weak Hit (7-9)')
    break
  case 'Miss':
    console.log('Miss (6 or lower)')
    break
}
