import { D } from '.'
import type { CustomDieInterface, NumericDieInterface } from '../types'

export const D4: NumericDieInterface = D(4)

export const D6: NumericDieInterface = D(6)

export const D8: NumericDieInterface = D(8)

export const D10: NumericDieInterface = D(10)

export const D12: NumericDieInterface = D(12)

export const D20: NumericDieInterface = D(20)

export const D100: NumericDieInterface = D(100)

export const coin: CustomDieInterface = D(['Heads', 'Tails'])

export const fudgeDice: CustomDieInterface = D(['+', '+', '+', '-', ' ', ' '])

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

export const alphaNumDie: CustomDieInterface = D(alphanumFaces)
