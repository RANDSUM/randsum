import type { BaseD, CustomDie, NumericDie } from '../types'
import { CustomDieImpl } from './CustomDieImpl'
import { NumericDieImpl } from './NumericDieImpl'

function D(sides: number): NumericDie
function D(faces: string[]): CustomDie
function D(arg: number | string[]): BaseD {
  if (typeof arg === 'number') {
    return new NumericDieImpl(arg)
  } else {
    return new CustomDieImpl(arg)
  }
}

export { D }
