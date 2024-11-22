import type { RollConfig } from '@randsum/core'
import { D } from '@randsum/dice'

export function isD(arg: unknown): arg is D {
  return arg instanceof D
}

export function isRollConfig(argument: unknown): argument is RollConfig {
  return (
    typeof argument === 'object' &&
    argument instanceof D === false &&
    (argument as RollConfig).sides !== undefined
  )
}
