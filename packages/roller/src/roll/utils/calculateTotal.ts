function calculateTotal(rolls: string[], bonus?: number): string
function calculateTotal(rolls: number[], bonus?: number): number
function calculateTotal(
  rolls: (string | number)[],
  bonus: number
): string | number
function calculateTotal(
  rolls: (string | number)[],
  bonus = 0
): string | number {
  if (rolls.every((roll) => typeof roll === 'number')) {
    return rolls.reduce((acc, cur) => Number(acc) + cur, bonus)
  }

  return rolls.flat().join(', ')
}

export { calculateTotal }
