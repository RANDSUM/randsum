import { rollTable } from '@randsum/salvageunion'
import type { SalvageUnionTableResult } from '@randsum/salvageunion'

// Basic roll with default table
const result1: SalvageUnionTableResult = rollTable()
console.log('Default table roll:', result1)
console.log('Hit type:', result1.hit)
console.log('Label:', result1.label)
console.log('Description:', result1.description)

// Roll with specific table
const result2 = rollTable('Morale')
console.log('\nMorale table roll:', result2)

// Type-safe result handling
const result3 = rollTable('Core Mechanic')
switch (result3.hit) {
  case 'Nailed It':
    console.log('Nailed It! (20)')
    break
  case 'Success':
    console.log('Success (11-19)')
    break
  case 'Tough Choice':
    console.log('Tough Choice (6-10)')
    break
}
