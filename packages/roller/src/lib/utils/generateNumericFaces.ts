// Cache for commonly used numeric faces arrays
const facesCache = new Map<number, number[]>()

// Pre-populate cache with standard dice sizes for optimal performance
const STANDARD_DICE_SIZES = [2, 3, 4, 6, 8, 10, 12, 20, 100] as const

// Initialize cache with standard dice sizes
for (const sides of STANDARD_DICE_SIZES) {
  facesCache.set(
    sides,
    Array.from({ length: sides }, (_, index) => index + 1)
  )
}

export function generateNumericFaces(sides: number): number[] {
  const numSides = Number(sides)

  // Check cache first
  const cached = facesCache.get(numSides)
  if (cached) {
    return cached
  }

  // Generate and cache new faces array
  const faces = Array.from({ length: numSides }, (_, index) => index + 1)
  facesCache.set(numSides, faces)

  return faces
}
