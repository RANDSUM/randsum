import { roll } from '@randsum/fifth'

// Basic roll with modifier
const result1 = roll({ modifier: 5 })
console.log('Roll with +5 modifier:', result1)

// Roll with advantage
const result2 = roll({
  modifier: 5,
  rollingWith: 'Advantage'
})
console.log('Roll with advantage:', result2)

// Roll with disadvantage
const result3 = roll({
  modifier: -2,
  rollingWith: 'Disadvantage'
})
console.log('Roll with disadvantage:', result3)
