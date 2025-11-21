import { rollBlades } from '@randsum/blades'
import type { BladesRollResult } from '@randsum/blades'

// Basic roll with dice pool
const result1: BladesRollResult = rollBlades(2)
console.log('Roll with 2 dice:', result1)
console.log('Outcome:', result1.outcome) // 'critical' | 'success' | 'partial' | 'failure'

// Different dice pool sizes
console.log('\nDifferent positions:')
console.log('Desperate (1 die):', rollBlades(1))
console.log('Risky (2 dice):', rollBlades(2))
console.log('Controlled (3 dice):', rollBlades(3))
console.log('Controlled with assistance (4 dice):', rollBlades(4))
