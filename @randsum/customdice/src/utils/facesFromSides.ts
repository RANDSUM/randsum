export function facesFromSides(sides: number) {
  return Array.from({ length: sides }, (_, i) => String(i + 1))
}
