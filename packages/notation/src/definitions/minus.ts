import type { NotationSchema } from '../schema'
import { createArithmeticNotation } from './arithmetic'
import { registerNotationSchema } from '../registry'

export const minusSchema: NotationSchema<number> = createArithmeticNotation({
  name: 'minus',
  priority: 91,
  operator: '-',
  verb: 'Subtract'
})

registerNotationSchema(minusSchema)
