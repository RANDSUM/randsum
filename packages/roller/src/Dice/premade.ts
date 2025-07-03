import { D } from '.'
import type { CustomDie, NumericDie } from '../types'

export const D4: NumericDie = D(4)

export const D6: NumericDie = D(6)

export const D8: NumericDie = D(8)

export const D10: NumericDie = D(10)

export const D12: NumericDie = D(12)

export const D20: NumericDie = D(20)

export const D100: NumericDie = D(100)

export const coin: CustomDie = D(['Heads', 'Tails'])

export const fudgeDice: CustomDie = D(['+', '+', '+', '-', ' ', ' '])

const alphanumFaces = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9'
]

export const alphaNumDie: CustomDie = D(alphanumFaces)
