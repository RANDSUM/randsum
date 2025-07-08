import type { BaseD } from '../types'
import { CustomDie } from './CustomDie'
import { NumericDie } from './NumericDie'

function D(sides: number): NumericDie
function D(faces: string[]): CustomDie
function D(arg: number | string[]): BaseD {
  if (typeof arg === 'number') {
    return new NumericDie(arg)
  } else {
    return new CustomDie(arg)
  }
}

export { D }
