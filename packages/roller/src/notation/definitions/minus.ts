import type { NotationSchema } from '../schema'
import { createArithmeticNotation } from './arithmetic'

export const minusSchema: NotationSchema<number> = createArithmeticNotation({
  name: 'minus',
  priority: 91,
  operator: '-',
  verb: 'Subtract'
})
