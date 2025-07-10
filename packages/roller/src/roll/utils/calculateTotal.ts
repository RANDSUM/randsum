export function calculateTotal(rolls: number[], bonus = 0): number {
  return rolls.reduce((acc, cur) => Number(acc) + cur, bonus)
}
