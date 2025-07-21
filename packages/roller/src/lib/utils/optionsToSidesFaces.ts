import type { RollOptions } from '../../types'

export function optionsToSidesFaces<T>(options: RollOptions<T>): {
  sides: number
  faces?: T[]
} {
  if (Array.isArray(options.sides)) {
    return { sides: options.sides.length, faces: options.sides }
  }
  return { sides: options.sides }
}
