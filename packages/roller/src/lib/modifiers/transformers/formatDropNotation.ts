import type { DropOptions } from '../../../types'
import { MAGIC_NUMBERS } from '../../constants'

export function formatDropNotation({
  highest,
  lowest,
  greaterThan,
  lessThan,
  exact
}: DropOptions): string | undefined {
  const parts: string[] = []

  if (highest) {
    parts.push(highest === MAGIC_NUMBERS.DEFAULT_DROP_COUNT ? 'H' : `H${highest}`)
  }

  if (lowest) {
    parts.push(lowest === MAGIC_NUMBERS.DEFAULT_DROP_COUNT ? 'L' : `L${lowest}`)
  }

  const dropList: string[] = []

  if (greaterThan !== undefined) {
    dropList.push(`>${greaterThan}`)
  }

  if (lessThan !== undefined) {
    dropList.push(`<${lessThan}`)
  }

  if (exact) {
    dropList.push(...exact.map(String))
  }

  if (dropList.length > 0) {
    parts.push(`D{${dropList.join(',')}}`)
  }

  return parts.length ? parts.join('') : undefined
}
