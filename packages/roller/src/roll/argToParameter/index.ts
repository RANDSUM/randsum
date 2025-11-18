import type { RollOptions, RollParams } from '../../types'
import { notationToOptions } from '../../lib/notation'
import { optionsToDescription, optionsToNotation } from '../../lib/transformers'

function fromNumber(arg: number, index: number): RollParams[] {
  const options: RollOptions = { sides: arg, quantity: 1 }
  return fromOptions(options, index, arg)
}

function fromOptions(
  options: RollOptions,
  index: number,
  argument: unknown
): RollParams[] {
  const quantity = options.quantity ?? 1
  const notation = optionsToNotation(options)
  const description = optionsToDescription(options)
  const sides =
    Array.isArray(options.sides) && options.sides.length > 0
      ? options.sides.length
      : (options.sides as number)

  const params: RollParams = {
    sides,
    quantity,
    modifiers: options.modifiers,
    argument,
    notation,
    description,
    arithmetic: options.arithmetic ?? 'add',
    key: 'Roll 1',
    faces: Array.isArray(options.sides) ? options.sides : undefined
  }

  return [params]
}

function fromNotation(arg: string, index: number): RollParams[] {
  const trimmed = arg.trim()
  const normalised = trimmed.replace(/\s+/g, '').toLowerCase()

  // Single-string multi dice notation
  if (/^[+-]?\d+d\d+(?:[+-]\d+d\d+)+$/.test(normalised)) {
    const segments = normalised.match(/[+-]?\d+d\d+/g) ?? []
    const params: RollParams[] = []

    segments.forEach((seg, segIndex) => {
      const arithmetic = seg.startsWith('-') ? 'subtract' : 'add'
      const core = seg.replace(/^[+-]/, '')
      const [qtyStr, sidesStr] = core.split('d')
      const quantity = Number.parseInt(qtyStr, 10)
      const sides = Number.parseInt(sidesStr, 10)
      const options: RollOptions = {
        sides,
        quantity,
        arithmetic
      }
      const baseParams = fromOptions(options, index + segIndex, arg)[0]
      // For subtract arithmetic, notation should be negative
      const notation =
        arithmetic === 'subtract' ? `-${quantity}d${sides}` : `${quantity}d${sides}`

      params.push({
        ...baseParams,
        notation,
        argument: arg
      })
    })

    return params
  }

  const options = notationToOptions(arg)
  return options.flatMap(opt => fromOptions(opt, index, arg))
}

export function argToParameter(
  arg: number | string | RollOptions,
  index: number
): RollParams[] {
  if (typeof arg === 'number') return fromNumber(arg, index)
  if (typeof arg === 'string') return fromNotation(arg, index)
  return fromOptions(arg, index, arg)
}


