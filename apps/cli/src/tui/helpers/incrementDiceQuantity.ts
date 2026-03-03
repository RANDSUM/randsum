export function incrementDiceQuantity(currentInput: string, sides: number): string {
  if (currentInput === '') return `1d${sides}`

  const pattern = new RegExp(`(\\d+)(d${sides})(?!\\d)`, 'i')
  const match = pattern.exec(currentInput)

  if (match?.[1] !== undefined) {
    const newQuantity = Number(match[1]) + 1
    return currentInput.replace(pattern, `${newQuantity}$2`)
  }

  return `${currentInput}+1d${sides}`
}
