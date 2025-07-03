export type NumericDiceNotation = `${number}${'d' | 'D'}${number}${string}`

export type CustomDiceNotation = `${number}${'d' | 'D'}{${string}}`

export type DiceNotation = NumericDiceNotation | CustomDiceNotation
