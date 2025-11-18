import type { RollArgument, RollParams } from '../../types'
import { notationToOptions } from '../../lib/notation'
import { optionsToDescription, optionsToNotation } from '../../lib/transformers'

export function argToParameter(argument: RollArgument, keyIndex: number): RollParams[] {
  if (typeof argument === 'number') {
    return [
      {
        argument,
        sides: argument,
        quantity: 1,
        notation: `1d${argument}`,
        description: [`Roll 1 ${argument}-sided die`],
        key: `Roll ${keyIndex}`,
        arithmetic: 'add'
      }
    ]
  }

  if (typeof argument === 'string') {
    const options = notationToOptions(argument)
    return options.map((opt, index) => {
      const notation = optionsToNotation(opt)
      const description = optionsToDescription(opt)
      return {
        ...opt,
        argument,
        notation: index === 0 && argument.startsWith('-') ? `-${notation}` : notation,
        description,
        key: `Roll ${keyIndex}`,
        arithmetic: opt.arithmetic || 'add'
      }
    })
  }

  // RollOptions object
  const sides = typeof argument.sides === 'number' ? argument.sides : argument.sides.length
  const quantity = argument.quantity ?? 1
  const notation = optionsToNotation(argument)
  const description = optionsToDescription(argument)

  return [
    {
      ...argument,
      argument,
      sides: typeof argument.sides === 'number' ? argument.sides : argument.sides.length,
      quantity,
      notation,
      description,
      key: `Roll ${keyIndex}`,
      arithmetic: argument.arithmetic || 'add',
      faces: typeof argument.sides === 'object' ? argument.sides : undefined
    }
  ]
}

