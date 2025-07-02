export function generateNumericFaces(sides: number): number[] {
  return Array.from({ length: Number(sides) }, (_, index) => index + 1)
}
