import { D } from './D'
import type { BaseD } from './types'

export const D4: BaseD<number> = new D(4)
export const D6: BaseD<number> = new D(6)
export const D8: BaseD<number> = new D(8)
export const D10: BaseD<number> = new D(10)
export const D12: BaseD<number> = new D(12)
export const D20: BaseD<number> = new D(20)
export const D100: BaseD<number> = new D(100)

export const coin: BaseD<string[]> = new D(['Heads', 'Tails'])
export const fudgeDice: BaseD<string[]> = new D(['+', '+', '+', '-', ' ', ' '])

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
export const AlphaNumDie: BaseD<string[]> = new D(alphanumFaces)
