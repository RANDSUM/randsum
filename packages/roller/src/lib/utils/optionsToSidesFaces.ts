import type { RollOptions } from '../../types'

export function optionsToSidesFaces(options: RollOptions): {
  sides: number
  faces?: string[]
} {
  if (Array.isArray(options.sides)) {
    return { sides: options.sides.length, faces: options.sides }
  }
  return { sides: options.sides }
}
