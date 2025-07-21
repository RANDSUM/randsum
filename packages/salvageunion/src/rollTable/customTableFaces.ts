import type { SalvageUnionHit } from '../types'

const customTableFaceIndex: Record<number, SalvageUnionHit> = {
  1: 'Cascade Failure',
  2: 'Failure',
  3: 'Failure',
  4: 'Failure',
  5: 'Failure',
  6: 'Tough Choice',
  7: 'Tough Choice',
  8: 'Tough Choice',
  9: 'Tough Choice',
  10: 'Tough Choice',
  11: 'Success',
  12: 'Success',
  13: 'Success',
  14: 'Success',
  15: 'Success',
  16: 'Success',
  17: 'Success',
  18: 'Success',
  19: 'Success',
  20: 'Nailed It'
}

export const customTableFaces: SalvageUnionHit[] =
  Object.values(customTableFaceIndex)
