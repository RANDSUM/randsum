import type { RollOptions } from '../../types'

export function optionsToSidesFaces<T>({ sides }: RollOptions<T>): {
  sides: number
  faces?: T[]
} {
  if (Array.isArray(sides)) {
    return { sides: sides.length, faces: sides }
  }
  return { sides }
}
