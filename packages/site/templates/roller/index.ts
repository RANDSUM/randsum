import { roll } from '@randsum/roller'

// Basic roll
console.log('Rolling 1d20:', roll('1d20'))

// Character stat roll (4d6, drop lowest)
const abilityScore = roll('4d6L')
console.log('Ability Score (4d6L):', abilityScore)

// Advantage roll
const advantageRoll = roll('2d20H')
console.log('Advantage (2d20H):', advantageRoll)

// Complex notation
const complexRoll = roll('4d6L!R{<3}')
console.log('Complex roll (4d6L!R{<3}):', complexRoll)
